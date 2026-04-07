import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { ghlAddTags } from "@/lib/ghl"

export const dynamic = "force-dynamic"

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get("x-cron-secret")
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = adminClient()

  // Find paid users who haven't generated a plan in 5+ days
  const cutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("email")
    .neq("plan_type", "free")
    .or(`week_reset_at.is.null,week_reset_at.lt.${cutoff}`)

  if (error) {
    console.error("[cron/weekly-reminder] Query error:", error)
    return NextResponse.json({ error: "Query failed" }, { status: 500 })
  }

  const emails = (profiles ?? []).map((p) => p.email).filter(Boolean) as string[]

  // Fire GHL tags in parallel, non-throwing
  await Promise.allSettled(
    emails.map((email) => ghlAddTags(email, ["plan-reminder"]))
  )

  console.log(`[cron/weekly-reminder] Tagged ${emails.length} users with plan-reminder`)

  return NextResponse.json({ ok: true, tagged: emails.length })
}
