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

async function validateMembership(memberId: string, ownerId: string) {
  const admin = adminClient()
  const { data } = await admin
    .from("household_members")
    .select("id")
    .eq("household_id", ownerId)
    .eq("member_id", memberId)
    .maybeSingle()
  return !!data
}

// GET ?owner=<id> — returns owner's checked_items for a validated member
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const ownerId = req.nextUrl.searchParams.get("owner")
  if (!ownerId) return NextResponse.json({ error: "owner param required" }, { status: 400 })

  const isMember = await validateMembership(user.id, ownerId)
  if (!isMember) return NextResponse.json({ error: "Not a member" }, { status: 403 })

  const admin = adminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("checked_items")
    .eq("id", ownerId)
    .maybeSingle()

  return NextResponse.json({ checked_items: profile?.checked_items ?? [] })
}

// PATCH — member writes checked_items to owner's profile
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { owner_id, checked_items } = body

  if (!owner_id || !Array.isArray(checked_items)) {
    return NextResponse.json({ error: "owner_id and checked_items array required" }, { status: 400 })
  }

  // Sanitise: only allow strings, cap at 200 items
  const safe = (checked_items as unknown[])
    .filter((x) => typeof x === "string")
    .slice(0, 200) as string[]

  const isMember = await validateMembership(user.id, owner_id)
  if (!isMember) return NextResponse.json({ error: "Not a member" }, { status: 403 })

  const admin = adminClient()
  await admin.from("profiles").update({ checked_items: safe }).eq("id", owner_id)

  return NextResponse.json({ ok: true })
}
