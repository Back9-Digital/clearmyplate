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

  // Read firstName from request body — passed directly from signup form to avoid
  // a race condition where the profile DB write hasn't propagated before this reads it
  const body = await req.json().catch(() => ({}))
  const firstName: string | undefined = body.firstName || undefined

  await ghlTrackSignup(email, firstName)

  return NextResponse.json({ ok: true })
}
