"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const SAGE   = "#4A7C6F"
const BG     = "#F5F3EE"
const BORDER = "#DDD9D1"
const DARK   = "#1C2B27"
const GRAY   = "#6B7B77"

function SignupForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const infoMessage  = searchParams.get("message")

  const [firstName, setFirstName] = useState("")
  const [email, setEmail]         = useState("")
  const [password, setPassword]   = useState("")
  const [confirm, setConfirm]     = useState("")
  const [agreed, setAgreed]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!agreed) {
      setError("Please agree to the Terms of Service and Privacy Policy to continue.")
      return
    }

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

    // Fire-and-forget GHL contact creation — pass firstName directly to avoid race condition
    fetch("/api/ghl/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: firstName.trim() }),
    }).catch(() => {})

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

            {/* Terms agreement */}
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className="flex h-4 w-4 items-center justify-center rounded transition-colors"
                  style={{
                    backgroundColor: agreed ? SAGE : "white",
                    border: `1.5px solid ${agreed ? SAGE : BORDER}`,
                  }}
                >
                  {agreed && (
                    <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs leading-relaxed" style={{ color: GRAY }}>
                I agree to the{" "}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold"
                  style={{ color: SAGE }}
                >
                  Terms of Service
                </a>
                {" "}and{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold"
                  style={{ color: SAGE }}
                >
                  Privacy Policy
                </a>
              </span>
            </label>

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

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
