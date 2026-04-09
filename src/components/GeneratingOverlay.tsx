"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

const SAGE  = "#4A7C6F"
const BG    = "#F5F3EE"
const ACCENT = "#D4E8E2"
const GRAY  = "#6B7B77"

const loadingMessages = [
  "Arguing with the AI about mushrooms...",
  "Hiding the vegetables in the sauce...",
  "Convincing the kids it's not leftovers...",
  "Negotiating with a fussy eater...",
  "Checking if cereal counts as dinner...",
  "Bribing the AI with extra cheese...",
  "Googling 'what even is capsicum'...",
  "Asking Nana for her secret recipe...",
  "Pretending the kumara is chips...",
  "Making sure there's enough for seconds...",
  "Hiding the healthy stuff in plain sight...",
  "Convincing Dad that salad IS a meal...",
  "Adding extra sauce to everything...",
  "Making sure Monday isn't fish again...",
  "Checking the budget won't blow out at Pak'nSave...",
]

// ~155ms × 97 steps ≈ 15 seconds to reach 97%
const TICK_MS   = 155
const MAX_PCT   = 97

export function GeneratingOverlay() {
  const [progress, setProgress]     = useState(0)
  const [msgIndex, setMsgIndex]     = useState(0)
  const [msgVisible, setMsgVisible] = useState(true)

  // Progress bar — increments every tick until capped
  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => (p < MAX_PCT ? p + 1 : p))
    }, TICK_MS)
    return () => clearInterval(id)
  }, [])

  // Rotating messages with 300ms fade-out / fade-in
  useEffect(() => {
    const id = setInterval(() => {
      setMsgVisible(false)
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % loadingMessages.length)
        setMsgVisible(true)
      }, 300)
    }, 2500)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-8"
      style={{ backgroundColor: BG }}
    >
      {/* Logo — gentle pulse */}
      <div
        className="mb-12"
        style={{ animation: "cmp-pulse 2s ease-in-out infinite" }}
      >
        <Image
          src="/images/Clear My Plate Logo Horizontal Lockup.svg"
          alt="ClearMyPlate"
          width={200}
          height={50}
          className="h-10 w-auto"
          unoptimized
          priority
        />
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs mb-6">
        <div
          className="h-2 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: ACCENT }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              backgroundColor: SAGE,
              transition: `width ${TICK_MS}ms linear`,
            }}
          />
        </div>
        <p className="mt-2 text-right text-xs tabular-nums" style={{ color: GRAY }}>
          {progress}%
        </p>
      </div>

      {/* Rotating message */}
      <p
        className="max-w-xs text-center text-sm font-medium"
        style={{
          color: SAGE,
          opacity: msgVisible ? 1 : 0,
          transition: "opacity 300ms ease",
          minHeight: "1.25rem",
        }}
      >
        {loadingMessages[msgIndex]}
      </p>

      <style>{`
        @keyframes cmp-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(0.97); }
        }
      `}</style>
    </div>
  )
}
