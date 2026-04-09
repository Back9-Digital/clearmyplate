import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
import {
  generationsAllowed,
  generationsRemaining,
  weekNeedsReset,
  getLastMondayMidnightUTC,
  isPaidPlan,
  trialDaysRemaining,
} from "@/lib/generations"
import { ghlAddTags } from "@/lib/ghl"
import { sendPushToUser } from "@/lib/push"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are ClearMyPlate, a calm, practical meal planning assistant for New Zealand families. You create realistic, delicious weekly meal plans that fit the household's preferences, budget, and goals. You use metric measurements (kg, g, ml, L). You suggest NZ-available ingredients and realistic NZ supermarket prices. You do NOT shame food choices, count calories obsessively, or push diet culture. You focus on simple, satisfying meals the whole family will actually eat. You always respond with valid JSON only - no markdown, no explanation, just the JSON object.`

function buildPortionGuidance(goal: string, householdTypes: string[]): string {
  const h = householdTypes.length ? householdTypes : ["mixed_household"]

  if (goal === "build_muscle" && h.includes("active_adults"))
    return "Highest protein focus, biggest portions, 35–45g protein per adult per meal. Prioritise chicken thighs, beef, eggs, legumes."
  if (goal === "build_muscle" && h.includes("weight_management"))
    return "Lean high-protein meals — chicken breast, fish, legumes. High-volume vegetables. Avoid heavy starches."
  if (goal === "build_muscle")
    return "Protein-focused but kid-friendly. Note kid adaptations (e.g. smaller portion, blander sauce). 30–40g protein per adult."
  if (goal === "lose_weight" && h.includes("weight_management"))
    return "Lean proteins, high-volume vegetables. Substitute cauliflower rice or extra veg for pasta/rice where possible. Keep meals genuinely satisfying."
  if (goal === "lose_weight" && h.includes("active_adults"))
    return "Filling and sustaining but lean. Big veg portions, lean proteins, avoid heavy sauces."
  if (goal === "lose_weight")
    return "Lighter adult portions, normal for kids. Same meal with serving notes (e.g. 'Adults: skip the rice, extra salad'). Never frame as diet food."
  // maintain + any
  return "Balanced, stress-free family meals. No restrictions, focus on variety and enjoyment."
}

type MealPref = { recipe_name: string; frequency: string }

const FREQUENCY_LABELS: Record<string, string> = {
  weekly:      "weekly",
  fortnightly: "every 2 weeks",
  monthly:     "once a month",
  ai_choice:   "whenever it feels right",
}

function buildMealPrefsSection(prefs: MealPref[]): string {
  if (!prefs.length) return ""
  const lines = prefs.map(
    (p) => `- ${p.recipe_name}: ${FREQUENCY_LABELS[p.frequency] ?? p.frequency}`
  )
  return `\nFAMILY MEAL PREFERENCES (respect these frequencies when building the plan):\n${lines.join("\n")}\n`
}

type FamilyMember = { role: "adult" | "child"; name: string }

function buildFamilySection(members: FamilyMember[]): string {
  const named = members.filter((m) => m.name?.trim())
  if (!named.length) return ""
  const lines = named.map((m) => `- ${m.name} (${m.role})`)
  return `\nFAMILY MEMBERS (use names in portion notes where helpful, e.g. "Phil's portion: 200g"):\n${lines.join("\n")}\n`
}

function buildAllergySection(allergies: string[]): string {
  if (!allergies.length) return ""
  return `\nSTRICT ALLERGIES — NEVER include these ingredients or derivatives under any circumstances:\n${allergies.map((a) => `- ${a}`).join("\n")}\nThis is a hard safety rule. Cross-contamination risk is real. Do not include, suggest, or reference these.\n`
}

