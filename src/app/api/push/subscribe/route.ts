import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body || !body.endpoint) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
  }

  // Insert, ignoring if this endpoint is already saved for this user
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      { user_id: user.id, subscription: body },
      { onConflict: "user_id,subscription->>'endpoint'" }
    )

  if (error) {
    console.error("[push/subscribe] DB error:", error)
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body || !body.endpoint) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
  }

  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("subscription->>endpoint", body.endpoint)

  return NextResponse.json({ ok: true })
}
