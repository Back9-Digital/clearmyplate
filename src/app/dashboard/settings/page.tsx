"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Minus, Check, Save, ExternalLink, Mail, UserPlus, X as XIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  generationsAllowed,
  generationsRemaining,
  weekNeedsReset,
} from "@/lib/generations"

const SAGE     = "#4A7C6F"
const BG       = "#F5F3EE"
const MUTED_BG = "#EAE8E3"
const BORDER   = "#DDD9D1"
const DARK     = "#1C2B27"
const GRAY     = "#6B7B77"
const ACCENT   = "#D4E8E2"

const foodPills = [
  "Chicken",
  "Fish",
  "Beef mince",
  "Beef steak",
  "Beef roast",
  "Pork mince",
  "Pork chops",
  "Pork roast",
  "Lamb mince",
  "Lamb chops",
  "Lamb roast",
  "Vegetarian",
  "Rice",
  "Pasta",
  "Potatoes",
  "Bread",
]
const allergyOptions = ["Gluten", "Dairy", "Eggs", "Nuts", "Shellfish", "Soy", "Sesame"]

const MACRO_PRESETS = [
  { label: "Muscle Building", calories: 2400, protein: 40, carbs: 35, fat: 25 },
  { label: "Fat Loss",        calories: 1800, protein: 35, carbs: 35, fat: 30 },
  { label: "Balanced",        calories: 2000, protein: 25, carbs: 50, fat: 25 },
]

const PLAN_LABELS: Record<string, string> = {
  free:           "Free",
  family:         "Family",
  family_monthly: "Family",
  family_annual:  "Family",
  launch_special: "Launch Special",
  lifetime:       "Lifetime",
}

type FamilyMember = { role: "adult" | "child"; name: string }

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-semibold" style={{ color: DARK }}>{title}</h2>
      {description && <p className="mt-0.5 text-sm" style={{ color: GRAY }}>{description}</p>}
    </div>
  )
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between gap-6 rounded-2xl bg-white px-5 py-4"
      style={{ border: `1px solid ${BORDER}` }}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: DARK }}>{label}</p>
        {description && <p className="mt-0.5 text-xs" style={{ color: GRAY }}>{description}</p>}
      </div>
      {children}
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

