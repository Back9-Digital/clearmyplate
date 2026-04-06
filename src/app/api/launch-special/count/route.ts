import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const CAP = 100

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = adminClient()

  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("plan_type", "launch_special")

  if (error) {
    console.error("[launch-special/count] Query error:", error)
    // Fail open — don't block the page if the query fails
    return NextResponse.json({ count: 0, isSoldOut: false })
  }

  const total = count ?? 0
  return NextResponse.json(
    { count: total, isSoldOut: total >= CAP },
    {
      headers: {
        // Cache for 60s at the CDN edge — fresh enough, avoids hammering DB on every page load
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    }
  )
}
