import { NextRequest, NextResponse } from "next/server"
import { ghlTrackSignup } from "@/lib/ghl"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  // Verify the caller is an authenticated Supabase session (prevents abuse)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  }

  const email = user.email
  if (!email) {
    return NextResponse.json({ error: "No email" }, { status: 400 })
  }

  // Fetch full_name from profile (written by signup page before this fires)
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single()

  // Non-blocking — GHL failure never surfaces to the user
  await ghlTrackSignup(email, profile?.full_name ?? undefined)

  return NextResponse.json({ ok: true })
}
