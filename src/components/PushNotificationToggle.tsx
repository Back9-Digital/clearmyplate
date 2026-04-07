"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff } from "lucide-react"

const SAGE   = "#4A7C6F"
const BORDER = "#DDD9D1"

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
  return output.buffer
}

export function PushNotificationToggle() {
  const [supported, setSupported]   = useState(false)
  const [enabled, setEnabled]       = useState(false)
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return
    setSupported(true)

    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setEnabled(!!sub)
      })
    })
  }, [])

  if (!supported) return null

  const handleToggle = async () => {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      if (enabled) {
        // Unsubscribe
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sub.toJSON()),
          })
          await sub.unsubscribe()
        }
        setEnabled(false)
      } else {
        // Request permission
        const permission = await Notification.requestPermission()
        if (permission !== "granted") {
          setLoading(false)
          return
        }

        // Subscribe
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        })

        setEnabled(true)
      }
    } catch (err) {
      console.error("[push toggle]", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
      style={{
        border: `1.5px solid ${enabled ? SAGE : BORDER}`,
        color: enabled ? SAGE : "#6B7B77",
        backgroundColor: enabled ? "#D4E8E2" : "transparent",
      }}
      title={enabled ? "Disable push notifications" : "Enable push notifications"}
    >
      {enabled ? (
        <><Bell className="h-4 w-4" /> Notifications on</>
      ) : (
        <><BellOff className="h-4 w-4" /> Enable notifications</>
      )}
    </button>
  )
}
