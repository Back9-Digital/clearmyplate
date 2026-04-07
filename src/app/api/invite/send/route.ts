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
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
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
