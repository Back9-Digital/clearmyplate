"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Check, ChevronLeft, Plus, Minus, Users, Zap, Leaf } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const SAGE     = "#4A7C6F"
const BG       = "#F5F3EE"
const MUTED_BG = "#EAE8E3"
const BORDER   = "#DDD9D1"
const DARK     = "#1C2B27"
const GRAY     = "#6B7B77"
const ACCENT   = "#D4E8E2"

const TOTAL_STEPS = 8

type FormData = {
  goal: "maintain" | "build_muscle" | "lose_weight"
  adults: number
  kids: number
  meals_together: boolean
  meals: string[]
  units: "metric" | "imperial"
  household_type: string[]
  will_eat: string[]
  wont_eat: string
  allergies: string[]
  other_allergies: string
  budget: number | null
  custom_budget: string
  use_leftovers: boolean
  vegetarian_night: boolean
  keep_simple: boolean
}

const initialData: FormData = {
  goal: "maintain",
  adults: 2,
  kids: 0,
  meals_together: true,
  meals: ["dinner"],
  units: "metric",
  household_type: ["mixed_household"],
  will_eat: [],
  wont_eat: "",
  allergies: [],
  other_allergies: "",
  budget: 200,
  custom_budget: "",
  use_leftovers: true,
  vegetarian_night: false,
  keep_simple: true,
}

const allergyOptions = ["Gluten", "Dairy", "Eggs", "Nuts", "Shellfish", "Soy", "Sesame"]

const foodPills = ["Chicken", "Fish", "Beef", "Pork", "Lamb", "Vegetarian", "Rice", "Pasta", "Potatoes", "Bread"]

const householdCards = [
  {
    value: "mixed_household",
    label: "Mixed household",
    desc: "Adults and kids, balanced portions for everyone.",
    icon: Users,
    iconBg: ACCENT,
    iconColor: SAGE,
  },
  {
    value: "active_adults",
    label: "Active adults",
    desc: "Higher energy needs, bigger portions, more protein.",
    icon: Zap,
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
  },
  {
    value: "weight_management",
    label: "Weight management",
    desc: "Satisfying but lighter — more vegetables and lean protein.",
    icon: Leaf,
    iconBg: "#DCFCE7",
    iconColor: "#16A34A",
  },
]

// ── Sub-components ─────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex w-full gap-1.5">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className="h-1.5 flex-1 rounded-full transition-all duration-300"
          style={{
            backgroundColor: i <= step ? SAGE : BORDER,
            opacity: i === step ? 0.6 : 1,
          }}
        />
      ))}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors"
      style={{ backgroundColor: checked ? SAGE : BORDER }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: checked ? "translateX(20px)" : "translateX(2px)" }}
      />
    </button>
  )
}

function Counter({ label, value, onChange, min = 0, max = Infinity }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number
}) {
  const atMax = value >= max
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white px-5 py-4" style={{ border: `1px solid ${BORDER}` }}>
      <span className="font-medium text-sm" style={{ color: DARK }}>{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: MUTED_BG }}
        >
          <Minus className="h-4 w-4" style={{ color: DARK }} />
        </button>
        <span className="w-5 text-center font-semibold" style={{ color: DARK }}>{value}</span>
        <button
          onClick={() => !atMax && onChange(value + 1)}
          disabled={atMax}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-opacity"
          style={{ backgroundColor: atMax ? "#9CA3AF" : SAGE, cursor: atMax ? "not-allowed" : "pointer" }}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────

