import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { ghlAddTags } from "@/lib/ghl"
import { sendPushToEmail } from "@/lib/push"

export const dynamic = "force-dynamic"

function adminClient() {
  return createSupabaseClient(
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

  const supabase = adminClient()

  // Today in NZT — only remind users whose grocery day is today
  const todayDow = getNZTDayOfWeek()

  // Paid users whose grocery_day is today and haven't generated in 5+ days
  const cutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("email")
    .neq("plan_type", "free")
    .eq("grocery_day", todayDow)
    .or(`week_reset_at.is.null,week_reset_at.lt.${cutoff}`)

  if (error) {
    console.error("[cron/weekly-reminder] Query error:", error)
    return NextResponse.json({ error: "Query failed" }, { status: 500 })
  }

  const emails = (profiles ?? []).map((p) => p.email).filter(Boolean) as string[]

  await Promise.allSettled(
    emails.map((email) =>
      Promise.all([
        ghlAddTags(email, ["plan-reminder"]),
        sendPushToEmail(email, {
          title: "Time to plan this week's meals 🥗",
          body:  "You haven't generated a meal plan yet this week. Tap to get started.",
          url:   "/dashboard",
        }),
      ])
    )
  )

  console.log(`[cron/weekly-reminder] Notified ${emails.length} users`)

  return NextResponse.json({ ok: true, notified: emails.length })
}
