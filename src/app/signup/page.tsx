"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const SAGE   = "#4A7C6F"
const BG     = "#F5F3EE"
const BORDER = "#DDD9D1"
const DARK   = "#1C2B27"
const GRAY   = "#6B7B77"

export default function SignupPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const infoMessage  = searchParams.get("message")
  const [firstName, setFirstName] = useState("")
  const [email, setEmail]         = useState("")
  const [password, setPassword]   = useState("")
  const [confirm, setConfirm]     = useState("")
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/dashboard`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Save first name to profile (trigger already created the row)
    if (data.user && firstName.trim()) {
      await supabase
        .from("profiles")
        .update({ full_name: firstName.trim() })
        .eq("id", data.user.id)
    }

    // Fire-and-forget GHL contact creation — profile is updated above before this fires
    fetch("/api/ghl/signup", { method: "POST" }).catch(() => {})

    // If email confirmation is OFF in Supabase, the user is logged in immediately.
    // If it's ON, show a message instead of redirecting.
    router.push("/onboard")
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
          <h1 className="mb-1 text-2xl font-bold" style={{ color: DARK }}>Create your account</h1>
          <p className="mb-6 text-sm" style={{ color: GRAY }}>Start planning meals for your family, free.</p>

          {infoMessage && (
            <p className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#D4E8E2", color: "#1C2B27" }}>
              {infoMessage}
            </p>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest" style={{ color: GRAY }}>
                First name
              </label>
              <input
                type="text"
                required
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{ border: `1.5px solid ${BORDER}`, color: DARK, backgroundColor: "white" }}
                onFocus={(e) => (e.target.style.borderColor = SAGE)}
                onBlur={(e) => (e.target.style.borderColor = BORDER)}
                placeholder="Phil"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest" style={{ color: GRAY }}>
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{ border: `1.5px solid ${BORDER}`, color: DARK, backgroundColor: "white" }}
                onFocus={(e) => (e.target.style.borderColor = SAGE)}
                onBlur={(e) => (e.target.style.borderColor = BORDER)}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest" style={{ color: GRAY }}>
                Password
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
              {loading ? "Creating account…" : "Create account →"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: GRAY }}>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold" style={{ color: SAGE }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