export default function Onboard() {
  const router = useRouter()
  const [step, setStep]       = useState(0)
  const [data, setData]       = useState<FormData>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [planType, setPlanType] = useState<string>("free")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from("profiles")
        .select("plan_type")
        .eq("id", user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile?.plan_type) setPlanType(profile.plan_type)
        })
    })
  }, [])

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setData((d) => ({ ...d, [key]: value }))

  const toggleHouseholdType = (value: string) =>
    setData((d) => ({
      ...d,
      household_type: d.household_type.includes(value)
        ? d.household_type.filter((v) => v !== value)
        : [...d.household_type, value],
    }))

  const toggleWillEat = (item: string) =>
    setData((d) => ({
      ...d,
      will_eat: d.will_eat.includes(item)
        ? d.will_eat.filter((x) => x !== item)
        : [...d.will_eat, item],
    }))

  const toggleAllergy = (item: string) =>
    setData((d) => ({
      ...d,
      allergies: d.allergies.includes(item)
        ? d.allergies.filter((x) => x !== item)
        : [...d.allergies, item],
    }))

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const allAllergies = [
        ...data.allergies,
        ...data.other_allergies.split(",").map((s) => s.trim()).filter(Boolean),
      ]
      const payload = {
        ...data,
        // Default household_type to mixed_household if nothing selected
        household_type: data.household_type.length ? data.household_type : ["mixed_household"],
        allergies: allAllergies,
      }

      const res = await fetch("/api/plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (res.status === 401) {
        router.push("/signup?message=Please+create+a+free+account+to+generate+your+meal+plan")
        return
      }

      if (res.status === 403 && result.trialExpired) {
        setError("Your free trial has expired. Upgrade to continue generating meal plans.")
        setLoading(false)
        return
      }

      if (res.status === 403 && result.limitReached) {
        setError(`You've used all ${result.limit} free meal plan${result.limit !== 1 ? "s" : ""}. Upgrade to keep generating.`)
        setLoading(false)
        return
      }

      if (!res.ok) {
        const errMsg = result?.detail || result?.error || "Server error"
        throw new Error(errMsg)
      }

      // Stash the plan so /dashboard/plan can read it without auth
      if (typeof window !== "undefined") {
        localStorage.setItem("cmp_latest_plan", JSON.stringify(result))
        if (result.plan_id) {
          localStorage.setItem("cmp_latest_plan_id", result.plan_id)
        }
      }

      router.push("/dashboard/plan")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong"
      console.error("[onboard/generate]", msg)
      setError(msg.length < 200 ? msg : "Something went wrong — please try again.")
      setLoading(false)
    }
  }

  const goalLabel = { build_muscle: "Build muscle", lose_weight: "Lose weight", maintain: "Maintain" }[data.goal]

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      <div className="mx-auto w-full max-w-lg px-4 pb-24 pt-10 sm:px-6">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Image src="/images/Clear My Plate Logo Horizontal Lockup.svg" alt="ClearMyPlate" width={180} height={44} className="h-8 w-auto sm:h-11" unoptimized priority />
          <span className="text-xs font-medium" style={{ color: GRAY }}>Step {step + 1} of {TOTAL_STEPS}</span>
        </div>

        <ProgressBar step={step} />

        <div className="mt-10">

          {/* ── Step 1: Goal ── */}
          {step === 0 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold" style={{ color: DARK }}>What&rsquo;s your goal?</h2>
              <p className="mb-8 text-sm" style={{ color: GRAY }}>This helps us plan meals that work for your household.</p>
              <div className="flex flex-col gap-4">
                {(
                  [
                    { value: "build_muscle", label: "Build muscle", dot: SAGE,      desc: "Higher protein meals that support an active lifestyle." },
                    { value: "lose_weight",  label: "Lose weight",  dot: "#5B8DB8", desc: "Balanced, satisfying meals without feeling restricted."  },
                    { value: "maintain",     label: "Maintain",     dot: "#9CA3AF", desc: "Real food your family loves, week in, week out."          },
                  ] as const
                ).map((opt) => {
                  const selected = data.goal === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => set("goal", opt.value)}
                      className="flex w-full items-start gap-4 rounded-2xl bg-white px-6 py-5 text-left transition-all"
                      style={{
                        border: `2px solid ${selected ? SAGE : BORDER}`,
                        boxShadow: selected ? `0 0 0 3px ${ACCENT}` : "none",
                      }}
                    >
                      <div
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                        style={{
                          borderColor: selected ? opt.dot : BORDER,
                          backgroundColor: selected ? opt.dot : "transparent",
                        }}
                      >
                        {selected && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold" style={{ color: DARK }}>{opt.label}</p>
                        <p className="mt-0.5 text-sm leading-relaxed" style={{ color: GRAY }}>{opt.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Step 2: Household ── */}
          {step === 1 && (() => {
            const isFree    = planType === "free"
            const atFreeCap = isFree && (data.adults >= 2 && data.kids >= 3)
            // Free: max 2 adults, max 3 kids — Paid: max 4 adults, max 10 kids
            const maxAdults = isFree ? 2  : 4
            const maxKids   = isFree ? 3  : 10

            return (
              <div>
                <h2 className="mb-1 text-2xl font-bold" style={{ color: DARK }}>Who are you feeding?</h2>
                <p className="mb-8 text-sm" style={{ color: GRAY }}>We&rsquo;ll size meals and grocery quantities to your household.</p>
                <div className="space-y-3">
                  <Counter label="Adults" value={data.adults} onChange={(v) => set("adults", v)} min={1} max={maxAdults} />
                  <Counter label="Kids"   value={data.kids}   onChange={(v) => set("kids", v)}   min={0} max={maxKids} />

                  {/* Upgrade prompt when free user hits the cap */}
                  {atFreeCap && (
                    <div
                      className="rounded-2xl px-5 py-4"
                      style={{ backgroundColor: "#FEF3C7", border: "1px solid #FCD34D" }}
                    >
                      <p className="text-sm font-semibold" style={{ color: "#92400E" }}>
                        Free plan: up to 2 adults + 3 kids
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: "#B45309" }}>
                        Upgrade to plan for up to 14 people (4 adults + 10 kids).
                      </p>
                      <Link href="/#pricing">
                        <button
                          className="mt-3 rounded-full px-4 py-1.5 text-xs font-semibold text-white"
                          style={{ backgroundColor: "#D97706" }}
                        >
                          See plans →
                        </button>
                      </Link>
                    </div>
                  )}

                  <div
                    className="flex items-center justify-between rounded-2xl bg-white px-5 py-4"
                    style={{ border: `1px solid ${BORDER}` }}
                  >
                    <span className="text-sm font-medium" style={{ color: DARK }}>We usually eat dinner together</span>
                    <Toggle checked={data.meals_together} onChange={(v) => set("meals_together", v)} />
                  </div>
                </div>
              </div>
            )
          })()}

          {/* ── Step 3: Planning preferences ── */}
          {step === 2 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold" style={{ color: DARK }}>Planning preferences</h2>
              <p className="mb-8 text-sm" style={{ color: GRAY }}>Which meals do you want planned, and what units do you prefer?</p>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: GRAY }}>Meals to plan</p>
                {["Lunch", "Dinner"].map((meal) => {
                  const key = meal.toLowerCase()
                  const checked = data.meals.includes(key)
                  return (
                    <button
                      key={meal}
                      onClick={() => set("meals", checked ? data.meals.filter((m) => m !== key) : [...data.meals, key])}
                      className="flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4"
                      style={{ border: `2px solid ${checked ? SAGE : BORDER}` }}
                    >
                      <span className="text-sm font-medium" style={{ color: DARK }}>{meal}</span>
                      {checked && <Check className="h-4 w-4" style={{ color: SAGE }} />}
                    </button>
                  )
                })}
                <p className="mt-5 text-xs font-semibold uppercase tracking-widest" style={{ color: GRAY }}>Units</p>
                <div className="flex gap-3">
                  {(["metric", "imperial"] as const).map((u) => (
                    <button
                      key={u}
                      onClick={() => set("units", u)}
                      className="flex-1 rounded-2xl bg-white py-3 text-sm font-medium capitalize transition-all"
                      style={{ border: `2px solid ${data.units === u ? SAGE : BORDER}`, color: data.units === u ? SAGE : DARK }}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Who's this plan for? ── */}
          {step === 3 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold" style={{ color: DARK }}>Who&rsquo;s this plan for?</h2>
              <p className="mb-8 text-sm" style={{ color: GRAY }}>
                We&rsquo;ll size portions accordingly — no calorie counting needed.
              </p>
              <div className="flex flex-col gap-4">
                {householdCards.map(({ value, label, desc, icon: Icon, iconBg, iconColor }) => {
                  const selected = data.household_type.includes(value)
                  return (
                    <button
                      key={value}
                      onClick={() => toggleHouseholdType(value)}
                      className="flex w-full items-start gap-4 rounded-2xl bg-white px-6 py-5 text-left transition-all"
                      style={{
                        border: `2px solid ${selected ? SAGE : BORDER}`,
                        boxShadow: selected ? `0 0 0 3px ${ACCENT}` : "none",
                      }}
                    >
                      <div
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: iconBg }}
                      >
                        <Icon className="h-4 w-4" style={{ color: iconColor }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold" style={{ color: DARK }}>{label}</p>
                        <p className="mt-0.5 text-sm leading-relaxed" style={{ color: GRAY }}>{desc}</p>
                      </div>
                      {/* Checkbox indicator */}
                      <div
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded"
                        style={{
                          border: `2px solid ${selected ? SAGE : BORDER}`,
                          backgroundColor: selected ? SAGE : "transparent",
                        }}
                      >
                        {selected && <Check className="h-3 w-3 text-white" />}
                      </div>
                    </button>
                  )
                })}
              </div>
              <p className="mt-6 text-center text-xs" style={{ color: GRAY }}>
                We handle the portions. You just handle the cooking.
              </p>
            </div>
          )}

          {/* ── Step 5: Food preferences ── */}
          {step === 4 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold" style={{ color: DARK }}>Food preferences</h2>
              <p className="mb-8 text-sm" style={{ color: GRAY }}>Select everything you&rsquo;re happy to eat.</p>
              <div className="flex flex-wrap gap-2">
                {foodPills.map((pill) => {
                  const selected = data.will_eat.includes(pill)
                  return (
                    <button
                      key={pill}
                      onClick={() => toggleWillEat(pill)}
                      className="rounded-full px-4 py-2 text-sm font-medium transition-all"
                      style={
                        selected
                          ? { backgroundColor: SAGE, color: "white" }
                          : { backgroundColor: "white", color: DARK, border: `1.5px solid ${BORDER}` }
                      }
                    >
                      {pill}
                    </button>
                  )
                })}
              </div>
              <div className="mt-6">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest" style={{ color: GRAY }}>
                  Won&rsquo;t eat (preferences — we&rsquo;ll try to avoid)
                </label>
                <textarea
                  className="w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm outline-none"
                  style={{ border: `1.5px solid ${BORDER}`, color: DARK, minHeight: 80 }}
                  placeholder="e.g. blue cheese, mushrooms…"
                  value={data.wont_eat}
                  onChange={(e) => set("wont_eat", e.target.value)}
                />
              </div>

              {/* Allergies */}
              <div className="mt-6">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest" style={{ color: "#B91C1C" }}>
                  Allergies &amp; Intolerances — never included
                </label>
                <p className="mb-3 text-xs" style={{ color: GRAY }}>
                  These are treated as strict exclusions — never used in any meal or ingredient.
                </p>
                <div className="flex flex-wrap gap-2">
                  {allergyOptions.map((item) => {
                    const selected = data.allergies.includes(item)
                    return (
                      <button
                        key={item}
                        onClick={() => toggleAllergy(item)}
                        className="rounded-full px-4 py-2 text-sm font-medium transition-all"
                        style={
                          selected
                            ? { backgroundColor: "#B91C1C", color: "white" }
                            : { backgroundColor: "white", color: DARK, border: `1.5px solid ${BORDER}` }
                        }
                      >
                        {item}
                      </button>
                    )
                  })}
                </div>
                <div className="mt-3">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-widest" style={{ color: GRAY }}>
                    Other allergies
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none"
                    style={{ border: `1.5px solid ${BORDER}`, color: DARK }}
                    placeholder="e.g. pine nuts, kiwifruit…"
                    value={data.other_allergies}
                    onChange={(e) => set("other_allergies", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 6: Budget ── */}
          {step === 5 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold" style={{ color: DARK }}>Weekly budget</h2>
              <p className="mb-8 text-sm" style={{ color: GRAY }}>We&rsquo;ll keep meals within your weekly grocery budget (NZD).</p>
              <div className="grid grid-cols-3 gap-3">
                {[150, 200, 250].map((b) => (
                  <button
                    key={b}
                    onClick={() => { set("budget", b); set("custom_budget", "") }}
                    className="rounded-2xl bg-white py-5 text-center transition-all"
                    style={{ border: `2px solid ${data.budget === b && !data.custom_budget ? SAGE : BORDER}` }}
                  >
                    <p className="text-2xl font-bold" style={{ color: data.budget === b && !data.custom_budget ? SAGE : DARK }}>${b}</p>
                    <p className="mt-1 text-xs" style={{ color: GRAY }}>per week</p>
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest" style={{ color: GRAY }}>Custom amount</label>
                <div className="flex items-center rounded-2xl bg-white px-4 py-3" style={{ border: `1.5px solid ${BORDER}` }}>
                  <span className="mr-1 text-sm font-medium" style={{ color: GRAY }}>$</span>
                  <input
                    type="number"
                    className="flex-1 bg-transparent text-sm outline-none"
                    style={{ color: DARK }}
                    placeholder="Enter custom budget…"
                    value={data.custom_budget}
                    onChange={(e) => {
                      set("custom_budget", e.target.value)
                      set("budget", e.target.value ? Number(e.target.value) : null)
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 7: Week preferences ── */}
          {step === 6 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold" style={{ color: DARK }}>Week preferences</h2>
              <p className="mb-8 text-sm" style={{ color: GRAY }}>Fine-tune how we plan your week.</p>
              <div className="space-y-3">
                {(
                  [
                    { key: "use_leftovers",    label: "Use leftovers",                  desc: "Plan one meal per week around leftovers from the night before." },
                    { key: "vegetarian_night", label: "Include one vegetarian dinner",   desc: "Great for variety and keeping costs down."                     },
                    { key: "keep_simple",      label: "Keep meals simple",               desc: "Prefer quick, easy recipes with fewer steps."                  },
                  ] as const
                ).map(({ key, label, desc }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-white px-5 py-4"
                    style={{ border: `1px solid ${BORDER}` }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: DARK }}>{label}</p>
                      <p className="mt-0.5 text-xs" style={{ color: GRAY }}>{desc}</p>
                    </div>
                    <Toggle checked={data[key] as boolean} onChange={(v) => set(key, v)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 8: Summary ── */}
          {step === 7 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold" style={{ color: DARK }}>Ready to go!</h2>
              <p className="mb-8 text-sm" style={{ color: GRAY }}>Here&rsquo;s what we know about your household.</p>
              <div className="rounded-2xl bg-white p-6" style={{ border: `1px solid ${BORDER}` }}>
                <div className="space-y-4">
                  {[
                    { label: "Household",     value: `${data.adults} adult${data.adults !== 1 ? "s" : ""}${data.kids > 0 ? `, ${data.kids} kid${data.kids !== 1 ? "s" : ""}` : ""}` },
                    { label: "Goal",          value: goalLabel },
                    { label: "Plan type",     value: data.household_type.map((t) => householdCards.find((c) => c.value === t)?.label ?? t).join(", ") || "Mixed household" },
                    { label: "Meals planned", value: data.meals.map((m) => m[0].toUpperCase() + m.slice(1)).join(" & ") || "None" },
                    { label: "Budget",        value: data.budget ? `$${data.budget} NZD / week` : "Not set" },
                    { label: "Will eat",      value: data.will_eat.length ? data.will_eat.join(", ") : "Everything" },
                    { label: "Won't eat",     value: data.wont_eat || "Nothing listed" },
                    { label: "Use leftovers", value: data.use_leftovers ? "Yes" : "No" },
                    { label: "Vegetarian night", value: data.vegetarian_night ? "Yes" : "No" },
                    { label: "Keep simple",   value: data.keep_simple ? "Yes" : "No" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-start justify-between gap-4">
                      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: GRAY }}>{label}</span>
                      <span className="text-right text-sm font-medium" style={{ color: DARK }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <p className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#FEE2E2", color: "#B91C1C" }}>
                  {error}
                </p>
              )}

              {/* Loading state */}
              {loading && (
                <div
                  className="mt-6 flex flex-col items-center gap-3 rounded-2xl px-6 py-8"
                  style={{ backgroundColor: ACCENT }}
                >
                  <div
                    className="h-8 w-8 animate-spin rounded-full border-2 border-transparent"
                    style={{ borderTopColor: SAGE, borderRightColor: SAGE }}
                  />
                  <p className="text-sm font-medium" style={{ color: SAGE }}>Clearing your plate…</p>
                  <p className="text-xs text-center" style={{ color: GRAY }}>Building your personalised week. This takes around 20 seconds.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 text-sm font-medium"
              style={{ color: GRAY }}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          ) : <div />}

          <div className="flex flex-col items-end gap-2">
            {/* Skip link on step 4 */}
            {step === 3 && !loading && (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="text-xs"
                style={{ color: GRAY }}
              >
                Skip this →
              </button>
            )}

            {step < TOTAL_STEPS - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="rounded-full px-7 py-2.5 text-sm font-semibold text-white transition-all"
                style={{ backgroundColor: SAGE }}
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="rounded-full px-7 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-60"
                style={{ backgroundColor: SAGE }}
              >
                {loading ? "Generating…" : "Generate Plan →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
