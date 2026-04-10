"use client"

import { useEffect } from "react"

const SESSION_KEY = "ghl-tags-synced"

export function GhlTagSync({ email }: { email: string }) {
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return
    sessionStorage.setItem(SESSION_KEY, "1")

    fetch("/api/ghl/sync-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {/* fire and forget */})
  }, [email])

  return null
}
