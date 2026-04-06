"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export function PaymentSuccessBanner() {
  const params  = useSearchParams()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (params.get("payment") === "success") {
      setShow(true)
      // Clean the URL without a full reload
      window.history.replaceState({}, "", "/dashboard")
    }
  }, [params])

  if (!show) return null

  return (
    <div
      className="mx-auto mb-6 max-w-6xl rounded-2xl px-5 py-4 text-center text-sm font-medium"
      style={{ backgroundColor: "#D4E8E2", color: "#1C2B27" }}
    >
      🎉 Welcome to ClearMyPlate! Your plan is active.
    </div>
  )
}
