import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

// Handles the PKCE code exchange for Supabase auth flows (password reset, magic links, etc.)
// Supabase redirects here with ?code=... after verifying the OTP/token server-side.
// We exchange the code for a session, then redirect the user to their destination.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    // Build the redirect response first so we can write cookies onto it
    const response = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return response
  }

  // Code missing or exchange failed — send back to forgot-password with a clear error
  return NextResponse.redirect(`${origin}/forgot-password?error=link_expired`)
}
