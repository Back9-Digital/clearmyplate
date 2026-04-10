import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET — aggregate reaction counts (all users) + current user's votes
export async function GET() {
  const admin = adminClient()

  // All reactions — used for global counts (bypasses RLS)
  const { data: allRows } = await admin
    .from("feature_reactions")
    .select("feature_slug, reaction, user_id")

  // Build aggregate counts
  const aggregates: Record<string, { up: number; down: number }> = {}
  for (const row of allRows ?? []) {
    if (!aggregates[row.feature_slug]) aggregates[row.feature_slug] = { up: 0, down: 0 }
    aggregates[row.feature_slug][row.reaction as "up" | "down"]++
  }

  // Current user's own reactions
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const userReactions: Record<string, "up" | "down"> = {}
  if (user) {
    for (const row of allRows ?? []) {
      if (row.user_id === user.id) {
        userReactions[row.feature_slug] = row.reaction as "up" | "down"
      }
    }
  }

  return NextResponse.json({ aggregates, userReactions })
}

// POST — upsert or remove a reaction
// Body: { slug: string; reaction: "up" | "down" | null }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const { slug, reaction } = await req.json()
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 })

  const admin = adminClient()

  if (!reaction) {
    // Toggle off — delete the row
    await admin
      .from("feature_reactions")
      .delete()
      .eq("user_id", user.id)
      .eq("feature_slug", slug)
  } else {
    // Upsert (handles changing from up→down etc.)
    await admin
      .from("feature_reactions")
      .upsert(
        { user_id: user.id, feature_slug: slug, reaction },
        { onConflict: "user_id,feature_slug" }
      )
  }

  return NextResponse.json({ ok: true })
}
