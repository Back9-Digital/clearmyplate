"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const BG     = "#F5F3EE"
const DARK   = "#1C2B27"
const GRAY   = "#6B7B77"
const SAGE   = "#4A7C6F"
const ACCENT = "#D4E8E2"

export default function AcceptInvite({ token }: { token: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/invite/accept", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          router.push("/dashboard")
        } else {
          setError(data.error ?? "Failed to accept invite.")
        }
      })
      .catch(() => setError("Something went wrong. Please try again."))
  }, [token, router])

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: BG }}>
      <div className="w-full max-w-sm text-center">
        {error ? (
          <>
            <p className="text-xl font-bold mb-2" style={{ color: DARK }}>Couldn&rsquo;t accept invite</p>
            <p className="text-sm mb-6" style={{ color: GRAY }}>{error}</p>
            <Link href="/dashboard" className="text-sm font-semibold" style={{ color: SAGE }}>
              Go to dashboard →
            </Link>
          </>
        ) : (
          <>
            <div
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: ACCENT }}
            >
              <div
                className="h-6 w-6 animate-spin rounded-full border-2 border-transparent"
                style={{ borderTopColor: SAGE, borderRightColor: SAGE }}
              />
            </div>
            <p className="text-lg font-semibold" style={{ color: DARK }}>Joining your household…</p>
            <p className="mt-1 text-sm" style={{ color: GRAY }}>Just a moment.</p>
          </>
        )}
      </div>
    </div>
  )
}
