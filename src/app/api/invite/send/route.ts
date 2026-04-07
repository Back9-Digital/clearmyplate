import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ghlAddTags } from "@/lib/ghl"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : ""
  // RFC-5321 max length + basic format validation
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  // Rate-limit: cap pending invites per household at 10
  const { count: pendingCount } = await supabase
    .from("household_invites")
    .select("id", { count: "exact", head: true })
    .eq("household_id", user.id)
    .is("accepted_at", null)

  if ((pendingCount ?? 0) >= 10) {
    return NextResponse.json(
      { error: "You have too many pending invites. Cancel some before sending more." },
      { status: 429 }
    )
  }

  const { data: invite, error } = await supabase
    .from("household_invites")
    .insert({ household_id: user.id, email })
    .select("id, email, created_at")
    .single()

  if (error) {
    console.error("[invite/send] DB error:", error)
    // Friendly message for duplicate invite
    const msg = error.code === "23505" ? "An invite for that email already exists." : "Failed to create invite."
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // Non-blocking — tag the invitee in GHL so the email sequence can fire
  ghlAddTags(email, ["household-invite"]).catch(() => {})

  return NextResponse.json({ invite })
}