function buildPrompt(body: Record<string, unknown>): string {
  const {
    goal, adults, kids, meals_together, meals, units,
    will_eat, wont_eat, budget, use_leftovers,
    vegetarian_night, keep_simple, household_type,
    meal_preferences,
    calorie_target, macro_protein, macro_carbs, macro_fat,
    family_members, allergies,
  } = body

  const mealPrefs: MealPref[]    = Array.isArray(meal_preferences) ? meal_preferences : []
  const familyArr: FamilyMember[] = Array.isArray(family_members) ? family_members : []
  const allergyArr: string[]      = Array.isArray(allergies) ? allergies.filter(Boolean) : []

  const macroSection = calorie_target
    ? `\nCALORIE & MACRO TARGETS (per adult, per day — size portions to hit these):
- Calories: ${calorie_target} kcal
- Protein: ${macro_protein}% (~${Math.round((Number(calorie_target) * Number(macro_protein)) / 100 / 4)}g)
- Carbs: ${macro_carbs}% (~${Math.round((Number(calorie_target) * Number(macro_carbs)) / 100 / 4)}g)
- Fat: ${macro_fat}% (~${Math.round((Number(calorie_target) * Number(macro_fat)) / 100 / 9)}g)
Include a brief per-meal note if a dish is particularly high or low in any macro.\n`
    : ""

  const householdTypes: string[] = Array.isArray(household_type) && household_type.length
    ? household_type
    : ["mixed_household"]

  const portionGuidance = buildPortionGuidance(goal as string, householdTypes)

  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - today.getDay() + 1)
  const weekStart = monday.toISOString().split("T")[0]

  return `Create a 7-day dinner meal plan for this household.

HOUSEHOLD:
- Adults: ${adults}, Kids: ${kids}
- Eat together: ${meals_together}
- Meal types: ${Array.isArray(meals) ? meals.join(", ") : "dinner"}
- Units: ${units || "metric"}
- Weekly grocery budget: NZD $${budget || 200}

GOAL: ${goal}
HOUSEHOLD TYPE: ${householdTypes.join(", ")}
PORTION GUIDANCE: ${portionGuidance}
${buildFamilySection(familyArr)}${buildAllergySection(allergyArr)}
PERMITTED PROTEINS & CARB BASES — HARD RULE:
${Array.isArray(will_eat) && will_eat.length
  ? `ONLY use these as the base proteins and carb bases across all 7 meals: ${will_eat.join(", ")}. Do NOT use any other proteins or carb bases not on this list. Every meal must be built around one or more of these ingredients.`
  : "No restrictions — use any proteins and carb bases."}

EXCLUDED INGREDIENTS — HARD RULE:
${wont_eat
  ? `NEVER include ${wont_eat} in any meal, in any form. This is a strict exclusion, not a suggestion.`
  : "No additional exclusions."}

WEEK RULES:
${use_leftovers ? "- Include exactly ONE meal that uses leftovers from a previous meal that week. Set is_leftover: true for that meal." : "- No leftover meals."}
${vegetarian_night ? "- Include exactly ONE fully vegetarian dinner." : ""}
${keep_simple ? "- Keep meals simple: max 6 ingredients, under 30 min prep time." : ""}

${buildMealPrefsSection(mealPrefs)}${macroSection}
TONE RULES:
- Never use restrictive or diet-culture language in meal names or descriptions
- Frame portions as 'satisfying' and 'filling', never 'light' or 'diet'
- Note kid-friendly adaptations inline where relevant
- Use NZ-available ingredients and metric measurements

Respond with exactly this JSON structure (no markdown, just JSON):
{
  "week_start_date": "${weekStart}",
  "meals": [
    {
      "day_of_week": 1,
      "day_name": "Monday",
      "meal_type": "dinner",
      "meal_name": "Meal Name",
      "description": "One appealing sentence describing the meal.",
      "key_ingredients": ["ingredient1", "ingredient2", "ingredient3", "ingredient4"],
      "is_leftover": false,
      "prep_time_mins": 25,
      "portion_notes": "Adults: 200g chicken, Kids: 120g chicken"
    }
  ],
  "grocery_list": [
    {"category": "Proteins", "name": "Chicken thighs", "quantity": "1 kg"},
    {"category": "Produce", "name": "Lemons", "quantity": "3"},
    {"category": "Pantry", "name": "Olive oil", "quantity": "500 ml"}
  ]
}

day_of_week: 1=Monday through 7=Sunday. Include all 7 days. grocery_list categories: Proteins, Produce, Dairy & Eggs, Pantry, Bakery.`
}

/** Truncate a string to maxLen chars to prevent prompt inflation */
function truncate(s: unknown, maxLen: number): string {
  if (typeof s !== "string") return ""
  return s.slice(0, maxLen)
}

