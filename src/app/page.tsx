"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Check, Star, ChevronDown, ChevronUp,
  CalendarDays, RefreshCw, ShoppingBag, Heart,
} from "lucide-react"

const SAGE = "#4A7C6F"
const BG   = "#F5F3EE"
const MUTED_BG = "#EAE8E3"
const BORDER = "#DDD9D1"
const DARK = "#1C2B27"
const GRAY = "#6B7B77"
const ACCENT_BG = "#D4E8E2"

const features = [
  {
    icon: CalendarDays,
    title: "Smart Meal Plans",
    description: "AI-generated weekly dinners tailored to your family's size, tastes, and goals. Ready in seconds.",
  },
  {
    icon: RefreshCw,
    title: "Leftover Magic",
    description: "Tuesday's roast becomes Wednesday's tacos. Nothing goes to waste, and you cook less.",
  },
  {
    icon: ShoppingBag,
    title: "Simple Grocery Lists",
    description: "Auto-generated and sorted by category. Screenshot it, head to the supermarket, done.",
  },
  {
    icon: Heart,
    title: "Anti-Diet Philosophy",
    description: "No calorie counting. No macro tracking. Just real food your family will actually eat.",
  },
]

const steps = [
  {
    n: "1",
    title: "Tell us about your household",
    desc: "Who's eating, what they love, what they won't touch, and your weekly budget.",
  },
  {
    n: "2",
    title: "Get your meal plan",
    desc: "A full week of dinners — with leftover meals built in — generated in seconds.",
  },
  {
    n: "3",
    title: "Shop & cook",
    desc: "Your grocery list is waiting, sorted by category. Dinner is sorted before Monday.",
  },
]

const testimonials = [
  {
    name: "Sarah M.",
    role: "Mother of two, Auckland",
    quote:
      "This has completely changed our evenings. I used to dread the 'what's for dinner' question. Now I just check the app.",
  },
  {
    name: "James K.",
    role: "Busy professional, Wellington",
    quote:
      "I used to spend Sunday dreading the week's meals. Now it takes two minutes and the grocery list is already done.",
  },
]

const faqs = [
  {
    q: "Is this another diet app?",
    a: "Not at all. ClearMyPlate is about reducing the mental load of feeding your family — not tracking calories or imposing restrictive rules. We focus on real, enjoyable food.",
  },
  {
    q: "How does leftover reuse work?",
    a: "When we plan your week, we intentionally schedule meals that produce leftovers and then plan a second meal around them. For example, Sunday's roast chicken becomes Monday's chicken fried rice.",
  },
  {
    q: "Can I customise the meal plan?",
    a: "Yes. You can swap any meal you don't like and regenerate individual days. You can also mark meals as favourites to see them appear more often.",
  },
  {
    q: "What if I don't like a meal suggestion?",
    a: "Just hit 'Swap' on any meal card and we'll replace it with something else that fits your preferences and the week's plan.",
  },
]

type Plan = {
  name: string
  monthlyPrice: string
  annualPrice: string
  annualBilling: string
  period: string
  features: string[]
  cta: string
  highlight: boolean
  badge: string | null
}

const pricingPlans: Plan[] = [
  {
    name: "Try It Free",
    monthlyPrice: "$0",
    annualPrice: "$0",
    annualBilling: "",
    period: "2 free meal plans, no credit card",
    features: ["2 free meal plans", "7-day dinner plan", "Grocery list", "No credit card needed"],
    cta: "Start free",
    highlight: false,
    badge: null,
  },
  {
    name: "Family Plan",
    monthlyPrice: "$12",
    annualPrice: "$9.58",
    annualBilling: "$115 billed annually",
    period: "per month",
    features: ["Everything in Free", "Unlimited meal swaps", "Leftover planning", "Priority support"],
    cta: "Get started",
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Lifetime Access",
    monthlyPrice: "$299",
    annualPrice: "$299",
    annualBilling: "",
    period: "one-time payment",
    features: ["Everything in Family", "All future features", "Lifetime updates", "Early access"],
    cta: "Buy lifetime",
    highlight: false,
    badge: null,
  },
]

