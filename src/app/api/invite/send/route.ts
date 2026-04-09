import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ghlAddTags } from "@/lib/ghl"
import { sendInviteEmail } from "@/lib/sendgrid"

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
    .select("id, email, created_at, token")
    .single()

  if (error) {
    console.error("[invite/send] DB error:", error)
    const msg = error.code === "23505" ? "An invite for that email already exists." : "Failed to create invite."
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // Send invite email first — must happen before any other side-effects
  console.log("[invite] sending email to:", email, "token:", invite.token)
  try {
    await sendInviteEmail(email, invite.token)
    console.log("[invite] SendGrid email sent successfully")
  } catch (err: unknown) {
    const sgErr = (err as { response?: { body?: unknown } })?.response?.body
    console.error("[invite/send] SendGrid error:", sgErr ?? err)
  }

  // GHL tag for CRM tracking only — isolated so it can never affect email sending
  try {
    await ghlAddTags(email, ["household-invite"])
  } catch {
    // Non-critical — ignore GHL failures
  }

  return NextResponse.json({ invite })
}
