"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Minus, Check, Save } from "lucide-react"

const SAGE     = "#4A7C6F"
const BG       = "#F5F3EE"
const MUTED_BG = "#EAE8E3"
const BORDER   = "#DDD9D1"
const DARK     = "#1C2B27"
const GRAY     = "#6B7B77"

const foodPills = ["Chicken", "Fish", "Beef", "Pork", "Lamb", "Vegetarian", "Rice", "Pasta", "Potatoes", "Bread"]

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

export default function SettingsPage() {
  // Household
  const [adults, setAdults] = useState(2)
  const [kids, setKids] = useState(1)
  const [mealsTogether, setMealsTogether] = useState(true)
  const [timezone, setTimezone] = useState("Pacific/Auckland")

  // Goal & budget
  const [goal, setGoal] = useState<"maintain" | "build_muscle" | "lose_weight">("maintain")
  const [budget, setBudget] = useState(200)

  // Food preferences
  const [willEat, setWillEat] = useState<string[]>(["Chicken", "Fish", "Beef", "Pasta", "Potatoes"])
  const [wontEat, setWontEat] = useState("")

  // Week preferences
  const [useLeftovers, setUseLeftovers] = useState(true)
  const [vegetarianNight, setVegetarianNight] = useState(false)
  const [keepSimple, setKeepSimple] = useState(true)

  const [saved, setSaved] = useState(false)

  const toggleWillEat = (item: string) =>
    setWillEat((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    )

  const handleSave = () => {
    // TODO: persist to Supabase (household_profiles + preferences upsert)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

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
            <span style={{ color: BORDER }}>/</span>
            <span className="text-sm font-medium" style={{ color: DARK }}>Settings</span>
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
                <Counter value={adults} onChange={setAdults} min={1} />
              </Row>
              <Row label="Kids">
                <Counter value={kids} onChange={setKids} />
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

          {/* Divider */}
          <div className="h-px" style={{ backgroundColor: BORDER }} />

          {/* ── Goal & Budget ── */}
          <section>
            <SectionHeading title="Goal & Budget" description="Shapes the types of meals we suggest." />
            <div className="space-y-3">
              {/* Goal radio rows */}
              <div className="overflow-hidden rounded-2xl bg-white" style={{ border: `1px solid ${BORDER}` }}>
                {(
                  [
                    { value: "maintain",      label: "Maintain",      dot: "#9CA3AF" },
                    { value: "build_muscle",  label: "Build muscle",  dot: SAGE },
                    { value: "lose_weight",   label: "Lose weight",   dot: "#5B8DB8" },
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
                    {goal === opt.value && (
                      <Check className="ml-auto h-3.5 w-3.5" style={{ color: SAGE }} />
                    )}
                  </button>
                ))}
              </div>

              {/* Budget */}
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

          {/* Divider */}
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
                Won&rsquo;t eat (allergies, dislikes)
              </label>
              <textarea
                className="w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm outline-none"
                style={{ border: `1.5px solid ${BORDER}`, color: DARK, minHeight: 72 }}
                placeholder="e.g. shellfish, blue cheese, mushrooms…"
                value={wontEat}
                onChange={(e) => setWontEat(e.target.value)}
              />
            </div>
          </section>

          {/* Divider */}
          <div className="h-px" style={{ backgroundColor: BORDER }} />

          {/* ── Week Preferences ── */}
          <section>
            <SectionHeading title="Week Preferences" description="Fine-tune how we build your weekly plan." />
            <div className="space-y-3">
              <Row
                label="Use leftovers"
                description="Plan one meal around leftovers from the night before."
              >
                <Toggle checked={useLeftovers} onChange={setUseLeftovers} />
              </Row>
              <Row
                label="Include one vegetarian dinner"
                description="Great for variety and keeping costs down."
              >
                <Toggle checked={vegetarianNight} onChange={setVegetarianNight} />
              </Row>
              <Row
                label="Keep meals simple"
                description="Prefer quick, easy recipes with fewer steps."
              >
                <Toggle checked={keepSimple} onChange={setKeepSimple} />
              </Row>
            </div>
          </section>
        </div>

        {/* Save button */}
        <div className="mt-10 flex items-center gap-4">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-white transition-all"
            style={{ backgroundColor: SAGE }}
          >
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Saved!" : "Save changes"}
          </button>
          {saved && (
            <span className="text-sm" style={{ color: SAGE }}>
              Your preferences have been updated.
            </span>
          )}
        </div>
      </main>
    </div>
  )
}
