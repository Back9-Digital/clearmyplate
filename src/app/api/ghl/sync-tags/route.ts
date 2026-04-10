import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const GHL_API = "https://services.leadconnectorhq.com"
const GHL_VERSION = "2021-07-28"

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })

  const token = process.env.GHL_PRIVATE_TOKEN
  const locationId = process.env.GHL_LOCATION_ID

  if (!token || !locationId) {
    console.warn("[ghl] GHL_PRIVATE_TOKEN or GHL_LOCATION_ID not set — skipping")
    return NextResponse.json({ isBetaTester: false })
  }

  let isBetaTester = false

  try {
    const res = await fetch(
      `${GHL_API}/contacts/search?email=${encodeURIComponent(email)}&locationId=${encodeURIComponent(locationId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Version: GHL_VERSION,
        },
      }
    )

    if (res.ok) {
      const data = await res.json()
      const contact = data?.contacts?.[0]
      if (contact?.tags && Array.isArray(contact.tags)) {
        isBetaTester = contact.tags.includes("beta-tester")
      }
    } else {
      console.warn("[ghl] sync-tags search failed:", res.status)
    }
  } catch (err) {
    console.error("[ghl] sync-tags error:", err)
  }

  if (isBetaTester) {
    const admin = adminClient()
    await admin
      .from("profiles")
      .update({ is_beta_tester: true })
      .eq("id", user.id)
  }

  return NextResponse.json({ isBetaTester })
}
