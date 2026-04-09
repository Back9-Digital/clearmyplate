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

  console.log("[household/plan] member:", user.id, "requesting plan for owner:", ownerUserId)

  const admin = adminClient()

  // Validate that current user is actually a member of this household
  const { data: membership } = await admin
    .from("household_members")
    .select("id")
    .eq("household_id", ownerUserId)
    .eq("member_id", user.id)
    .maybeSingle()

  console.log("[household/plan] membership row:", membership)

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this household" }, { status: 403 })
  }

  // Read the owner's latest plan directly from their profile row
  const { data: ownerProfile, error: profileError } = await admin
    .from("profiles")
    .select("latest_plan")
    .eq("id", ownerUserId)
    .maybeSingle()

  console.log("[household/plan] owner profile latest_plan:", ownerProfile?.latest_plan ? "present" : "null", "error:", profileError?.message)

  if (!ownerProfile?.latest_plan) {
    return NextResponse.json({ plan: null })
  }

  type GroceryItem = { category: string; name: string; quantity: string; checked: boolean }

  const stored = ownerProfile.latest_plan as {
    plan_id: string | null
    week_start_date: string
    meals: unknown[]
    grocery_list: GroceryItem[]
  }

  const grocery = (stored.grocery_list ?? []).map((g) => ({ ...g, checked: false }))

  return NextResponse.json({
    plan: {
      plan_id:         stored.plan_id ?? null,
      week_start_date: stored.week_start_date,
      meals:           stored.meals ?? [],
      grocery_list:    grocery,
    },
  })
}
