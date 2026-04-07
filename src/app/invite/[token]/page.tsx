import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import AcceptInvite from "./AcceptInvite"

const BG     = "#F5F3EE"
const DARK   = "#1C2B27"
const GRAY   = "#6B7B77"
const SAGE   = "#4A7C6F"
const BORDER = "#DDD9D1"

function ErrorCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: BG }}>
      <div className="w-full max-w-sm text-center">
        <div className="rounded-3xl bg-white p-8" style={{ border: `1px solid ${BORDER}` }}>
          <p className="text-xl font-bold mb-2" style={{ color: DARK }}>{title}</p>
          <p className="text-sm mb-6" style={{ color: GRAY }}>{body}</p>
          <Link href="/" className="text-sm font-semibold" style={{ color: SAGE }}>
            Back to home →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // Validate invite first (admin — member doesn't own the row)
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: invite } = await admin
    .from("household_invites")
    .select("id, email, accepted_at")
    .eq("token", token)
    .single()

  if (!invite) {
    return <ErrorCard title="Invalid invite" body="This invite link is invalid or has expired." />
  }

  if (invite.accepted_at) {
    return <ErrorCard title="Already accepted" body="This invite has already been used." />
  }

  // Check auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Not logged in — send to signup, preserving the token
    redirect(`/signup?invite=${token}`)
  }

  // Email mismatch — show a clear message rather than letting the API reject it
  if (invite.email.toLowerCase() !== (user.email ?? "").toLowerCase()) {
    return (
      <ErrorCard
        title="Wrong account"
        body={`This invite was sent to ${invite.email}. Please sign in with that email address to accept it.`}
      />
    )
  }

  // All good — accept and redirect via client component
  return <AcceptInvite token={token} />
}
