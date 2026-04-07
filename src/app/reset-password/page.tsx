"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const SAGE   = "#4A7C6F"
const BG     = "#F5F3EE"
const BORDER = "#DDD9D1"
const DARK   = "#1C2B27"
const GRAY   = "#6B7B77"

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password, setPassword]   = useState("")
  const [confirm, setConfirm]     = useState("")
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: BG }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <img
            src="/images/Clear My Plate Logo Horizontal Lockup.svg"
            alt="ClearMyPlate"
            style={{ height: 48 }}
          />
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-white p-8" style={{ border: `1px solid ${BORDER}` }}>
          <h1 className="mb-1 text-2xl font-bold" style={{ color: DARK }}>Choose a new password</h1>
          <p className="mb-6 text-sm" style={{ color: GRAY }}>
            Must be at least 8 characters.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest" style={{ color: GRAY }}>
                New password
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{ border: `1.5px solid ${BORDER}`, color: DARK, backgroundColor: "white" }}
                onFocus={(e) => (e.target.style.borderColor = SAGE)}
                onBlur={(e) => (e.target.style.borderColor = BORDER)}
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest" style={{ color: GRAY }}>
                Confirm password
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{ border: `1.5px solid ${BORDER}`, color: DARK, backgroundColor: "white" }}
                onFocus={(e) => (e.target.style.borderColor = SAGE)}
                onBlur={(e) => (e.target.style.borderColor = BORDER)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#FEE2E2", color: "#B91C1C" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ backgroundColor: SAGE }}
            >
              {loading ? "Saving…" : "Set new password →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
