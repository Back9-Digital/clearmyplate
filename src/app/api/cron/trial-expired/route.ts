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
  const secret = req.headers.get("x-cron-secret")
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = adminClient()

  // Free users whose account is 14+ days old
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("email")
    .eq("plan_type", "free")
    .lte("created_at", fourteenDaysAgo)

  if (error) {
    console.error("[cron/trial-expired] Query error:", error)
    return NextResponse.json({ error: "Query failed" }, { status: 500 })
  }

  const emails = (profiles ?? []).map((p) => p.email).filter(Boolean) as string[]

  await Promise.allSettled(
    emails.map((email) => ghlAddTags(email, ["trial-expired"]))
  )

  console.log(`[cron/trial-expired] Tagged ${emails.length} users with trial-expired`)

  return NextResponse.json({ ok: true, tagged: emails.length })
}
