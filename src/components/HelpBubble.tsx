"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import {
  HelpCircle, X, MessageCircle, Sparkles, Lightbulb,
  ChevronRight, ThumbsUp, ThumbsDown,
} from "lucide-react"

const SAGE     = "#4A7C6F"
const MUTED_BG = "#EAE8E3"
const DARK     = "#1C2B27"
const GRAY     = "#6B7B77"
const BORDER   = "#DDD9D1"

type ModalType = "contact" | "coming" | "suggest" | null

const FEATURES = [
  { slug: "kids-lunch",        label: "Kids School Lunch Planner",   description: "Plan school lunches for your kids alongside dinners" },
  { slug: "grocery-prices",    label: "Grocery Price Tracking",       description: "See estimated costs from Pak'nSave & Countdown" },
  { slug: "meal-prep-day",     label: "Weekly Meal Prep Plan",        description: "A Sunday prep guide to batch cook and save time on weeknights" },
  { slug: "per-member-macros", label: "Per-Member Calorie Targets",   description: "Set individual calorie and macro goals for each family member" },
  { slug: "meal-history",      label: "Meal History & Favourites",    description: "Browse past meals and quickly re-add favourites to your plan" },
  { slug: "shopping-export",   label: "Export Shopping List",         description: "Download or email your grocery list as a PDF" },
  { slug: "referral-program",  label: "Referral Program",             description: "Earn rewards for referring friends to ClearMyPlate" },
  { slug: "grocery-day",       label: "Custom Grocery Day",           description: "Set your shopping day so your plan resets at the right time" },
]

export type HelpBubbleHandle = { open: () => void }

// ── Shared modal shell ───────────────────────────────────────
function ModalShell({
  title, subtitle, onClose, children,
}: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/40" onClick={onClose} />

      {/* Sheet — full-screen bottom sheet on mobile, centered card on sm+ */}
      <div
        className="fixed inset-x-0 bottom-0 z-[61] flex max-h-[90vh] flex-col overflow-hidden rounded-t-3xl bg-white sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
        style={{ boxShadow: "0 -4px 32px rgba(0,0,0,0.14)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile only) */}
        <div className="flex shrink-0 justify-center pb-1 pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full" style={{ backgroundColor: BORDER }} />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-start justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="min-w-0 flex-1 pr-3">
            <h2 className="text-lg font-bold leading-snug" style={{ color: DARK }}>{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm" style={{ color: GRAY }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-2 transition-colors"
            style={{ backgroundColor: MUTED_BG }}
          >
            <X className="h-4 w-4" style={{ color: GRAY }} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  )
}

// ── Amplify form script — idempotent loader ──────────────────
function useAmplifyScript() {
  useEffect(() => {
    const src = "https://leads-api.back9.co.nz/js/form_embed.js"
    if (document.querySelector(`script[src="${src}"]`)) return
    const script = document.createElement("script")
    script.src  = src
    script.async = true
    document.body.appendChild(script)
  }, [])
}

// ── Modal 1: Contact Us ──────────────────────────────────────
function ContactModal({ onClose }: { onClose: () => void }) {
  useAmplifyScript()
  return (
    <ModalShell title="Contact Us" onClose={onClose}>
      <div className="p-4">
        <iframe
          src="https://leads-api.back9.co.nz/widget/form/IY66rvBhv8FizrJfD3nU"
          style={{ width: "100%", height: 614, border: "none", borderRadius: 3 }}
          id="inline-IY66rvBhv8FizrJfD3nU"
          data-layout="{'id':'INLINE'}"
          data-trigger-type="alwaysShow"
          data-trigger-value=""
          data-activation-type="alwaysActivated"
          data-activation-value=""
          data-deactivation-type="neverDeactivate"
          data-deactivation-value=""
          data-form-name="CMP_Contact-Form"
          data-height="614"
          data-layout-iframe-id="inline-IY66rvBhv8FizrJfD3nU"
          data-form-id="IY66rvBhv8FizrJfD3nU"
          title="CMP_Contact-Form"
        />
      </div>
    </ModalShell>
  )
}

// ── Modal 2: What's Coming ───────────────────────────────────
function ComingModal({
  onClose, aggregates, userReactions, loading, onReaction,
}: {
  onClose: () => void
  aggregates: Record<string, { up: number; down: number }>
  userReactions: Record<string, "up" | "down">
  loading: boolean
  onReaction: (slug: string, reaction: "up" | "down") => void
}) {
  return (
    <ModalShell title="What's Coming" subtitle="Vote on features you'd love to see next." onClose={onClose}>
      <div className="space-y-3 p-4 pb-8">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl" style={{ backgroundColor: MUTED_BG }} />
            ))
          : FEATURES.map((feature) => {
              const counts   = aggregates[feature.slug] ?? { up: 0, down: 0 }
              const userVote = userReactions[feature.slug]
              return (
                <div key={feature.slug} className="rounded-2xl bg-white p-4" style={{ border: `1px solid ${BORDER}` }}>
                  <p className="text-sm font-semibold" style={{ color: DARK }}>{feature.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed" style={{ color: GRAY }}>{feature.description}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => onReaction(feature.slug, "up")}
                      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                      style={
                        userVote === "up"
                          ? { backgroundColor: SAGE, color: "white" }
                          : { border: `1.5px solid ${BORDER}`, color: GRAY }
                      }
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {counts.up}
                    </button>
                    <button
                      onClick={() => onReaction(feature.slug, "down")}
                      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                      style={
                        userVote === "down"
                          ? { backgroundColor: "#DC2626", color: "white" }
                          : { border: `1.5px solid ${BORDER}`, color: GRAY }
                      }
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                      {counts.down}
                    </button>
                  </div>
                </div>
              )
            })}
      </div>
    </ModalShell>
  )
}

