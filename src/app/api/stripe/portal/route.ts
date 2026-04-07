import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-03-31.basil" })

const ALLOWED_ORIGINS = [
  "https://www.clearmyplate.app",
  "https://clearmyplate.app",
  "http://localhost:3000",
]

function safeOrigin(req: NextRequest): string {
  const origin = req.headers.get("origin") ?? ""
  return ALLOWED_ORIGINS.includes(origin) ? origin : "https://www.clearmyplate.app"
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  }

  const origin = safeOrigin(req)

  const customers = await stripe.customers.list({ email: user.email, limit: 1 })
  if (!customers.data.length) {
    return NextResponse.json({ error: "No Stripe customer found" }, { status: 404 })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer:   customers.data[0].id,
    return_url: `${origin}/dashboard/settings`,
  })

  return NextResponse.json({ url: session.url })
}
