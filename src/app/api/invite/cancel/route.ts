import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { id } = body
  if (!id) return NextResponse.json({ error: "Invite ID required" }, { status: 400 })

  const { error } = await supabase
    .from("household_invites")
    .delete()
    .eq("id", id)
    .eq("household_id", user.id) // RLS + ownership double-check

  if (error) {
    console.error("[invite/cancel] DB error:", error)
    return NextResponse.json({ error: "Failed to cancel invite" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
