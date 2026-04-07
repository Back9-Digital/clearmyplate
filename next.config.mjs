/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Prevent this site being embedded in iframes on other origins (clickjacking)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Only send full referrer to same origin; only origin to cross-origin HTTPS
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Enforce HTTPS for 2 years (only applies once deployed to HTTPS)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Disable browser features the app doesn't use
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Basic XSS protection for older browsers
  { key: "X-XSS-Protection", value: "1; mode=block" },
]

const nextConfig = {
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