function Counter({ value, onChange, min = 0 }: { value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full"
        style={{ backgroundColor: MUTED_BG }}
      >
        <Minus className="h-3.5 w-3.5" style={{ color: DARK }} />
      </button>
      <span className="w-5 text-center font-semibold text-sm" style={{ color: DARK }}>{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: SAGE }}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function MacroSlider({
  label, value, onChange, max, color = SAGE, readOnly = false,
}: {
  label: string; value: number; onChange?: (v: number) => void
  max?: number; color?: string; readOnly?: boolean
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: DARK }}>{label}</span>
        <span className="text-sm font-semibold tabular-nums" style={{ color }}>{value}%</span>
      </div>
      {readOnly ? (
        <div className="relative h-2 overflow-hidden rounded-full" style={{ backgroundColor: MUTED_BG }}>
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${value}%`, backgroundColor: color, opacity: 0.5 }} />
        </div>
      ) : (
        <input
          type="range" min={10} max={max ?? 80} value={value}
          onChange={(e) => onChange?.(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: color }}
        />
      )}
    </div>
  )
}

export default function SettingsPage() {
  // Household
  const [adults, setAdults]               = useState(2)
  const [kids, setKids]                   = useState(1)
  const [mealsTogether, setMealsTogether] = useState(true)
  const [timezone, setTimezone]           = useState("Pacific/Auckland")

  // Family members
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    { role: "adult", name: "" },
    { role: "adult", name: "" },
    { role: "child", name: "" },
  ])

  // Goal & budget
  const [goal, setGoal]     = useState<"maintain" | "build_muscle" | "lose_weight">("maintain")
  const [budget, setBudget] = useState(200)

  // Food preferences
  const [willEat, setWillEat]           = useState<string[]>(["Chicken", "Fish", "Beef", "Pasta", "Potatoes"])
  const [wontEat, setWontEat]           = useState("")
  const [allergies, setAllergies]       = useState<string[]>([])
  const [otherAllergies, setOtherAllergies] = useState("")

  // Week preferences
  const [mealsPlanned, setMealsPlanned]       = useState<string[]>(["dinner"])
  const [useLeftovers, setUseLeftovers]       = useState(true)
  const [vegetarianNight, setVegetarianNight] = useState(false)
  const [keepSimple, setKeepSimple]           = useState(true)

  // Advanced — calorie & macro targets
  const [advancedEnabled, setAdvancedEnabled] = useState(false)
  const [calorieTarget, setCalorieTarget]     = useState(2000)
  const [macroProtein, setMacroProtein]       = useState(25)
  const [macroCarbs, setMacroCarbs]           = useState(50)
  const macroFat = Math.max(0, 100 - macroProtein - macroCarbs)

  // Billing
  const [planType, setPlanType]               = useState("free")
  const [generationsUsed, setGenerationsUsed] = useState(0)
  const [weekResetAt, setWeekResetAt]         = useState<string | null>(null)
  const [portalLoading, setPortalLoading]     = useState(false)

  const [saved, setSaved]     = useState(false)
  const [saving, setSaving]   = useState(false)
  const [loading, setLoading] = useState(true)

  // Invites
  type Invite = { id: string; email: string; created_at: string }
  const [invites, setInvites]           = useState<Invite[]>([])
  const [inviteEmail, setInviteEmail]   = useState("")
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteError, setInviteError]   = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)

  // Load profile on mount
  useEffect(() => {
    const supabase = createClient()
    // Use getSession (local read) — faster and more reliable on mobile than getUser (network call)
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user
      if (!user) return
      supabase
        .from("profiles")
        .select("calorie_target, macro_protein, macro_carbs, macro_fat, plan_type, generations_this_week, week_reset_at, family_members, allergies, goal, weekly_budget, will_eat, wont_eat, use_leftovers, vegetarian_night, keep_simple, meals_planned")
        .eq("id", user.id)
        .single()
        .then(({ data, error }) => {
          if (error) console.error("[settings] profile fetch error:", error.message)
          if (!data) { setLoading(false); return }

          // Calorie / macro
          if (data.calorie_target != null) {
            setAdvancedEnabled(true)
            setCalorieTarget(data.calorie_target)
            setMacroProtein(data.macro_protein ?? 25)
            setMacroCarbs(data.macro_carbs ?? 50)
          }

          // Billing
          if (data.plan_type)             setPlanType(data.plan_type)
          if (data.generations_this_week != null) setGenerationsUsed(data.generations_this_week)
          if (data.week_reset_at)         setWeekResetAt(data.week_reset_at)

          // Family members — derive adults/kids from stored data
          if (Array.isArray(data.family_members) && data.family_members.length) {
            const members = data.family_members as FamilyMember[]
            setFamilyMembers(members)
            setAdults(members.filter((m) => m.role === "adult").length || 2)
            setKids(members.filter((m) => m.role === "child").length)
          }

          // Allergies
          if (Array.isArray(data.allergies)) {
            const known   = (data.allergies as string[]).filter((a) => allergyOptions.includes(a))
            const unknown = (data.allergies as string[]).filter((a) => !allergyOptions.includes(a))
            setAllergies(known)
            setOtherAllergies(unknown.join(", "))
          }

          // Preferences
          if (data.goal)                  setGoal(data.goal as "maintain" | "build_muscle" | "lose_weight")
          if (data.weekly_budget != null) setBudget(data.weekly_budget)
          if (Array.isArray(data.will_eat) && data.will_eat.length) setWillEat(data.will_eat as string[])
          if (data.wont_eat != null)      setWontEat(data.wont_eat)
          if (Array.isArray(data.meals_planned) && data.meals_planned.length) setMealsPlanned(data.meals_planned as string[])
          if (data.use_leftovers != null)    setUseLeftovers(data.use_leftovers)
          if (data.vegetarian_night != null) setVegetarianNight(data.vegetarian_night)
          if (data.keep_simple != null)      setKeepSimple(data.keep_simple)

          setLoading(false)
        })
    })
  }, [])

  // Load pending invites
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user
      if (!user) return
      supabase
        .from("household_invites")
        .select("id, email, created_at")
        .eq("household_id", user.id)
        .is("accepted_at", null)
        .order("created_at", { ascending: false })
        .then(({ data }) => { if (data) setInvites(data) })
    })
  }, [])

  // ── Invite helpers ───────────────────────────────────────────
  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviteSending(true)
    setInviteError(null)
    try {
      const res = await fetch("/api/invite/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to send invite")
      setInvites((prev) => [data.invite, ...prev])
      setInviteEmail("")
      setInviteSuccess(true)
      setTimeout(() => setInviteSuccess(false), 3000)
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to send invite")
    } finally {
      setInviteSending(false)
    }
  }

  const handleCancelInvite = async (id: string) => {
    const res = await fetch("/api/invite/cancel", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setInvites((prev) => prev.filter((i) => i.id !== id))
  }

  // ── Family member helpers ────────────────────────────────────
  const handleAdultsChange = (v: number) => {
    setAdults(v)
    setFamilyMembers((prev) => {
      const prevAdults = prev.filter((m) => m.role === "adult")
      const prevKids   = prev.filter((m) => m.role === "child")
      const newAdults  = v > prevAdults.length
        ? [...prevAdults, ...Array(v - prevAdults.length).fill(null).map(() => ({ role: "adult" as const, name: "" }))]
        : prevAdults.slice(0, v)
      return [...newAdults, ...prevKids]
    })
  }

  const handleKidsChange = (v: number) => {
    setKids(v)
    setFamilyMembers((prev) => {
      const prevAdults = prev.filter((m) => m.role === "adult")
      const prevKids   = prev.filter((m) => m.role === "child")
      const newKids    = v > prevKids.length
        ? [...prevKids, ...Array(v - prevKids.length).fill(null).map(() => ({ role: "child" as const, name: "" }))]
        : prevKids.slice(0, v)
      return [...prevAdults, ...newKids]
    })
  }

  const updateMemberName = (index: number, name: string) => {
    setFamilyMembers((prev) => prev.map((m, i) => i === index ? { ...m, name } : m))
  }

  // ── Allergy helpers ──────────────────────────────────────────
  const toggleAllergy = (item: string) =>
    setAllergies((prev) => prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item])

  // ── Macro helpers ────────────────────────────────────────────
  const applyPreset = (preset: typeof MACRO_PRESETS[number]) => {
    setCalorieTarget(preset.calories)
    setMacroProtein(preset.protein)
    setMacroCarbs(preset.carbs)
  }

  const handleProteinChange = (v: number) => setMacroProtein(Math.max(10, Math.min(v, 80 - macroCarbs)))
  const handleCarbsChange   = (v: number) => setMacroCarbs(Math.max(10, Math.min(v, 80 - macroProtein)))

  const toggleWillEat = (item: string) =>
    setWillEat((prev) => prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item])

  // ── Save ─────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const allAllergies = [
        ...allergies,
        ...otherAllergies.split(",").map((s) => s.trim()).filter(Boolean),
      ]

      await supabase
        .from("profiles")
        .update({
          calorie_target:   advancedEnabled ? calorieTarget : null,
          macro_protein:    advancedEnabled ? macroProtein  : null,
          macro_carbs:      advancedEnabled ? macroCarbs    : null,
          macro_fat:        advancedEnabled ? macroFat      : null,
          family_members:   familyMembers.filter((m) => m.name.trim()),
          allergies:        allAllergies.length ? allAllergies : null,
          goal,
          household_adults: adults,
          household_kids:   kids,
          weekly_budget:    budget,
          will_eat:         willEat.length ? willEat : [],
          wont_eat:         wontEat || null,
          meals_planned:    mealsPlanned.length ? mealsPlanned : ["dinner"],
          use_leftovers:    useLeftovers,
          vegetarian_night: vegetarianNight,
          keep_simple:      keepSimple,
        })
        .eq("id", user.id)

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  // ── Billing helpers ──────────────────────────────────────────
  const isPaid     = planType !== "free"
  const isFamily   = planType === "family" || planType === "family_monthly" || planType === "family_annual"
  const isLifetime = planType === "lifetime" || planType === "launch_special"
  const limit      = generationsAllowed(planType)
  const actualUsed = weekNeedsReset(weekResetAt ?? new Date().toISOString()) ? 0 : generationsUsed
  const remaining  = generationsRemaining(planType, actualUsed)

  const handlePortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setPortalLoading(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────
  const adultMembers = familyMembers.filter((m) => m.role === "adult")
  const kidMembers   = familyMembers.filter((m) => m.role === "child")
  const adultOffset  = 0
  const kidOffset    = adultMembers.length

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: BG }}>

      {/* Nav */}
      <header className="border-b bg-white" style={{ borderColor: BORDER }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <button className="flex items-center gap-1.5 text-sm" style={{ color: GRAY }}>
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </button>
            </Link>
            <span className="hidden sm:inline" style={{ color: BORDER }}>/</span>
            <span className="hidden sm:inline text-sm font-medium" style={{ color: DARK }}>Settings</span>
          </div>
          <span className="text-base font-semibold" style={{ color: SAGE }}>ClearMyPlate</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-10">
          <h1 className="text-2xl font-bold" style={{ color: DARK }}>Settings</h1>
          <p className="mt-1 text-sm" style={{ color: GRAY }}>
            Update your household and meal planning preferences.
          </p>
        </div>

        <div className="space-y-12">

          {/* ── Household ── */}
          <section>
            <SectionHeading title="Household" description="Who are we planning meals for?" />
            <div className="space-y-3">
              <Row label="Adults">
                <Counter value={adults} onChange={handleAdultsChange} min={1} />
              </Row>
              <Row label="Kids">
                <Counter value={kids} onChange={handleKidsChange} />
              </Row>
              <Row label="We usually eat dinner together">
                <Toggle checked={mealsTogether} onChange={setMealsTogether} />
              </Row>
              <Row label="Timezone" description="Used to schedule your weekly plan">
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="rounded-lg bg-transparent py-1 pl-2 pr-6 text-sm outline-none"
                  style={{ border: `1px solid ${BORDER}`, color: DARK }}
                >
                  <option value="Pacific/Auckland">Auckland (NZST)</option>
                  <option value="Australia/Sydney">Sydney (AEST)</option>
                  <option value="Australia/Melbourne">Melbourne (AEST)</option>
                  <option value="America/New_York">New York (EST)</option>
                  <option value="America/Los_Angeles">Los Angeles (PST)</option>
                  <option value="Europe/London">London (GMT)</option>
                </select>
              </Row>
            </div>
          </section>

          <div className="h-px" style={{ backgroundColor: BORDER }} />

          {/* ── Your Family ── */}
          <section>
            <SectionHeading
              title="Your Family"
              description="Name each person. The AI uses these to personalise portion notes and meal suggestions."
            />
            <div className="space-y-3">
              {adultMembers.map((member, i) => (
                <div
                  key={`adult-${i}`}
                  className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4"
                  style={{ border: `1px solid ${BORDER}` }}
                >
                  <span className="w-20 shrink-0 text-xs font-semibold uppercase tracking-widest" style={{ color: GRAY }}>
                    Adult {i + 1}
                  </span>
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => updateMemberName(adultOffset + i, e.target.value)}
                    placeholder={`e.g. ${["Phil", "Sarah", "Alex", "Jordan"][i] ?? "Name"}`}
                    className="flex-1 bg-transparent text-sm outline-none"
                    style={{ color: DARK }}
                  />
                </div>
              ))}
              {kidMembers.map((member, i) => (
                <div
                  key={`child-${i}`}
                  className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4"
                  style={{ border: `1px solid ${BORDER}` }}
                >
                  <span className="w-20 shrink-0 text-xs font-semibold uppercase tracking-widest" style={{ color: GRAY }}>
                    Child {i + 1}
                  </span>
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => updateMemberName(kidOffset + i, e.target.value)}
                    placeholder={`e.g. ${["Mia", "Luca", "Noah", "Ella"][i] ?? "Name"}`}
                    className="flex-1 bg-transparent text-sm outline-none"
                    style={{ color: DARK }}
                  />
                </div>
              ))}
              {familyMembers.length === 0 && (
                <p className="text-sm" style={{ color: GRAY }}>
                  Increase the adult or kids count above to add family members.
                </p>
              )}
            </div>
          </section>

          <div className="h-px" style={{ backgroundColor: BORDER }} />

          {/* ── Goal & Budget ── */}
          <section>
            <SectionHeading title="Goal & Budget" description="Shapes the types of meals we suggest." />
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl bg-white" style={{ border: `1px solid ${BORDER}` }}>
                {(
                  [
                    { value: "maintain",     label: "Maintain",     dot: "#9CA3AF" },
                    { value: "build_muscle", label: "Build muscle", dot: SAGE },
                    { value: "lose_weight",  label: "Lose weight",  dot: "#5B8DB8" },
                  ] as const
                ).map((opt, i) => (
                  <button
                    key={opt.value}
                    onClick={() => setGoal(opt.value)}
                    className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors"
                    style={i > 0 ? { borderTop: `1px solid ${BORDER}` } : {}}
                  >
                    <div
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2"
                      style={{
                        borderColor: goal === opt.value ? opt.dot : BORDER,
                        backgroundColor: goal === opt.value ? opt.dot : "transparent",
                      }}
                    >
                      {goal === opt.value && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm font-medium" style={{ color: DARK }}>{opt.label}</span>
                    {goal === opt.value && <Check className="ml-auto h-3.5 w-3.5" style={{ color: SAGE }} />}
                  </button>
                ))}
              </div>

              <Row label="Weekly grocery budget (NZD)" description="We keep your meal plan within this amount">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm" style={{ color: GRAY }}>$</span>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-20 rounded-lg bg-transparent py-1 pl-2 text-sm outline-none text-right"
                    style={{ border: `1px solid ${BORDER}`, color: DARK }}
                    min={50}
                    step={10}
                  />
                </div>
              </Row>
            </div>
          </section>

          <div className="h-px" style={{ backgroundColor: BORDER }} />

          {/* ── Food Preferences ── */}
          <section>
            <SectionHeading title="Food Preferences" description="Select everything your household is happy to eat." />
            <div className="flex flex-wrap gap-2">
              {foodPills.map((pill) => {
                const selected = willEat.includes(pill)
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
            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest" style={{ color: GRAY }}>
                Won&rsquo;t eat (preferences — we&rsquo;ll try to avoid)
              </label>
              <textarea
                className="w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm outline-none"
                style={{ border: `1.5px solid ${BORDER}`, color: DARK, minHeight: 72 }}
                placeholder="e.g. blue cheese, mushrooms…"
                value={wontEat}
                onChange={(e) => setWontEat(e.target.value)}
              />
            </div>

            {/* Allergies */}
            <div className="mt-6">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest" style={{ color: "#B91C1C" }}>
                Allergies &amp; Intolerances — never included
              </label>
              <p className="mb-3 text-xs" style={{ color: GRAY }}>
                These are treated as strict exclusions in every meal plan.
              </p>
              <div className="flex flex-wrap gap-2">
                {allergyOptions.map((item) => {
                  const selected = allergies.includes(item)
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
                  value={otherAllergies}
                  onChange={(e) => setOtherAllergies(e.target.value)}
                />
              </div>
            </div>
          </section>

          <div className="h-px" style={{ backgroundColor: BORDER }} />

          {/* ── Week Preferences ── */}
          <section>
            <SectionHeading title="Week Preferences" description="Fine-tune how we build your weekly plan." />
            <div className="space-y-3">

              {/* Meals planned */}
              <div>
                <p className="mb-2 text-sm font-medium" style={{ color: DARK }}>Meals to plan</p>
                <div className="space-y-2">
                  {([
                    { key: "dinner", label: "Dinner", desc: "All 7 days, whole family" },
                    { key: "lunch",  label: "Lunch",  desc: "Leftover-based, adults only (Mon–Fri)" },
                  ] as const).map(({ key, label, desc }) => {
                    const checked = mealsPlanned.includes(key)
                    const toggle = () => {
                      if (key === "dinner") return // dinner always required
                      setMealsPlanned(checked
                        ? mealsPlanned.filter((m) => m !== key)
                        : [...mealsPlanned, key]
                      )
                    }
                    return (
                      <button
                        key={key}
                        onClick={toggle}
                        disabled={key === "dinner"}
                        className="flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 text-left"
                        style={{
                          border: `2px solid ${checked ? SAGE : BORDER}`,
                          opacity: key === "dinner" ? 0.7 : 1,
                          cursor: key === "dinner" ? "default" : "pointer",
                        }}
                      >
                        <div>
                          <p className="text-sm font-medium" style={{ color: DARK }}>{label}</p>
                          <p className="mt-0.5 text-xs" style={{ color: GRAY }}>{desc}</p>
                        </div>
                        <div
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                          style={{
                            backgroundColor: checked ? SAGE : "white",
                            border: `1.5px solid ${checked ? SAGE : BORDER}`,
                          }}
                        >
                          {checked && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <Row label="Use leftovers" description="Plan one meal around leftovers from the night before.">
                <Toggle checked={useLeftovers} onChange={setUseLeftovers} />
              </Row>
              <Row label="Include one vegetarian dinner" description="Great for variety and keeping costs down.">
                <Toggle checked={vegetarianNight} onChange={setVegetarianNight} />
              </Row>
              <Row label="Keep meals simple" description="Prefer quick, easy recipes with fewer steps.">
                <Toggle checked={keepSimple} onChange={setKeepSimple} />
              </Row>
            </div>
          </section>

          <div className="h-px" style={{ backgroundColor: BORDER }} />

          {/* ── Advanced ── */}
          <section>
            <SectionHeading
              title="Advanced"
              description="Optional calorie and macro targets. Leave off if you just want great meals without the numbers."
            />
            <div className="space-y-3">
              <Row
                label="I have specific calorie or macro targets"
                description={advancedEnabled ? "Targets will be included in your meal plan prompts." : "Off by default."}
              >
                <Toggle checked={advancedEnabled} onChange={setAdvancedEnabled} />
              </Row>

              {advancedEnabled && !loading && (
                <div className="rounded-2xl bg-white p-6 space-y-7" style={{ border: `1px solid ${BORDER}` }}>
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: GRAY }}>Presets</p>
                    <div className="flex flex-wrap gap-2">
                      {MACRO_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => applyPreset(preset)}
                          className="rounded-full px-4 py-1.5 text-sm font-medium transition-all hover:opacity-80"
                          style={{ border: `1.5px solid ${BORDER}`, color: DARK, backgroundColor: "white" }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-widest" style={{ color: GRAY }}>
                      Calories per adult per day (kcal)
                    </label>
                    <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3" style={{ border: `1.5px solid ${BORDER}` }}>
                      <input
                        type="number" min={800} max={5000} step={50} value={calorieTarget}
                        onChange={(e) => setCalorieTarget(Number(e.target.value))}
                        className="flex-1 bg-transparent text-sm outline-none" style={{ color: DARK }}
                      />
                      <span className="text-xs font-medium" style={{ color: GRAY }}>kcal</span>
                    </div>
                  </div>

                  <div>
                    <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: GRAY }}>Macro split</p>
                    <div className="space-y-5">
                      <MacroSlider label="Protein" value={macroProtein} onChange={handleProteinChange} max={80 - macroCarbs} color="#4A7C6F" />
                      <MacroSlider label="Carbs" value={macroCarbs} onChange={handleCarbsChange} max={80 - macroProtein} color="#5B8DB8" />
                      <MacroSlider label="Fat (auto-calculated)" value={macroFat} readOnly color="#9CA3AF" />
                    </div>
                    <div className="mt-5 overflow-hidden rounded-full h-3 flex" style={{ backgroundColor: MUTED_BG }}>
                      <div style={{ width: `${macroProtein}%`, backgroundColor: "#4A7C6F" }} />
                      <div style={{ width: `${macroCarbs}%`, backgroundColor: "#5B8DB8" }} />
                      <div style={{ width: `${macroFat}%`, backgroundColor: "#D1D5DB" }} />
                    </div>
                    <div className="mt-2 flex gap-4 text-xs" style={{ color: GRAY }}>
                      <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#4A7C6F" }} />Protein {macroProtein}%</span>
                      <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#5B8DB8" }} />Carbs {macroCarbs}%</span>
                      <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#D1D5DB" }} />Fat {macroFat}%</span>
                    </div>
                  </div>

                  <div className="rounded-xl px-4 py-3" style={{ backgroundColor: ACCENT }}>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: SAGE }}>At {calorieTarget} kcal / day</p>
                    <div className="flex gap-6 text-sm" style={{ color: DARK }}>
                      <span><b>{Math.round((calorieTarget * macroProtein) / 100 / 4)}g</b> protein</span>
                      <span><b>{Math.round((calorieTarget * macroCarbs)   / 100 / 4)}g</b> carbs</span>
                      <span><b>{Math.round((calorieTarget * macroFat)     / 100 / 9)}g</b> fat</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="h-px" style={{ backgroundColor: BORDER }} />

          {/* ── Billing ── */}
          <section>
            <SectionHeading title="Billing & Plan" description="Your current subscription details." />
            <div className="rounded-2xl bg-white p-6 space-y-5" style={{ border: `1px solid ${BORDER}` }}>

              {/* Plan badge row */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: GRAY }}>Current plan</p>
                  <p className="text-base font-bold" style={{ color: DARK }}>{PLAN_LABELS[planType] ?? planType}</p>
                </div>
                {isPaid ? (
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ backgroundColor: ACCENT, color: SAGE }}
                  >
                    Active ✓
                  </span>
                ) : (
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ backgroundColor: MUTED_BG, color: GRAY }}
                  >
                    Free
                  </span>
                )}
              </div>

              {/* Generations row */}
              {isPaid && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: GRAY }}>
                    Generations this week
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: MUTED_BG }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${limit > 0 ? Math.min((actualUsed / limit) * 100, 100) : 0}%`,
                          backgroundColor: remaining === 0 ? "#D97706" : SAGE,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold tabular-nums" style={{ color: remaining === 0 ? "#D97706" : DARK }}>
                      {actualUsed} of {limit}
                    </span>
                  </div>
                  {remaining === 0 && (
                    <p className="mt-1.5 text-xs" style={{ color: "#B45309" }}>Resets every Monday at midnight NZ time.</p>
                  )}
                </div>
              )}

              {/* Action */}
              <div className="pt-1">
                {!isPaid && (
                  <Link href="/#pricing">
                    <button
                      className="rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                      style={{ backgroundColor: SAGE }}
                    >
                      Upgrade plan →
                    </button>
                  </Link>
                )}
                {isFamily && (
                  <button
                    onClick={handlePortal}
                    disabled={portalLoading}
                    className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-60"
                    style={{ border: `1.5px solid ${SAGE}`, color: SAGE }}
                  >
                    <ExternalLink className="h-4 w-4" />
                    {portalLoading ? "Opening…" : "Manage subscription"}
                  </button>
                )}
                {isLifetime && (
                  <p className="text-sm font-semibold" style={{ color: SAGE }}>
                    Lifetime access ✓ — no subscription needed.
                  </p>
                )}
              </div>
            </div>
          </section>

          <div className="h-px" style={{ backgroundColor: BORDER }} />

          {/* ── Invite Family Members ── */}
          <section>
            <SectionHeading
              title="Invite Family Members"
              description="Invite someone to view your meal plan and tick off grocery items."
            />
            <div className="space-y-3">

              {/* Email input + button */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <div
                  className="flex flex-1 items-center gap-2 rounded-2xl bg-white px-4 py-3"
                  style={{ border: `1.5px solid ${BORDER}` }}
                >
                  <Mail className="h-4 w-4 shrink-0" style={{ color: GRAY }} />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
                    placeholder="family@example.com"
                    className="flex-1 bg-transparent text-sm outline-none"
                    style={{ color: DARK }}
                  />
                </div>
                <button
                  onClick={handleSendInvite}
                  disabled={inviteSending || !inviteEmail.trim()}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50 sm:w-auto sm:shrink-0"
                  style={{ backgroundColor: SAGE }}
                >
                  <UserPlus className="h-4 w-4" />
                  {inviteSending ? "Sending…" : "Invite"}
                </button>
              </div>

              {inviteSuccess && (
                <p className="text-sm font-medium" style={{ color: SAGE }}>Invite sent!</p>
              )}
              {inviteError && (
                <p className="text-sm" style={{ color: "#B91C1C" }}>{inviteError}</p>
              )}

              {/* Pending invites list */}
              {invites.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: GRAY }}>
                    Pending invites
                  </p>
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between rounded-2xl bg-white px-4 py-3"
                      style={{ border: `1px solid ${BORDER}` }}
                    >
                      <div>
                        <p className="text-sm font-medium" style={{ color: DARK }}>{invite.email}</p>
                        <p className="text-xs" style={{ color: GRAY }}>
                          Sent {new Date(invite.created_at).toLocaleDateString("en-NZ", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancelInvite(invite.id)}
                        className="rounded-full p-1.5 transition-colors"
                        style={{ color: GRAY }}
                        title="Cancel invite"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Save button */}
        <div className="mt-10 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-white transition-all disabled:opacity-60"
            style={{ backgroundColor: SAGE }}
          >
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
          </button>
          {saved && (
            <span className="text-sm" style={{ color: SAGE }}>Your preferences have been updated.</span>
          )}
        </div>
      </main>
    </div>
  )
}
