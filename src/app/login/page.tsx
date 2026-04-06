"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const SAGE   = "#4A7C6F"
const BG     = "#F5F3EE"
const BORDER = "#DDD9D1"
const DARK   = "#1C2B27"
const GRAY   = "#6B7B77"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

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
          <h1 className="mb-1 text-2xl font-bold" style={{ color: DARK }}>Welcome back</h1>
          <p className="mb-6 text-sm" style={{ color: GRAY }}>Sign in to your account to continue.</p>

          <form onSubmit={handleLogin} className="space-y-4">
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
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: GRAY }}>
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs" style={{ color: SAGE }}>
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {loading ? "Signing in…" : "Sign in →"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: GRAY }}>
          Don&rsquo;t have an account?{" "}
          <Link href="/signup" className="font-semibold" style={{ color: SAGE }}>
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}
