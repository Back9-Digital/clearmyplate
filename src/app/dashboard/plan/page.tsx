"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { RefreshCw, Heart, ArrowLeft, Shuffle, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const SAGE     = "#4A7C6F"
const BG       = "#F5F3EE"
const MUTED_BG = "#EAE8E3"
const BORDER   = "#DDD9D1"
const DARK     = "#1C2B27"
const GRAY     = "#6B7B77"
const ACCENT   = "#D4E8E2"

type Meal = {
  day_of_week: number
  day_name: string
  meal_type: string
  meal_name: string
  description: string
  key_ingredients: string[]
  is_leftover: boolean
  prep_time_mins: number
  portion_notes: string
}

type GroceryItem = { category: string; name: string; quantity: string; checked: boolean }

type Plan = {
  plan_id: string | null
  week_start_date: string
  meals: Meal[]
  grocery_list: GroceryItem[]
}

// ── Skeleton ────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white p-5 animate-pulse" style={{ border: `1px solid ${BORDER}` }}>
          <div className="mb-3 flex gap-2">
            <div className="h-4 w-20 rounded-full" style={{ backgroundColor: MUTED_BG }} />
          </div>
          <div className="h-5 w-3/4 rounded-full" style={{ backgroundColor: MUTED_BG }} />
          <div className="mt-2 h-4 w-full rounded-full" style={{ backgroundColor: MUTED_BG }} />
          <div className="mt-3 flex gap-2">
            {[40, 60, 50].map((w, j) => (
              <div key={j} className="h-6 rounded-full" style={{ backgroundColor: MUTED_BG, width: w }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Regen Modal ─────────────────────────────────────────────
function RegenModal({
  onClose,
  onConfirm,
  loading,
}: {
  onClose: () => void
  onConfirm: (instructions: string) => void
  loading: boolean
}) {
  const [instructions, setInstructions] = useState("")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="font-semibold" style={{ color: DARK }}>Regenerate your week</h3>
            <p className="mt-0.5 text-sm" style={{ color: GRAY }}>
              Any special instructions? Or just hit regenerate.
            </p>
          </div>
          <button onClick={onClose} className="ml-4 shrink-0 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <textarea
          className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none"
          style={{ border: `1.5px solid ${BORDER}`, color: DARK, minHeight: 80 }}
          placeholder='e.g. "make it cheaper this week" or "swap chicken for fish"'
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => onConfirm(instructions)}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: SAGE }}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Generating…
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="rounded-full px-5 py-2.5 text-sm font-medium"
            style={{ border: `1.5px solid ${BORDER}`, color: GRAY }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────
export default function PlanPage() {
  const [activeTab, setActiveTab]   = useState<"plan" | "grocery">("plan")
  const [plan, setPlan]             = useState<Plan | null>(null)
  const [fetchLoading, setFetch]    = useState(true)
  const [favourites, setFavourites] = useState<string[]>([])
  const [regenOpen, setRegenOpen]   = useState(false)
  const [regenLoading, setRegenLoading] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  // Load plan on mount
  useEffect(() => {
    async function load() {
      setFetch(true)
      try {
        // 1. Try Supabase for most recent plan
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const { data: profile } = await supabase
            .from("household_profiles")
            .select("id")
            .eq("user_id", user.id)
            .single()

          if (profile) {
            const { data: dbPlan } = await supabase
              .from("plans")
              .select(`id, week_start_date, plan_items(*), grocery_lists(items)`)
              .eq("household_id", profile.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single()

            if (dbPlan && dbPlan.plan_items?.length) {
              const meals = (dbPlan.plan_items as Meal[]).sort((a, b) => a.day_of_week - b.day_of_week)
              const groceryRaw = (dbPlan.grocery_lists as { items: GroceryItem[] }[])[0]?.items ?? []
              const grocery = groceryRaw.map((g) => ({ ...g, checked: false }))
              setPlan({ plan_id: dbPlan.id, week_start_date: dbPlan.week_start_date, meals, grocery_list: grocery })
              return
            }
          }
        }

        // 2. Fallback: localStorage (set right after generation)
        const cached = localStorage.getItem("cmp_latest_plan")
        if (cached) {
          const parsed = JSON.parse(cached) as Omit<Plan, "grocery_list"> & { grocery_list: GroceryItem[] }
          setPlan({
            ...parsed,
            grocery_list: parsed.grocery_list.map((g) => ({ ...g, checked: false })),
          })
          return
        }
      } catch {
        // Silent — show empty state
      } finally {
        setFetch(false)
      }
    }
    load()
  }, [])

  const toggleChecked = (name: string) => {
    setPlan((p) =>
      p ? { ...p, grocery_list: p.grocery_list.map((i) => i.name === name ? { ...i, checked: !i.checked } : i) } : p
    )
  }

  const toggleFav = (mealName: string) => {
    setFavourites((prev) => prev.includes(mealName) ? prev.filter((n) => n !== mealName) : [...prev, mealName])
  }

  const handleRegen = async (instructions: string) => {
    setRegenLoading(true)
    setError(null)
    try {
      const cached = localStorage.getItem("cmp_latest_plan")
      const prevPrefs = cached ? JSON.parse(cached) : {}
      const body = { ...prevPrefs, instructions }
      const res = await fetch("/api/plans/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error()
      const result = await res.json()
      localStorage.setItem("cmp_latest_plan", JSON.stringify(result))
      setPlan({ ...result, grocery_list: result.grocery_list.map((g: GroceryItem) => ({ ...g, checked: false })) })
      setRegenOpen(false)
    } catch {
      setError("Regeneration failed — please try again.")
    } finally {
      setRegenLoading(false)
    }
  }

  // Group grocery list by category
  const groceryByCategory = (plan?.grocery_list ?? []).reduce<Record<string, GroceryItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  const totalItems   = plan?.grocery_list.length ?? 0
  const checkedItems = plan?.grocery_list.filter((i) => i.checked).length ?? 0

  const weekLabel = plan?.week_start_date
    ? new Date(plan.week_start_date).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" })
    : "This week"

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      {regenOpen && (
        <RegenModal
          onClose={() => setRegenOpen(false)}
          onConfirm={handleRegen}
          loading={regenLoading}
        />
      )}

      {/* Header */}
      <header className="border-b bg-white" style={{ borderColor: BORDER }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <button className="flex items-center gap-1.5 text-sm" style={{ color: GRAY }}>
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </button>
            </Link>
            <span style={{ color: BORDER }}>/</span>
            <span className="text-sm font-medium" style={{ color: DARK }}>Week of {weekLabel}</span>
          </div>
          <button
            onClick={() => setRegenOpen(true)}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: SAGE }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">

        {/* Tab switcher */}
        <div className="mb-6 inline-flex rounded-xl bg-white p-1" style={{ border: `1px solid ${BORDER}` }}>
          {(["plan", "grocery"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="rounded-lg px-5 py-2 text-sm font-medium transition-all"
              style={activeTab === tab ? { backgroundColor: SAGE, color: "white" } : { color: GRAY }}
            >
              {tab === "plan" ? "Weekly Plan" : "Grocery List"}
            </button>
          ))}
        </div>

        {error && (
          <p className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#FEE2E2", color: "#B91C1C" }}>{error}</p>
        )}

        {/* ── Weekly Plan tab ── */}
        {activeTab === "plan" && (
          <>
            {fetchLoading ? <Skeleton /> : !plan ? (
              <div className="flex flex-col items-center rounded-2xl bg-white py-20 text-center" style={{ border: `1px solid ${BORDER}` }}>
                <p className="text-lg font-semibold mb-2" style={{ color: DARK }}>No plan yet</p>
                <p className="text-sm mb-6" style={{ color: GRAY }}>Complete the onboarding to generate your first week.</p>
                <Link href="/onboard">
                  <button className="rounded-full px-6 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: SAGE }}>
                    Create my plan →
                  </button>
                </Link>
              </div>
            ) : (
              <>
                {/* Summary bar */}
                <div className="mb-6 rounded-2xl px-5 py-3 text-sm" style={{ backgroundColor: ACCENT, color: SAGE }}>
                  {plan.meals.length} meals planned this week
                  {plan.meals.some((m) => m.is_leftover) && " · includes leftover meal"}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {plan.meals.map((meal) => (
                    <div
                      key={`${meal.day_of_week}-${meal.meal_name}`}
                      className="rounded-2xl bg-white p-5"
                      style={{ border: `1px solid ${BORDER}` }}
                    >
                      {/* Day header */}
                      <div className="mb-3 flex items-center justify-between">
                        <p className="font-semibold text-sm" style={{ color: DARK }}>{meal.day_name}</p>
                        <div className="flex items-center gap-1.5">
                          {meal.is_leftover && (
                            <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: ACCENT, color: SAGE }}>
                              Leftover
                            </span>
                          )}
                          {meal.prep_time_mins > 0 && (
                            <span className="text-xs" style={{ color: GRAY }}>{meal.prep_time_mins} min</span>
                          )}
                        </div>
                      </div>

                      <p className="font-medium text-sm" style={{ color: DARK }}>{meal.meal_name}</p>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: GRAY }}>{meal.description}</p>

                      {meal.portion_notes && (
                        <p className="mt-2 rounded-lg px-3 py-1.5 text-xs" style={{ backgroundColor: MUTED_BG, color: GRAY }}>
                          {meal.portion_notes}
                        </p>
                      )}

                      {/* Ingredient pills */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {meal.key_ingredients.map((ing) => (
                          <span key={ing} className="rounded-full px-2.5 py-0.5 text-xs" style={{ backgroundColor: MUTED_BG, color: GRAY }}>
                            {ing}
                          </span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                          style={{ border: `1px solid ${BORDER}`, color: GRAY }}
                        >
                          <Shuffle className="h-3 w-3" />
                          Swap
                        </button>
                        <button
                          onClick={() => toggleFav(meal.meal_name)}
                          className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all"
                          style={
                            favourites.includes(meal.meal_name)
                              ? { backgroundColor: ACCENT, color: SAGE }
                              : { border: `1px solid ${BORDER}`, color: GRAY }
                          }
                        >
                          <Heart className="h-3 w-3" style={favourites.includes(meal.meal_name) ? { fill: SAGE } : {}} />
                          {favourites.includes(meal.meal_name) ? "Saved" : "Save"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Regenerate all */}
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setRegenOpen(true)}
                    className="flex items-center gap-2 rounded-full px-7 py-3 text-sm font-medium text-white"
                    style={{ backgroundColor: SAGE }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Regenerate entire week
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ── Grocery List tab ── */}
        {activeTab === "grocery" && (
          <div className="max-w-2xl">
            {fetchLoading ? (
              <div className="space-y-4">
                {[3, 5, 4].map((n, i) => (
                  <div key={i} className="overflow-hidden rounded-2xl bg-white animate-pulse" style={{ border: `1px solid ${BORDER}` }}>
                    {Array.from({ length: n }).map((_, j) => (
                      <div key={j} className="flex items-center gap-3 px-5 py-4" style={j > 0 ? { borderTop: `1px solid ${BORDER}` } : {}}>
                        <div className="h-5 w-5 rounded" style={{ backgroundColor: MUTED_BG }} />
                        <div className="h-4 flex-1 rounded-full" style={{ backgroundColor: MUTED_BG }} />
                        <div className="h-4 w-12 rounded-full" style={{ backgroundColor: MUTED_BG }} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : !plan ? (
              <p className="text-sm" style={{ color: GRAY }}>No grocery list yet — generate a plan first.</p>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: DARK }}>Your shopping list</h2>
                    <p className="text-sm" style={{ color: GRAY }}>
                      {checkedItems} of {totalItems} items checked
                    </p>
                  </div>
                  <button
                    className="text-xs font-medium"
                    style={{ color: SAGE }}
                    onClick={() => setPlan((p) => p ? { ...p, grocery_list: p.grocery_list.map((i) => ({ ...i, checked: false })) } : p)}
                  >
                    Clear all
                  </button>
                </div>

                {/* Progress */}
                <div className="mb-8 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: BORDER }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ backgroundColor: SAGE, width: `${totalItems > 0 ? (checkedItems / totalItems) * 100 : 0}%` }}
                  />
                </div>

                <div className="space-y-8">
                  {Object.entries(groceryByCategory).map(([category, items]) => (
                    <div key={category}>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: GRAY }}>{category}</p>
                      <div className="overflow-hidden rounded-2xl bg-white" style={{ border: `1px solid ${BORDER}` }}>
                        {items.map((item, idx) => (
                          <button
                            key={item.name}
                            onClick={() => toggleChecked(item.name)}
                            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors"
                            style={idx > 0 ? { borderTop: `1px solid ${BORDER}` } : {}}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                                style={{
                                  backgroundColor: item.checked ? SAGE : "white",
                                  border: `1.5px solid ${item.checked ? SAGE : BORDER}`,
                                }}
                              >
                                {item.checked && (
                                  <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                              <span
                                className="text-sm"
                                style={{ color: item.checked ? GRAY : DARK, textDecoration: item.checked ? "line-through" : "none" }}
                              >
                                {item.name}
                              </span>
                            </div>
                            <span className="text-sm" style={{ color: GRAY }}>{item.quantity}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
