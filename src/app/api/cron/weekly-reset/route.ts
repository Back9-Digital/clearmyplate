import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/** Returns 0–6 (Sun–Sat) for the current time in Pacific/Auckland */
function getNZTDayOfWeek(): number {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Pacific/Auckland" })
  ).getDay()
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const todayDow = getNZTDayOfWeek()
  const supabase = adminClient()

  // Find all paid users whose grocery_day matches today in NZT
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id")
    .neq("plan_type", "free")
    .eq("grocery_day", todayDow)

  if (error) {
    console.error("[cron/weekly-reset] Query error:", error)
    return NextResponse.json({ error: "Query failed" }, { status: 500 })
  }

  const ids = (profiles ?? []).map((p) => p.id)

  if (!ids.length) {
    console.log(`[cron/weekly-reset] No users with grocery_day=${todayDow}`)
    return NextResponse.json({ ok: true, reset: 0 })
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      generations_this_week: 0,
      week_reset_at: new Date().toISOString(),
    })
    .in("id", ids)

  if (updateError) {
    console.error("[cron/weekly-reset] Update error:", updateError)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }

  console.log(`[cron/weekly-reset] Reset ${ids.length} users (grocery_day=${todayDow})`)
  return NextResponse.json({ ok: true, reset: ids.length })
}
