import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  // Must be logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { token } = body
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 })

  const admin = adminClient()

  // Look up invite — admin bypasses RLS (member doesn't own the invite row)
  const { data: invite, error: inviteError } = await admin
    .from("household_invites")
    .select("id, household_id, email, accepted_at")
    .eq("token", token)
    .single()

  if (inviteError || !invite) {
    return NextResponse.json({ error: "Invite not found or invalid." }, { status: 404 })
  }

  if (invite.accepted_at) {
    return NextResponse.json({ error: "This invite has already been accepted." }, { status: 409 })
  }

  // Email must match (case-insensitive)
  if (invite.email.toLowerCase() !== (user.email ?? "").toLowerCase()) {
    return NextResponse.json(
      { error: `This invite was sent to ${invite.email}. Please sign in with that address.` },
      { status: 403 }
    )
  }

  // Prevent duplicate membership
  const { data: existing } = await admin
    .from("household_members")
    .select("id")
    .eq("household_id", invite.household_id)
    .eq("member_id", user.id)
    .maybeSingle()

  if (!existing) {
    const { error: memberError } = await admin.from("household_members").insert({
      household_id: invite.household_id,
      member_id:    user.id,
      role:         "viewer",
    })
    if (memberError) {
      console.error("[invite/accept] Failed to create household_members row:", memberError)
      return NextResponse.json({ error: "Failed to accept invite." }, { status: 500 })
    }
  }

  // Mark invite accepted
  await admin
    .from("household_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id)

  // Add member's name to owner's family_members JSONB — non-fatal
  try {
    // Prefer saved full_name from profile, fall back to email prefix
    const { data: memberProfile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()

    const memberName = memberProfile?.full_name?.trim() || (user.email ?? "").split("@")[0]

    if (memberName) {
      const { data: ownerProfile } = await admin
        .from("profiles")
        .select("family_members")
        .eq("id", invite.household_id)
        .single()

      const current: { role: string; name: string }[] = ownerProfile?.family_members ?? []
      const alreadyListed = current.some(
        (m) => m.name.toLowerCase() === memberName.toLowerCase()
      )
      if (!alreadyListed) {
        await admin
          .from("profiles")
          .update({ family_members: [...current, { role: "adult", name: memberName }] })
          .eq("id", invite.household_id)
      }
    }
  } catch (err) {
    console.error("[invite/accept] Non-fatal: failed to update family_members:", err)
  }

  return NextResponse.json({ ok: true, householdId: invite.household_id })
}
