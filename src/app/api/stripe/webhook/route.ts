import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { ghlTrackPayment } from "@/lib/ghl"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-03-31.basil" })

// Service-role client — can call auth.admin and bypasses RLS
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function planTypeFromPriceId(priceId: string | null): string {
  switch (priceId) {
    case process.env.STRIPE_PRICE_FAMILY_MONTHLY: return "family"
    case process.env.STRIPE_PRICE_FAMILY_ANNUAL:  return "family"
    case process.env.STRIPE_PRICE_LIFETIME:        return "lifetime"
    case process.env.STRIPE_PRICE_LAUNCH_SPECIAL:  return "launch_special"
    default:                                        return "free"
  }
}

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

  const supabase = adminClient()

  try {
    if (event.type === "checkout.session.completed") {
      const session        = event.data.object as Stripe.Checkout.Session
      const customerId     = session.customer as string | null
      const subscriptionId = session.subscription as string | null
      const customerEmail  = session.customer_details?.email ?? null

      if (!customerEmail) {
        console.error("[webhook] checkout.session.completed: no customer email")
        return NextResponse.json({ received: true })
      }

      // Look up the auth user by email using the admin API
      const { data: { users }, error: lookupError } = await supabase.auth.admin.listUsers()
      if (lookupError) {
        console.error("[webhook] Failed to list users:", lookupError)
        return NextResponse.json({ received: true })
      }
      const user = users.find((u) => u.email === customerEmail) ?? null

      if (!user) {
        console.error("[webhook] No auth user found for email:", customerEmail)
        return NextResponse.json({ received: true })
      }

      // Resolve price → plan type
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 })
      const priceId   = lineItems.data[0]?.price?.id ?? null
      const planType  = planTypeFromPriceId(priceId)

      // Resolve subscription period end
      let periodEnd: string | null = null
      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId) as unknown as { current_period_end: number }
        periodEnd = new Date(sub.current_period_end * 1000).toISOString()
      }

      const { error: upsertError } = await supabase
        .from("profiles")
        .update({
          plan_type:             planType,
          stripe_customer_id:    customerId,
        })
        .eq("id", user.id)

      if (upsertError) {
        console.error("[webhook] Failed to update profile:", upsertError)
      } else {
        console.log(`[webhook] Updated profile for ${customerEmail} → ${planType}`)
        // Non-blocking GHL contact update — failure never retries Stripe
        await ghlTrackPayment(customerEmail, planType)
      }

      // Store subscription details separately if you need period tracking
      if (periodEnd) {
        console.log(`[webhook] Subscription period end: ${periodEnd}`)
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub        = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string

      const { error } = await supabase
        .from("profiles")
        .update({ plan_type: "free" })
        .eq("stripe_customer_id", customerId)

      if (error) {
        console.error("[webhook] Failed to downgrade profile:", error)
      } else {
        console.log(`[webhook] Downgraded customer ${customerId} to free`)
      }
    }
  } catch (err) {
    console.error("[webhook] Unhandled error:", err)
  }

  return NextResponse.json({ received: true })
}