const launchFeatures = ["Everything in Family Plan", "All future features", "Lifetime updates", "Early access"]

async function startCheckout(
  planType: string,
  setLoading: (k: string | null) => void,
  onSoldOut?: () => void,
) {
  setLoading(planType)
  try {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planType }),
    })
    const data = await res.json()
    if (res.status === 409 && data.soldOut) {
      onSoldOut?.()
      return
    }
    if (data.url) window.location.href = data.url
    else console.error("No checkout URL returned", data)
  } catch (err) {
    console.error("Checkout error", err)
  } finally {
    setLoading(null)
  }
}

export default function Home() {
  const [annual, setAnnual]             = useState(false)
  const [openFaq, setOpenFaq]           = useState<number | null>(null)
  const [loadingPlan, setLoading]       = useState<string | null>(null)
  const [launchSoldOut, setLaunchSoldOut] = useState(false)

  useEffect(() => {
    fetch("/api/launch-special/count")
      .then((r) => r.json())
      .then((d) => { if (d.isSoldOut) setLaunchSoldOut(true) })
      .catch(() => {/* non-fatal */})
  }, [])

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG, color: DARK }}>

      {/* ── Nav ── */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Image src="/images/Clear My Plate Logo Horizontal Lockup.svg" alt="ClearMyPlate" width={224} height={56} className="h-8 w-auto sm:h-14" unoptimized priority />
        <Link href="/login">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full bg-transparent text-sm"
            style={{ borderColor: BORDER, color: DARK }}
          >
            Sign in
          </Button>
        </Link>
      </header>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">

          {/* Left */}
          <div>
            <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Clear what&rsquo;s on<br className="hidden sm:block" /> your plate.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed" style={{ color: GRAY }}>
              You shouldn&rsquo;t need a nutrition degree or a spreadsheet just to feed your family well.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="rounded-full px-7 text-white"
                style={{ backgroundColor: SAGE }}
                onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
              >
                See pricing →
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full bg-transparent px-7"
                style={{ borderColor: BORDER, color: DARK }}
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              >
                How it works
              </Button>
            </div>
            {/* Trust bar */}
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm" style={{ color: GRAY }}>
              {["No calorie counting", "No tracking", "No judgment"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4" style={{ color: SAGE }} />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Chat bubble card */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-md">
              <div className="mb-5 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: SAGE }} />
                <span
                  className="text-xs font-semibold tracking-widest uppercase"
                  style={{ color: GRAY }}
                >
                  ClearMyPlate
                </span>
              </div>

              {/* Before bubble */}
              <div className="mb-4 flex items-start gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
                  style={{ backgroundColor: MUTED_BG }}
                >
                  😩
                </div>
                <div className="rounded-2xl rounded-tl-none px-4 py-3" style={{ backgroundColor: MUTED_BG }}>
                  <p className="text-sm leading-relaxed" style={{ color: DARK }}>
                    What are we doing for dinner tonight?
                  </p>
                </div>
              </div>

              {/* After bubble */}
              <div className="flex items-start justify-end gap-3">
                <div
                  className="rounded-2xl rounded-tr-none px-4 py-3 text-white"
                  style={{ backgroundColor: SAGE }}
                >
                  <p className="text-sm leading-relaxed">
                    That&rsquo;s sorted. Week&rsquo;s planned, groceries ordered.
                  </p>
                </div>
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
                  style={{ backgroundColor: ACCENT_BG }}
                >
                  😊
                </div>
              </div>

              <p className="mt-5 text-center text-xs" style={{ color: GRAY }}>
                Week sorted in under 2 minutes
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6">
        <div className="h-px" style={{ backgroundColor: BORDER }} />
      </div>

      {/* ── Feature cards ── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight lg:text-4xl">
            The relief you&rsquo;ve been looking for.
          </h2>
          <p className="mt-3 text-sm" style={{ color: GRAY }}>Everything you need. Nothing you don&rsquo;t.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl bg-white p-6">
              <div
                className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: ACCENT_BG }}
              >
                <Icon className="h-5 w-5" style={{ color: SAGE }} />
              </div>
              <h3 className="mb-2 font-semibold text-sm">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: GRAY }}>{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-20" style={{ backgroundColor: MUTED_BG }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight lg:text-4xl">
              Three steps to sorted.
            </h2>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {steps.map(({ n, title, desc }) => (
              <div key={n} className="flex gap-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: SAGE }}
                >
                  {n}
                </div>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: GRAY }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight lg:text-4xl">
            Families who&rsquo;ve cleared their plates.
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {testimonials.map(({ name, role, quote }) => (
            <div key={name} className="rounded-2xl bg-white p-8">
              <div className="mb-4 flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4" style={{ fill: SAGE, color: SAGE }} />
                ))}
              </div>
              <p className="mb-5 text-sm leading-relaxed" style={{ color: DARK }}>
                &ldquo;{quote}&rdquo;
              </p>
              <div>
                <p className="text-sm font-semibold">{name}</p>
                <p className="text-xs" style={{ color: GRAY }}>{role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-20" style={{ backgroundColor: MUTED_BG }} id="pricing">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight lg:text-4xl">
              Simple, honest pricing.
            </h2>
            <p className="mt-3 text-sm" style={{ color: GRAY }}>No hidden fees. Cancel any time.</p>

            {/* Toggle */}
            <div className="mt-6 inline-flex items-center gap-1 rounded-full bg-white p-1.5">
              {[
                { label: "Monthly", value: false },
                { label: "Annual — save 20%", value: true },
              ].map(({ label, value }) => (
                <button
                  key={label}
                  onClick={() => setAnnual(value)}
                  className="rounded-full px-4 py-1.5 text-sm font-medium transition-all"
                  style={
                    annual === value
                      ? { backgroundColor: SAGE, color: "white" }
                      : { color: GRAY }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 3-card grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className="relative flex flex-col rounded-2xl p-6"
                style={
                  plan.highlight
                    ? { backgroundColor: SAGE }
                    : { backgroundColor: "white" }
                }
              >
                {plan.badge && (
                  <span
                    className="mb-3 inline-block self-start rounded-full px-3 py-0.5 text-xs font-semibold"
                    style={
                      plan.highlight
                        ? { backgroundColor: "rgba(255,255,255,0.2)", color: "white" }
                        : { backgroundColor: ACCENT_BG, color: SAGE }
                    }
                  >
                    {plan.badge}
                  </span>
                )}

                <h3 className="font-semibold" style={{ color: plan.highlight ? "white" : DARK }}>
                  {plan.name}
                </h3>

                <div className="mt-3">
                  <span className="text-4xl font-bold" style={{ color: plan.highlight ? "white" : DARK }}>
                    {annual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  {plan.name === "Family Plan" && (
                    <span className="ml-1 text-sm" style={{ color: plan.highlight ? "rgba(255,255,255,0.7)" : GRAY }}>
                      /mo
                    </span>
                  )}
                </div>

                <p className="mt-1 mb-5 text-xs" style={{ color: plan.highlight ? "rgba(255,255,255,0.65)" : GRAY }}>
                  {annual && plan.annualBilling ? plan.annualBilling : plan.period}
                </p>

                <ul className="mb-6 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: plan.highlight ? "white" : SAGE }} />
                      <span style={{ color: plan.highlight ? "rgba(255,255,255,0.85)" : DARK }}>{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.name === "Try It Free" ? (
                  <Link href="/signup">
                    <button
                      className="w-full rounded-full py-2 text-sm font-medium transition-all"
                      style={{ border: `1.5px solid ${SAGE}`, color: SAGE, backgroundColor: "transparent" }}
                    >
                      {plan.cta}
                    </button>
                  </Link>
                ) : (
                  <button
                    onClick={() => startCheckout(
                      plan.name === "Family Plan"
                        ? (annual ? "family_annual" : "family_monthly")
                        : "lifetime",
                      setLoading
                    )}
                    disabled={loadingPlan !== null}
                    className="w-full rounded-full py-2 text-sm font-medium transition-all disabled:opacity-60"
                    style={
                      plan.highlight
                        ? { backgroundColor: "white", color: SAGE }
                        : { border: `1.5px solid ${SAGE}`, color: SAGE, backgroundColor: "transparent" }
                    }
                  >
                    {loadingPlan === (plan.name === "Family Plan" ? (annual ? "family_annual" : "family_monthly") : "lifetime") ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Loading…
                      </span>
                    ) : plan.cta}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* ── Launch Special — full-width banner (hidden when sold out) ── */}
          {!launchSoldOut && <div
            className="mt-5 flex flex-col gap-5 rounded-2xl p-6 sm:flex-row sm:items-center sm:gap-8"
            style={{ backgroundColor: "white", border: `2px dashed ${SAGE}` }}
          >
            {/* Left: badge + name */}
            <div className="flex shrink-0 flex-col gap-1.5">
              <span
                className="inline-block self-start rounded-full px-3 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: ACCENT_BG, color: SAGE }}
              >
                Limited Time
              </span>
              <p className="text-lg font-bold" style={{ color: DARK }}>Launch Special</p>
              <p className="text-xs font-medium italic" style={{ color: SAGE }}>Launch price. Yours forever.</p>
            </div>

            {/* Divider (desktop) */}
            <div className="hidden h-12 w-px sm:block" style={{ backgroundColor: BORDER }} />

            {/* Centre: price */}
            <div className="shrink-0">
              <span className="text-4xl font-bold" style={{ color: SAGE }}>$39</span>
              <span className="ml-1.5 text-sm" style={{ color: GRAY }}>one-time</span>
            </div>

            {/* Divider (desktop) */}
            <div className="hidden h-12 w-px sm:block" style={{ backgroundColor: BORDER }} />

            {/* Features — horizontal list */}
            <ul className="flex flex-1 flex-wrap gap-x-6 gap-y-2">
              {launchFeatures.map((f) => (
                <li key={f} className="flex items-center gap-1.5 text-sm" style={{ color: DARK }}>
                  <Check className="h-3.5 w-3.5 shrink-0" style={{ color: SAGE }} />
                  {f}
                </li>
              ))}
            </ul>

            {/* Right: CTA */}
            <button
              onClick={() => startCheckout("launch_special", setLoading, () => setLaunchSoldOut(true))}
              disabled={loadingPlan !== null}
              className="shrink-0 w-full rounded-full px-7 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 sm:w-auto"
              style={{ backgroundColor: SAGE }}
            >
              {loadingPlan === "launch_special" ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Loading…
                </span>
              ) : "Grab the deal →"}
            </button>
          </div>}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="mb-10 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight lg:text-4xl">
            Common questions.
          </h2>
        </div>
        <div className="overflow-hidden rounded-2xl bg-white" style={{ border: `1px solid ${BORDER}` }}>
          {faqs.map((faq, i) => (
            <div key={i} style={i > 0 ? { borderTop: `1px solid ${BORDER}` } : {}}>
              <button
                className="flex w-full items-center justify-between px-6 py-5 text-left"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="font-medium text-sm">{faq.q}</span>
                {openFaq === i
                  ? <ChevronUp className="h-4 w-4 shrink-0" style={{ color: GRAY }} />
                  : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: GRAY }} />
                }
              </button>
              {openFaq === i && (
                <div className="px-6 pb-5">
                  <p className="text-sm leading-relaxed" style={{ color: GRAY }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20" style={{ backgroundColor: SAGE }}>
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-white lg:text-4xl">
            Ready to clear your plate?
          </h2>
          <p className="mt-4 text-sm text-white/70">
            Set up your household in under two minutes.
          </p>
          <Link href="/signup" className="inline-block mt-8">
            <button
              className="rounded-full px-8 py-3 text-sm font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: "white", color: SAGE }}
            >
              Start Free Trial →
            </button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Image src="/images/Clear My Plate Logo Horizontal Lockup.svg" alt="ClearMyPlate" width={224} height={56} className="h-8 w-auto sm:h-14" unoptimized priority />
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            <p className="text-xs" style={{ color: GRAY }}>
              © {new Date().getFullYear()} ClearMyPlate. Made for families.
            </p>
            <Link href="/terms" className="text-xs" style={{ color: GRAY }}>
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-xs" style={{ color: GRAY }}>
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
