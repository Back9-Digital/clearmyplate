import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-03-31.basil" })

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get("stripe-signature") ?? ""

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      const customerId      = session.customer as string | null
      const subscriptionId  = session.subscription as string | null
      const customerEmail   = session.customer_details?.email ?? null

      // Resolve user_id from email
      let userId: string | null = null
      if (customerEmail) {
        const { data: users } = await supabase
          .from("auth.users")
          .select("id")
          .eq("email", customerEmail)
          .limit(1)
        userId = users?.[0]?.id ?? null
      }

      // Determine plan type from price
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 })
      const priceId   = lineItems.data[0]?.price?.id ?? null
      let planType    = "unknown"
      if (priceId === process.env.STRIPE_PRICE_FAMILY_MONTHLY)  planType = "family_monthly"
      if (priceId === process.env.STRIPE_PRICE_FAMILY_ANNUAL)   planType = "family_annual"
      if (priceId === process.env.STRIPE_PRICE_LIFETIME)        planType = "lifetime"
      if (priceId === process.env.STRIPE_PRICE_LAUNCH_SPECIAL)  planType = "launch_special"

      // Resolve period end for subscriptions
      let periodEnd: string | null = null
      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId) as unknown as { current_period_end: number }
        periodEnd = new Date(sub.current_period_end * 1000).toISOString()
      }

      await supabase.from("user_subscriptions").upsert({
        user_id:                  userId,
        stripe_customer_id:       customerId,
        stripe_subscription_id:   subscriptionId,
        plan_type:                planType,
        status:                   "active",
        current_period_end:       periodEnd,
      }, { onConflict: "stripe_customer_id" })
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription
      await supabase
        .from("user_subscriptions")
        .update({ status: "cancelled", plan_type: "free" })
        .eq("stripe_subscription_id", sub.id)
    }
  } catch (err) {
    // Log but return 200 so Stripe doesn't retry indefinitely
    console.error("[webhook] Handler error:", err)
  }

  return NextResponse.json({ received: true })
}
