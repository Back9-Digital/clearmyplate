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

// DELETE — remove an accepted household member
// Body: { inviteId: string }  (the household_invites row id)
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const { inviteId } = await req.json()
  if (!inviteId) return NextResponse.json({ error: "inviteId required" }, { status: 400 })

  const admin = adminClient()

  // Fetch the invite to get the member email and verify it belongs to this owner
  const { data: invite, error: inviteErr } = await admin
    .from("household_invites")
    .select("id, household_id, email, accepted_at")
    .eq("id", inviteId)
    .eq("household_id", user.id)
    .maybeSingle()

  if (inviteErr || !invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 })
  }
  if (!invite.accepted_at) {
    return NextResponse.json({ error: "Invite has not been accepted" }, { status: 400 })
  }

  // Look up the member's profile id via their email
  const { data: memberProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", invite.email)
    .maybeSingle()

  // Delete from household_members if we found the member
  if (memberProfile) {
    await admin
      .from("household_members")
      .delete()
      .eq("household_id", user.id)
      .eq("member_id", memberProfile.id)
  }

  // Always delete the invite record
  await admin
    .from("household_invites")
    .delete()
    .eq("id", inviteId)

  return NextResponse.json({ ok: true })
}
