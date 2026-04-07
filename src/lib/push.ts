import webpush from "web-push"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type PushPayload = {
  title: string
  body: string
  url?: string
}

/**
 * Sends a push notification to all subscriptions for a given user_id.
 * Stale subscriptions (410 Gone) are automatically removed.
 * Never throws — errors are logged only.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const supabase = adminClient()

  const { data: rows, error } = await supabase
    .from("push_subscriptions")
    .select("id, subscription")
    .eq("user_id", userId)

  if (error || !rows?.length) return

  const message = JSON.stringify(payload)

  await Promise.allSettled(
    rows.map(async (row) => {
      try {
        await webpush.sendNotification(row.subscription, message)
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 410 || status === 404) {
          // Subscription expired — clean it up
          await supabase.from("push_subscriptions").delete().eq("id", row.id)
        } else {
          console.error("[push] sendNotification failed:", err)
        }
      }
    })
  )
}

/**
 * Sends a push notification to all subscriptions for a given email address.
 * Looks up the user_id from auth.users via the admin client.
 */
export async function sendPushToEmail(email: string, payload: PushPayload): Promise<void> {
  const supabase = adminClient()

  const { data } = await supabase.auth.admin.listUsers()
  const user = data?.users?.find((u) => u.email === email)
  if (!user) return

  await sendPushToUser(user.id, payload)
}
