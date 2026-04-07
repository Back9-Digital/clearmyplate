import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { DollarSign, UtensilsCrossed, Target, ArrowRight, Zap } from "lucide-react"
import { PaymentSuccessBanner } from "@/components/PaymentSuccessBanner"
import { PushNotificationToggle } from "@/components/PushNotificationToggle"
import { LogoutButton } from "@/components/LogoutButton"
import { createClient } from "@/lib/supabase/server"
import {
  generationsAllowed,
  generationsRemaining,
  weekNeedsReset,
} from "@/lib/generations"

const SAGE      = "#4A7C6F"
const BG        = "#F5F3EE"
const BORDER    = "#DDD9D1"
const DARK      = "#1C2B27"
const GRAY      = "#6B7B77"
const ACCENT_BG = "#D4E8E2"

const PLAN_LABELS: Record<string, string> = {
  free:          "Free",
  family:        "Family",
  launch_special: "Launch Special",
  lifetime:      "Lifetime",
}

const cards = [
  {
    title: "This Week's Plan",
    description: "Your 7-day dinner plan is ready. Tap to view meals, swap dishes, or mark favourites.",
    cta: "View Meal Plan",
    href: "/dashboard/plan",
    badge: null,
    primary: true,
  },
  {
    title: "Grocery List",
    description: "Your shopping list is auto-generated from this week's meals.",
    cta: "View Shopping List",
    href: "/dashboard/plan?tab=grocery",
    badge: "Organised by category",
    primary: true,
  },
  {
    title: "Favourite Meals",
    description: "Meals you've saved appear here. We'll add them more often.",
    cta: "View Favourites",
    href: "/dashboard/favourites",
    badge: null,
    primary: false,
  },
  {
    title: "Preferences",
    description: "Update your household size, dietary preferences, or weekly budget.",
    cta: "Edit Settings",
    href: "/dashboard/settings",
    badge: null,
    primary: false,
  },
]

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_type, generations_this_week, week_reset_at, email, full_name")
    .eq("id", user.id)
    .single()

  const nztHour   = Number(new Intl.DateTimeFormat("en-NZ", { timeZone: "Pacific/Auckland", hour: "numeric", hour12: false }).format(new Date()))
  const timeOfDay = nztHour < 12 ? "Good morning" : nztHour < 17 ? "Good afternoon" : "Good evening"
  const fullName  = profile?.full_name ?? null
  const greeting  = fullName ? `${timeOfDay}, ${fullName}` : timeOfDay

  const planType   = profile?.plan_type ?? "free"
  const used       = weekNeedsReset(profile?.week_reset_at ?? new Date().toISOString())
    ? 0
    : (profile?.generations_this_week ?? 0)
  const limit      = generationsAllowed(planType)
  const remaining  = generationsRemaining(planType, used)
  const initial    = (fullName ?? profile?.email ?? user.email ?? "?")[0].toUpperCase()
  const isPaid     = planType !== "free"

  const stats = [
    {
      icon: Zap,
      label: "Plan",
      value: PLAN_LABELS[planType] ?? planType,
    },
    {
      icon: Target,
      label: "Generations left",
      value: isPaid ? `${remaining} of ${limit} this week` : "Upgrade to generate",
      highlight: remaining === 0,
    },
    {
      icon: UtensilsCrossed,
      label: "Meals this week",
      value: "7 dinners",
    },
    {
      icon: DollarSign,
      label: "Weekly budget",
      value: "$200 / week",
    },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>

      {/* Nav */}
      <header className="border-b" style={{ backgroundColor: "white", borderColor: BORDER }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <img src="/images/Clear My Plate Logo Horizontal Lockup.svg" alt="ClearMyPlate" height="56" style={{ height: 56 }} />
          <div className="flex items-center gap-3">
            <PushNotificationToggle />
            <span className="text-sm hidden sm:inline" style={{ color: GRAY }}>{user.email}</span>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: SAGE }}
            >
              {initial}
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">

        {/* Payment success banner */}
        <Suspense fallback={null}>
          <PaymentSuccessBanner />
        </Suspense>

        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: DARK }}>{greeting} 👋</h1>
          <p className="mt-1 text-sm" style={{ color: GRAY }}>Here&rsquo;s your household overview.</p>
        </div>

        {/* Upgrade prompt for free users */}
        {!isPaid && (
          <div
            className="mb-6 flex items-center justify-between gap-4 rounded-2xl px-6 py-4"
            style={{ backgroundColor: ACCENT_BG, border: `1px solid ${SAGE}20` }}
          >
            <div>
              <p className="font-semibold text-sm" style={{ color: DARK }}>You&rsquo;re on the free plan</p>
              <p className="text-xs mt-0.5" style={{ color: GRAY }}>Upgrade to start generating personalised meal plans.</p>
            </div>
            <Link href="/#pricing">
              <button
                className="shrink-0 rounded-full px-5 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: SAGE }}
              >
                Upgrade →
              </button>
            </Link>
          </div>
        )}

        {/* Low generation warning for paid users */}
        {isPaid && remaining === 0 && (
          <div
            className="mb-6 rounded-2xl px-6 py-4"
            style={{ backgroundColor: "#FEF3C7", border: "1px solid #FCD34D" }}
          >
            <p className="font-semibold text-sm" style={{ color: "#92400E" }}>Generation limit reached for this week</p>
            <p className="text-xs mt-0.5" style={{ color: "#B45309" }}>
              Your {limit} generation{limit !== 1 ? "s" : ""} reset every Monday at midnight NZ time.
            </p>
          </div>
        )}

        {/* Stat cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ icon: Icon, label, value, highlight }) => (
            <div
              key={label}
              className="rounded-2xl bg-white p-5"
              style={{ border: `1px solid ${BORDER}` }}
            >
              <div
                className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: highlight ? "#FEF3C7" : ACCENT_BG }}
              >
                <Icon className="h-4 w-4" style={{ color: highlight ? "#D97706" : SAGE }} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: GRAY }}>
                {label}
              </p>
              <p className="mt-1 font-semibold text-sm" style={{ color: highlight ? "#D97706" : DARK }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Feature cards */}
        <div className="grid gap-5 sm:grid-cols-2">
          {cards.map((card) => (
            <div
              key={card.title}
              className="flex flex-col rounded-2xl bg-white p-6"
              style={{ border: `1px solid ${BORDER}` }}
            >
              <div className="mb-1 flex items-start justify-between gap-3">
                <h2 className="font-semibold" style={{ color: DARK }}>{card.title}</h2>
                {card.badge && (
                  <span
                    className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: ACCENT_BG, color: SAGE }}
                  >
                    {card.badge}
                  </span>
                )}
              </div>
              <p className="mb-5 flex-1 text-sm leading-relaxed" style={{ color: GRAY }}>
                {card.description}
              </p>
              <Link href={card.href}>
                <button
                  className="flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium transition-all"
                  style={{
                    backgroundColor: card.primary ? SAGE : "transparent",
                    color: card.primary ? "white" : SAGE,
                    border: card.primary ? "none" : `1.5px solid ${SAGE}`,
                  }}
                >
                  {card.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
