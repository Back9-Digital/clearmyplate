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

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = adminClient()

  // Free users whose account is between 9 and 10 days old (5-day warning before 14-day trial ends)
  const nineDAgo  = new Date(Date.now() - 9  * 24 * 60 * 60 * 1000).toISOString()
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("email")
    .eq("plan_type", "free")
    .gte("created_at", tenDaysAgo)
    .lte("created_at", nineDAgo)

  if (error) {
    console.error("[cron/trial-expiring] Query error:", error)
    return NextResponse.json({ error: "Query failed" }, { status: 500 })
  }

  const emails = (profiles ?? []).map((p) => p.email).filter(Boolean) as string[]

  await Promise.allSettled(
    emails.map((email) =>
      Promise.all([
        ghlAddTags(email, ["trial-expiring"]),
        sendPushToEmail(email, {
          title: "Your free trial ends in 5 days ⏳",
          body:  "Upgrade now to keep generating personalised meal plans for your family.",
          url:   "/#pricing",
        }),
      ])
    )
  )

  console.log(`[cron/trial-expiring] Notified ${emails.length} users`)

  return NextResponse.json({ ok: true, notified: emails.length })
}