// ── Modal 3: Suggest a Feature ───────────────────────────────
function SuggestModal({ onClose }: { onClose: () => void }) {
  useAmplifyScript()
  return (
    <ModalShell
      title="Suggest a Feature"
      subtitle="Got an idea we haven't thought of? We'd love to hear it."
      onClose={onClose}
    >
      <div className="p-4">
        <iframe
          src="https://leads-api.back9.co.nz/widget/form/emePNo74pPWU893JtmYl"
          style={{ width: "100%", height: 590, border: "none", borderRadius: 3 }}
          id="inline-emePNo74pPWU893JtmYl"
          data-layout="{'id':'INLINE'}"
          data-trigger-type="alwaysShow"
          data-trigger-value=""
          data-activation-type="alwaysActivated"
          data-activation-value=""
          data-deactivation-type="neverDeactivate"
          data-deactivation-value=""
          data-form-name="CMP_Suggest-a-feature-Form"
          data-height="590"
          data-layout-iframe-id="inline-emePNo74pPWU893JtmYl"
          data-form-id="emePNo74pPWU893JtmYl"
          title="CMP_Suggest-a-feature-Form"
        />
      </div>
    </ModalShell>
  )
}

// ── HelpBubble (main export) ─────────────────────────────────
export const HelpBubble = forwardRef<HelpBubbleHandle>(function HelpBubble(_, ref) {
  const [isOpen, setIsOpen]               = useState(false)
  const [activeModal, setActiveModal]     = useState<ModalType>(null)
  const [aggregates, setAggregates]       = useState<Record<string, { up: number; down: number }>>({})
  const [userReactions, setUserReactions] = useState<Record<string, "up" | "down">>({})
  const [reactionsLoading, setReactionsLoading] = useState(false)

  useImperativeHandle(ref, () => ({ open: () => setIsOpen(true) }))

  const openModal = (modal: ModalType) => {
    setIsOpen(false)
    setActiveModal(modal)
  }

  // Load reactions when "coming" modal opens
  useEffect(() => {
    if (activeModal !== "coming") return
    setReactionsLoading(true)
    fetch("/api/features/reactions")
      .then((r) => r.json())
      .then(({ aggregates: agg, userReactions: ur }) => {
        setAggregates(agg ?? {})
        setUserReactions(ur ?? {})
      })
      .catch(() => {})
      .finally(() => setReactionsLoading(false))
  }, [activeModal])

  const handleReaction = async (slug: string, reaction: "up" | "down") => {
    const current     = userReactions[slug]
    const isToggleOff = current === reaction

    // Optimistic update
    setUserReactions((prev) => {
      const next = { ...prev }
      if (isToggleOff) delete next[slug]
      else next[slug] = reaction
      return next
    })
    setAggregates((prev) => {
      const c    = prev[slug] ?? { up: 0, down: 0 }
      const next = { ...c }
      if (isToggleOff) {
        next[reaction] = Math.max(0, next[reaction] - 1)
      } else {
        if (current) next[current] = Math.max(0, next[current] - 1)
        next[reaction] += 1
      }
      return { ...prev, [slug]: next }
    })

    await fetch("/api/features/reactions", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ slug, reaction: isToggleOff ? null : reaction }),
    })
  }

  return (
    <>
      {/* Popup backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* Popup menu */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 z-50 w-72 overflow-hidden rounded-2xl bg-white shadow-xl sm:right-6"
          style={{ border: `1px solid ${BORDER}` }}
        >
          {(
            [
              { icon: MessageCircle, label: "Contact Us",        modal: "contact"  as ModalType },
              { icon: Sparkles,      label: "What's Coming",     modal: "coming"   as ModalType },
              { icon: Lightbulb,     label: "Suggest a Feature", modal: "suggest"  as ModalType },
            ] as const
          ).map(({ icon: Icon, label, modal }, i, arr) => (
            <button
              key={modal}
              onClick={() => openModal(modal)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50"
              style={i < arr.length - 1 ? { borderBottom: `1px solid ${BORDER}` } : {}}
            >
              <Icon className="h-5 w-5 shrink-0" style={{ color: SAGE }} />
              <span className="flex-1 text-sm font-medium" style={{ color: DARK }}>{label}</span>
              <ChevronRight className="h-4 w-4 shrink-0" style={{ color: GRAY }} />
            </button>
          ))}
        </div>
      )}

      {/* Bubble button */}
      <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95"
          style={{ backgroundColor: SAGE }}
          aria-label={isOpen ? "Close help menu" : "Help"}
        >
          {isOpen
            ? <X className="h-6 w-6 text-white" />
            : <HelpCircle className="h-6 w-6 text-white" />
          }
        </button>
      </div>

      {/* Modals */}
      {activeModal === "contact" && <ContactModal onClose={() => setActiveModal(null)} />}
      {activeModal === "coming"  && (
        <ComingModal
          onClose={() => setActiveModal(null)}
          aggregates={aggregates}
          userReactions={userReactions}
          loading={reactionsLoading}
          onReaction={handleReaction}
        />
      )}
      {activeModal === "suggest" && <SuggestModal onClose={() => setActiveModal(null)} />}
    </>
  )
})