/** Sanitise and cap an array of strings */
function safeStringArray(arr: unknown, maxItems: number, maxItemLen: number): string[] {
  if (!Array.isArray(arr)) return []
  return arr
    .filter((x) => typeof x === "string")
    .slice(0, maxItems)
    .map((x) => (x as string).slice(0, maxItemLen))
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json()

    // ── Input sanitisation — prevent prompt inflation / token exhaustion ──
    const body = {
      ...rawBody,
      // Free-text fields capped to prevent runaway prompts
      wont_eat:    truncate(rawBody.wont_eat, 300),
      // Arrays capped on both count and per-item length
      will_eat:    safeStringArray(rawBody.will_eat,    20, 50),
      allergies:   safeStringArray(rawBody.allergies,   20, 50),
      household_type: safeStringArray(rawBody.household_type, 5, 50),
      // Family member names: max 10 members, names capped at 30 chars
      family_members: Array.isArray(rawBody.family_members)
        ? rawBody.family_members.slice(0, 10).map((m: { role?: string; name?: string }) => ({
            role: typeof m?.role === "string" ? m.role.slice(0, 20) : "adult",
            name: typeof m?.name === "string" ? m.name.slice(0, 30) : "",
          }))
        : [],
      // Meal prefs: max 30 saved meals in prompt
      meal_preferences: Array.isArray(rawBody.meal_preferences)
        ? rawBody.meal_preferences.slice(0, 30)
        : [],
      // Numeric fields — coerce and clamp
      adults: Math.min(Math.max(Number(rawBody.adults) || 1, 1), 20),
      kids:   Math.min(Math.max(Number(rawBody.kids)   || 0, 0), 20),
      budget: Math.min(Math.max(Number(rawBody.budget)  || 200, 10), 10000),
    }

    // ── Auth + generation limit check ──────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("plan_type, generations_this_week, week_reset_at, calorie_target, macro_protein, macro_carbs, macro_fat, family_members, allergies, goal, household_adults, household_kids, weekly_budget, will_eat, wont_eat, use_leftovers, vegetarian_night, keep_simple")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      console.error("[generate] Profile fetch failed:", {
        message: profileError?.message,
        code:    profileError?.code,
        details: profileError?.details,
        hint:    profileError?.hint,
      })
      return NextResponse.json({ error: "Profile not found" }, { status: 500 })
    }

    const planType = profile.plan_type ?? "free"

    // ── Free trial expiry check — use auth user.created_at (always present) ──
    if (!isPaidPlan(planType)) {
      const daysLeft = trialDaysRemaining(user.created_at ?? new Date().toISOString())
      if (daysLeft <= 0) {
        return NextResponse.json(
          { error: "Your free trial has expired. Upgrade to continue.", trialExpired: true },
          { status: 403 }
        )
      }
    }

    // ── Weekly reset — paid plans only ─────────────────────────
    let currentUsed = profile.generations_this_week ?? 0
    if (isPaidPlan(planType) && weekNeedsReset(profile.week_reset_at ?? new Date().toISOString())) {
      await supabase
        .from("profiles")
        .update({
          generations_this_week: 0,
          week_reset_at: getLastMondayMidnightUTC().toISOString(),
        })
        .eq("id", user.id)
      currentUsed = 0
    }

    const limit     = generationsAllowed(planType)
    const remaining = generationsRemaining(planType, currentUsed)

    if (remaining <= 0) {
      return NextResponse.json(
        {
          error: "Generation limit reached",
          limitReached: true,
          planType,
          limit,
        },
        { status: 403 }
      )
    }
    // ───────────────────────────────────────────────────────────

    // Fetch meal preferences to inject into prompt
    const { data: mealPrefsData } = await supabase
      .from("meal_preferences")
      .select("recipe_name, frequency")
      .eq("user_id", user.id)

    // Build and call AI
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPrompt({
        ...body,
        meal_preferences: mealPrefsData ?? [],
        calorie_target:   profile.calorie_target ?? null,
        macro_protein:    profile.macro_protein  ?? null,
        macro_carbs:      profile.macro_carbs    ?? null,
        macro_fat:        profile.macro_fat      ?? null,
        family_members:   profile.family_members ?? [],
        allergies:        profile.allergies      ?? (Array.isArray(body.allergies) ? body.allergies : []),
        // Preference columns — use profile when explicitly saved (will_eat !== null is the sentinel),
        // otherwise fall back to request body (e.g. first onboarding generate, or API callers)
        ...(profile.will_eat !== null ? {
          goal:             profile.goal             ?? body.goal,
          adults:           profile.household_adults != null ? profile.household_adults : body.adults,
          kids:             profile.household_kids   != null ? profile.household_kids   : body.kids,
          budget:           profile.weekly_budget    ?? body.budget,
          will_eat:         profile.will_eat,
          wont_eat:         profile.wont_eat         ?? body.wont_eat,
          use_leftovers:    profile.use_leftovers,
          vegetarian_night: profile.vegetarian_night,
          keep_simple:      profile.keep_simple,
        } : {}),
      }) }],
    })

    const raw = message.content[0].type === "text" ? message.content[0].text : ""
    let parsed: {
      week_start_date: string
      meals: {
        day_of_week: number
        day_name: string
        meal_type: string
        meal_name: string
        description: string
        key_ingredients: string[]
        is_leftover: boolean
        prep_time_mins: number
        portion_notes: string
      }[]
      grocery_list: { category: string; name: string; quantity: string }[]
    }

    try {
      parsed = JSON.parse(raw)
    } catch {
      // Strip any accidental markdown fences
      const cleaned = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim()
      parsed = JSON.parse(cleaned)
    }

    // Save latest plan to profile so household members can access it
    await supabase
      .from("profiles")
      .update({
        generations_this_week: currentUsed + 1,
        latest_plan: {
          plan_id:         savedPlanId,
          week_start_date: parsed.week_start_date,
          meals:           parsed.meals,
          grocery_list:    parsed.grocery_list,
        },
      })
      .eq("id", user.id)

    // Non-blocking GHL tag + push after successful generation
    if (user.email) {
      ghlAddTags(user.email, ["plan-generated"]).catch(() => {})
    }
    sendPushToUser(user.id, {
      title: "Your meal plan is ready! 🍽️",
      body:  "This week's 7-day dinner plan is waiting for you.",
      url:   "/dashboard/plan",
    }).catch(() => {})

    // Attempt to save plan to Supabase — non-fatal if tables don't exist yet
    let savedPlanId: string | null = null
    try {
      if (user) {
        const { data: profile } = await supabase
          .from("household_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single()

        if (profile) {
          const householdTypes: string[] = Array.isArray(body.household_type) && body.household_type.length
            ? body.household_type
            : ["mixed_household"]

          // Upsert preferences (including household_type if column exists)
          await supabase.from("preferences").upsert({
            household_id: profile.id,
            goal: body.goal,
            budget_weekly_nzd: body.budget ?? 200,
            will_eat: body.will_eat ?? [],
            wont_eat: body.wont_eat ? [body.wont_eat] : [],
            pref_use_leftovers: body.use_leftovers ?? true,
            household_type: householdTypes,
          }, { onConflict: "household_id" })

          // Save plan
          const preferencesSnapshot = {
            goal: body.goal,
            household_type: householdTypes,
            adults: body.adults,
            kids: body.kids,
            budget: body.budget,
            will_eat: body.will_eat,
            wont_eat: body.wont_eat,
            use_leftovers: body.use_leftovers,
            vegetarian_night: body.vegetarian_night,
            keep_simple: body.keep_simple,
          }

          const { data: plan } = await supabase
            .from("plans")
            .insert({
              household_id: profile.id,
              week_start_date: parsed.week_start_date,
              status: "active",
              preferences_snapshot: preferencesSnapshot,
            })
            .select()
            .single()

          if (plan) {
            savedPlanId = plan.id

            // Save plan items
            const items = parsed.meals.map((meal) => ({
              plan_id: plan.id,
              day_of_week: meal.day_of_week,
              meal_type: meal.meal_type,
              meal_name: meal.meal_name,
              description: meal.description,
              key_ingredients: meal.key_ingredients,
              // Store extra fields in key_ingredients metadata via description extension
            }))
            await supabase.from("plan_items").insert(items)

            // Save grocery list
            await supabase.from("grocery_lists").insert({
              plan_id: plan.id,
              household_id: profile.id,
              items: parsed.grocery_list,
            })
          }
        }
      }
    } catch {
      // Supabase save failed — still return the plan
    }

    return NextResponse.json({
      plan_id: savedPlanId,
      week_start_date: parsed.week_start_date,
      meals: parsed.meals,
      grocery_list: parsed.grocery_list,
    })
  } catch (err) {
    console.error("[generate] Plan generation error:", err)
    if (err instanceof Error) {
      console.error("[generate] Error name:", err.name)
      console.error("[generate] Error message:", err.message)
      console.error("[generate] Error stack:", err.stack)
    }
    return NextResponse.json(
      { error: "Failed to generate plan. Please try again.", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
