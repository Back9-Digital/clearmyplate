const CACHE_NAME = "clearmyplate-v2"

const PRECACHE_URLS = [
  "/images/Clear My Plate Logo Horizontal Lockup.svg",
  "/images/icon-192.png",
  "/images/icon-512.png",
]

// ── Install: precache key assets ──────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// ── Activate: remove old caches ───────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch: network-first with cache fallback ──────────────────────────────────
self.addEventListener("fetch", (event) => {
  // Only handle GET requests for same-origin or precached assets
  if (event.request.method !== "GET") return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  // API routes: network-only, no caching
  if (url.pathname.startsWith("/api/")) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for static assets
        if (response.ok && (url.pathname.startsWith("/images/") || url.pathname.startsWith("/_next/static/"))) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})

// ── Push: receive and display notification ────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "ClearMyPlate", body: "You have a new update.", url: "/dashboard" }

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch {
      data.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/images/icon-192.png",
      badge: "/images/icon-192.png",
      data: { url: data.url },
      vibrate: [100, 50, 100],
    })
  )
})

// ── Notification click: open or focus the target URL ─────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url ?? "/dashboard"

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(targetUrl) && "focus" in c)
        if (existing) return existing.focus()
        return self.clients.openWindow(targetUrl)
      })
  )
})
