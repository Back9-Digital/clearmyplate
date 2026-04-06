"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Minus, Check, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const SAGE     = "#4A7C6F"
const BG       = "#F5F3EE"
const MUTED_BG = "#EAE8E3"
const BORDER   = "#DDD9D1"
const DARK     = "#1C2B27"
const GRAY     = "#6B7B77"
const ACCENT   = "#D4E8E2"

const foodPills = ["Chicken", "Fish", "Beef", "Pork", "Lamb", "Vegetarian", "Rice", "Pasta", "Potatoes", "Bread"]

const MACRO_PRESETS = [
  { label: "Muscle Building", calories: 2400, protein: 40, carbs: 35, fat: 25 },
  { label: "Fat Loss",        calories: 1800, protein: 35, carbs: 35, fat: 30 },
  { label: "Balanced",        calories: 2000, protein: 25, carbs: 50, fat: 25 },
]

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
  label,
  value,
  onChange,
  max,
  color = SAGE,
  readOnly = false,
}: {
  label: string
  value: number
  onChange?: (v: number) => void
  max?: number
  color?: string
  readOnly?: boolean
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: DARK }}>{label}</span>
        <span className="text-sm font-semibold tabular-nums" style={{ color }}>{value}%</span>
      </div>
      {readOnly ? (
        <div className="relative h-2 overflow-hidden rounded-full" style={{ backgroundColor: MUTED_BG }}>
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${value}%`, backgroundColor: color, opacity: 0.5 }}
          />
        </div>
      ) : (
        <input
          type="range"
          min={10}
          max={max ?? 80}
          value={value}
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

  // Goal & budget
  const [goal, setGoal]     = useState<"maintain" | "build_muscle" | "lose_weight">("maintain")
  const [budget, setBudget] = useState(200)

  // Food preferences
  const [willEat, setWillEat] = useState<string[]>(["Chicken", "Fish", "Beef", "Pasta", "Potatoes"])
  const [wontEat, setWontEat] = useState("")

  // Week preferences
  const [useLeftovers, setUseLeftovers]       = useState(true)
  const [vegetarianNight, setVegetarianNight] = useState(false)
  const [keepSimple, setKeepSimple]           = useState(true)

  // Advanced — calorie & macro targets
  const [advancedEnabled, setAdvancedEnabled] = useState(false)
  const [calorieTarget, setCalorieTarget]     = useState(2000)
  const [macroProtein, setMacroProtein]       = useState(25)
  const [macroCarbs, setMacroCarbs]           = useState(50)
  // Fat is derived: 100 - protein - carbs
  const macroFat = Math.max(0, 100 - macroProtein - macroCarbs)

  const [saved, setSaved]     = useState(false)
  const [saving, setSaving]   = useState(false)
  const [loading, setLoading] = useState(true)

  // Load profile on mount
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from("profiles")
        .select("calorie_target, macro_protein, macro_carbs, macro_fat")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.calorie_target != null) {
            setAdvancedEnabled(true)
            setCalorieTarget(data.calorie_target)
            setMacroProtein(data.macro_protein ?? 25)
            setMacroCarbs(data.macro_carbs ?? 50)
          }
          setLoading(false)
        })
    })
  }, [])

  const applyPreset = (preset: typeof MACRO_PRESETS[number]) => {
    setCalorieTarget(preset.calories)
    setMacroProtein(preset.protein)
    setMacroCarbs(preset.carbs)
    // fat is auto-derived
  }

  const handleProteinChange = (v: number) => {
    const clamped = Math.min(v, 80 - macroCarbs) // ensure fat >= 10
    setMacroProtein(Math.max(10, clamped))
  }

  const handleCarbsChange = (v: number) => {
    const clamped = Math.min(v, 80 - macroProtein) // ensure fat >= 10
    setMacroCarbs(Math.max(10, clamped))
  }

  const toggleWillEat = (item: string) =>
    setWillEat((prev) => prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item])

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from("profiles")
        .update({
          calorie_target: advancedEnabled ? calorieTarget  : null,
          macro_protein:  advancedEnabled ? macroProtein   : null,
          macro_carbs:    advancedEnabled ? macroCarbs     : null,
          macro_fat:      advancedEnabled ? macroFat       : null,
        })
        .eq("id", user.id)

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
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

          <div className="h-px" style={{ backgroundColor: BORDER }} />

          {/* ── Week Preferences ── */}
          <section>
            <SectionHeading title="Week Preferences" description="Fine-tune how we build your weekly plan." />
            <div className="space-y-3">
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
                <div
                  className="rounded-2xl bg-white p-6 space-y-7"
                  style={{ border: `1px solid ${BORDER}` }}
                >
                  {/* Presets */}
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: GRAY }}>
                      Presets
                    </p>
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

                  {/* Calorie target */}
                  <div>
                    <label
                      className="mb-2 block text-xs font-semibold uppercase tracking-widest"
                      style={{ color: GRAY }}
                    >
                      Calories per adult per day (kcal)
                    </label>
                    <div
                      className="flex items-center gap-2 rounded-xl bg-white px-4 py-3"
                      style={{ border: `1.5px solid ${BORDER}` }}
                    >
                      <input
                        type="number"
                        min={800}
                        max={5000}
                        step={50}
                        value={calorieTarget}
                        onChange={(e) => setCalorieTarget(Number(e.target.value))}
                        className="flex-1 bg-transparent text-sm outline-none"
                        style={{ color: DARK }}
                      />
                      <span className="text-xs font-medium" style={{ color: GRAY }}>kcal</span>
                    </div>
                  </div>

                  {/* Macro split */}
                  <div>
                    <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: GRAY }}>
                      Macro split
                    </p>
                    <div className="space-y-5">
                      <MacroSlider
                        label="Protein"
                        value={macroProtein}
                        onChange={handleProteinChange}
                        max={80 - macroCarbs}
                        color="#4A7C6F"
                      />
                      <MacroSlider
                        label="Carbs"
                        value={macroCarbs}
                        onChange={handleCarbsChange}
                        max={80 - macroProtein}
                        color="#5B8DB8"
                      />
                      <MacroSlider
                        label="Fat (auto-calculated)"
                        value={macroFat}
                        readOnly
                        color="#9CA3AF"
                      />
                    </div>

                    {/* Visual bar */}
                    <div className="mt-5 overflow-hidden rounded-full h-3 flex" style={{ backgroundColor: MUTED_BG }}>
                      <div style={{ width: `${macroProtein}%`, backgroundColor: "#4A7C6F" }} />
                      <div style={{ width: `${macroCarbs}%`, backgroundColor: "#5B8DB8" }} />
                      <div style={{ width: `${macroFat}%`, backgroundColor: "#D1D5DB" }} />
                    </div>
                    <div className="mt-2 flex gap-4 text-xs" style={{ color: GRAY }}>
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#4A7C6F" }} />
                        Protein {macroProtein}%
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#5B8DB8" }} />
                        Carbs {macroCarbs}%
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#D1D5DB" }} />
                        Fat {macroFat}%
                      </span>
                    </div>
                  </div>

                  {/* Estimated grams */}
                  <div className="rounded-xl px-4 py-3" style={{ backgroundColor: ACCENT }}>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: SAGE }}>
                      At {calorieTarget} kcal / day
                    </p>
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
