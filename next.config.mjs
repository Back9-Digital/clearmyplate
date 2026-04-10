/** @type {import('next').NextConfig} */

// Content-Security-Policy
// - script-src needs 'unsafe-inline' + 'unsafe-eval' for Next.js runtime chunks
// - connect-src allows Supabase REST + realtime websocket
// - frame-src 'none': app doesn't embed iframes (Stripe checkout is a redirect, not iframe)
// - object-src 'none': blocks Flash and other plugins
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://leads-api.back9.co.nz",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://leads-api.back9.co.nz",
  "font-src 'self' https://fonts.gstatic.com",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://leads-api.back9.co.nz`,
  "frame-src https://leads-api.back9.co.nz",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.supabase.co",
].join("; ")

const securityHeaders = [
  // Content-Security-Policy — primary XSS defence
  { key: "Content-Security-Policy", value: CSP },
  // Prevent this site being embedded in iframes on other origins (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Only send origin to cross-origin HTTPS, full referrer within same origin
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Enforce HTTPS for 2 years
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Disable browser features the app doesn't use
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
]

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.cdn.filesafe.space",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
