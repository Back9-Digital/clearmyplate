import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-03-31.basil" })

const LAUNCH_SPECIAL_CAP = 100

async function getLaunchSpecialCount(): Promise<number> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("plan_type", "launch_special")
  return count ?? 0
}

const PRICE_MAP: Record<string, string | undefined> = {
  family_monthly:  process.env.STRIPE_PRICE_FAMILY_MONTHLY,
  family_annual:   process.env.STRIPE_PRICE_FAMILY_ANNUAL,
  lifetime:        process.env.STRIPE_PRICE_LIFETIME,
  launch_special:  process.env.STRIPE_PRICE_LAUNCH_SPECIAL,
}

export async function POST(req: NextRequest) {
  try {
    const { planType } = await req.json()

    const priceId = PRICE_MAP[planType]
    if (!priceId) {
      return NextResponse.json({ error: `Unknown plan type: ${planType}` }, { status: 400 })
    }

    // Guard: Launch Special is capped at 100 spots
    if (planType === "launch_special") {
      const taken = await getLaunchSpecialCount()
      if (taken >= LAUNCH_SPECIAL_CAP) {
        return NextResponse.json({ error: "Launch Special is sold out", soldOut: true }, { status: 409 })
      }
    }

    const isOneTime = planType === "lifetime" || planType === "launch_special"
    const origin = req.headers.get("origin") ?? "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      mode: isOneTime ? "payment" : "subscription",
      currency: "nzd",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?payment=success`,
      cancel_url:  `${origin}/pricing`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("[stripe/checkout] Error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 }
    )
  }
}
