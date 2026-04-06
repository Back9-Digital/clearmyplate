import Link from "next/link"
import { Users, DollarSign, UtensilsCrossed, Target, ArrowRight } from "lucide-react"

const SAGE = "#4A7C6F"
const BG   = "#F5F3EE"
const BORDER = "#DDD9D1"
const DARK = "#1C2B27"
const GRAY = "#6B7B77"
const ACCENT_BG = "#D4E8E2"

const stats = [
  { icon: Users,           label: "Household",       value: "2 adults, 1 kid" },
  { icon: DollarSign,      label: "Weekly budget",    value: "$200 / week"     },
  { icon: UtensilsCrossed, label: "Meals this week",  value: "7 dinners"       },
  { icon: Target,          label: "Current goal",     value: "Maintain"        },
]

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

export default function Dashboard() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>

      {/* Nav */}
      <header
        className="border-b"
        style={{ backgroundColor: "white", borderColor: BORDER }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <img src="/images/Clear My Plate Logo Horizontal Lockup.svg" alt="ClearMyPlate" height="56" style={{ height: 56 }} />
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: GRAY }}>My Household</span>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: SAGE }}
            >
              M
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">

        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: DARK }}>Good evening 👋</h1>
          <p className="mt-1 text-sm" style={{ color: GRAY }}>Here&rsquo;s your household overview.</p>
        </div>

        {/* Stat cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-2xl bg-white p-5"
              style={{ border: `1px solid ${BORDER}` }}
            >
              <div
                className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: ACCENT_BG }}
              >
                <Icon className="h-4 w-4" style={{ color: SAGE }} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: GRAY }}>
                {label}
              </p>
              <p className="mt-1 font-semibold text-sm" style={{ color: DARK }}>{value}</p>
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
                  className="flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium text-white transition-all"
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
