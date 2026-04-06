import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"

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

function buildPrompt(body: Record<string, unknown>): string {
  const {
    goal, adults, kids, meals_together, meals, units,
    will_eat, wont_eat, budget, use_leftovers,
    vegetarian_night, keep_simple, household_type,
  } = body

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

FOOD PREFERENCES:
- Will eat: ${Array.isArray(will_eat) && will_eat.length ? will_eat.join(", ") : "everything"}
- Won't eat (treat as allergies — never include): ${wont_eat || "nothing"}

WEEK RULES:
${use_leftovers ? "- Include exactly ONE meal that uses leftovers from a previous meal that week. Set is_leftover: true for that meal." : "- No leftover meals."}
${vegetarian_night ? "- Include exactly ONE fully vegetarian dinner." : ""}
${keep_simple ? "- Keep meals simple: max 6 ingredients, under 30 min prep time." : ""}

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Build and call AI
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPrompt(body) }],
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

    // Attempt to save to Supabase — non-fatal if unauthenticated
    let savedPlanId: string | null = null
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

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
    console.error("Plan generation error:", err)
    return NextResponse.json(
      { error: "Failed to generate plan. Please try again." },
      { status: 500 }
    )
  }
}
