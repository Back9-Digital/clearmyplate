import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are ClearMyPlate, a practical NZ family meal planning assistant. You write clear, achievable recipes for everyday home cooks. Use metric measurements (g, ml, kg, L, tsp, tbsp, cups). Suggest NZ-available ingredients. Write steps that are clear enough for a beginner. Never count calories or use diet-culture language. Always respond with valid JSON only — no markdown, no explanation.`

export async function POST(req: NextRequest) {
  try {
    // Auth required — endpoint calls Anthropic API which costs money
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
    }

    const { meal_name, description, key_ingredients, adults = 2, kids = 0, goal = "maintain" } = await req.json()

    if (!meal_name) {
      return NextResponse.json({ error: "meal_name is required" }, { status: 400 })
    }

    // Check cache in Supabase first
    try {
      const { data: cached } = await supabase
        .from("meal_recipes")
        .select("recipe_json")
        .eq("meal_name", meal_name)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (cached?.recipe_json) {
        return NextResponse.json(cached.recipe_json)
      }
    } catch {
      // Cache miss or table doesn't exist — continue to generate
    }

    const serves = adults + Math.ceil(kids * 0.6)

    const prompt = `Write a full recipe for "${meal_name}".

Context:
- Description: ${description || "A family dinner"}
- Key ingredients to include: ${Array.isArray(key_ingredients) && key_ingredients.length ? key_ingredients.join(", ") : "as needed"}
- Serves: ${serves} (${adults} adult${adults !== 1 ? "s" : ""}${kids > 0 ? `, ${kids} kid${kids !== 1 ? "s" : ""}` : ""})
- Household goal: ${goal}

Use NZ-available ingredients and metric measurements. Write steps clearly enough for a beginner home cook. Keep it practical and achievable on a weeknight.

Respond with exactly this JSON structure:
{
  "meal_name": "${meal_name}",
  "serves": ${serves},
  "prep_time_mins": 15,
  "cook_time_mins": 25,
  "ingredients": [
    { "name": "chicken thighs", "quantity": "600 g", "notes": "bone-in or boneless" }
  ],
  "steps": [
    "Preheat oven to 200°C fan bake.",
    "Season the chicken..."
  ],
  "tips": [
    "This keeps well in the fridge for up to 3 days.",
    "For kids, serve the sauce on the side."
  ],
  "storage": "Store leftovers in an airtight container in the fridge for up to 3 days. Reheat in a pan over medium heat or microwave until piping hot."
}`

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    })

    const raw = message.content[0].type === "text" ? message.content[0].text : ""
    let recipe: Record<string, unknown>
    try {
      recipe = JSON.parse(raw)
    } catch {
      const cleaned = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim()
      recipe = JSON.parse(cleaned)
    }

    // Save to cache (non-fatal)
    try {
      await supabase.from("meal_recipes").insert({ meal_name, recipe_json: recipe })
    } catch {
      // Cache save failed — still return recipe
    }

    return NextResponse.json(recipe)
  } catch (err) {
    console.error("[recipe] Error:", err)
    // Do not leak internal error details to the client
    return NextResponse.json({ error: "Failed to generate recipe." }, { status: 500 })
  }
}
