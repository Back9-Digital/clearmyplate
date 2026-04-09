"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/client"

const SAGE   = "#4A7C6F"
const BG     = "#F5F3EE"
const BORDER = "#DDD9D1"
const DARK   = "#1C2B27"
const GRAY   = "#6B7B77"

function ForgotPasswordInner() {
  const searchParams = useSearchParams()
  const linkExpired  = searchParams.get("error") === "link_expired"

  const [email, setEmail]     = useState("")
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(
    linkExpired ? "That reset link has expired or already been used. Enter your email to get a new one." : null
  )
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Route through /auth/callback so PKCE code exchange happens server-side
      redirectTo: "https://www.clearmyplate.app/auth/callback?next=/reset-password",
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: BG }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image src="/images/Clear My Plate Logo Horizontal Lockup.svg" alt="ClearMyPlate" width={192} height={48} className="h-12 w-auto" unoptimized priority />
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-white p-8" style={{ border: `1px solid ${BORDER}` }}>
          <h1 className="mb-1 text-2xl font-bold" style={{ color: DARK }}>Reset your password</h1>
          <p className="mb-6 text-sm" style={{ color: GRAY }}>
            Enter your email and we&rsquo;ll send you a reset link.
          </p>

          {sent ? (
            <div
              className="rounded-xl px-4 py-4 text-sm"
              style={{ backgroundColor: "#D4E8E2", color: DARK }}
            >
              <p className="font-semibold">Check your email for a reset link.</p>
              <p className="mt-1" style={{ color: GRAY }}>
                Didn&rsquo;t receive it? Check your spam folder or{" "}
                <button
                  className="font-semibold underline"
                  style={{ color: SAGE }}
                  onClick={() => setSent(false)}
                >
                  try again
                </button>
                .
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                {loading ? "Sending…" : "Send reset link →"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: GRAY }}>
          Remember your password?{" "}
          <Link href="/login" className="font-semibold" style={{ color: SAGE }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordInner />
    </Suspense>
  )
}
