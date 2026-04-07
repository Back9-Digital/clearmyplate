import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const ownerUserId = req.nextUrl.searchParams.get("owner")
  if (!ownerUserId) return NextResponse.json({ error: "owner param required" }, { status: 400 })

  const admin = adminClient()

  // Validate that current user is actually a member of this household
  const { data: membership } = await admin
    .from("household_members")
    .select("id")
    .eq("household_id", ownerUserId)
    .eq("member_id", user.id)
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this household" }, { status: 403 })
  }

  // Get the owner's household_profiles row
  const { data: householdProfile } = await admin
    .from("household_profiles")
    .select("id")
    .eq("user_id", ownerUserId)
    .maybeSingle()

  if (!householdProfile) {
    return NextResponse.json({ plan: null })
  }

  // Fetch the most recent plan
  const { data: dbPlan } = await admin
    .from("plans")
    .select("id, week_start_date, plan_items(*), grocery_lists(items)")
    .eq("household_id", householdProfile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!dbPlan || !(dbPlan.plan_items as unknown[])?.length) {
    return NextResponse.json({ plan: null })
  }

  type Meal = {
    day_of_week: number
    day_name: string
    meal_type: string
    meal_name: string
    description: string
    key_ingredients: string[]
    is_leftover: boolean
    prep_time_mins: number
    portion_notes: string
  }
  type GroceryItem = { category: string; name: string; quantity: string; checked: boolean }

  const meals = (dbPlan.plan_items as Meal[]).sort((a, b) => a.day_of_week - b.day_of_week)
  const groceryRaw = (dbPlan.grocery_lists as { items: GroceryItem[] }[])[0]?.items ?? []
  const grocery = groceryRaw.map((g) => ({ ...g, checked: false }))

  return NextResponse.json({
    plan: {
      plan_id: dbPlan.id,
      week_start_date: dbPlan.week_start_date,
      meals,
      grocery_list: grocery,
    },
  })
}
