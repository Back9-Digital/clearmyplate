import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendPushToUser } from "@/lib/push"

export const dynamic = "force-dynamic"

// Internal route — only callable by authenticated users (admin use)
// For server-side triggers, call sendPushToUser() directly from lib/push.ts

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  }

  // Only allow a user to send to themselves (prevents abuse)
  const body = await req.json().catch(() => null)
  if (!body?.title || !body?.body) {
    return NextResponse.json({ error: "title and body are required" }, { status: 400 })
  }

  await sendPushToUser(user.id, {
    title: body.title,
    body:  body.body,
    url:   body.url ?? "/dashboard",
  })

  return NextResponse.json({ ok: true })
}
