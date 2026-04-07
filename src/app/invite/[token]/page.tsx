import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AcceptInvite from "./AcceptInvite"

export const dynamic = "force-dynamic"

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
  const supabase = await createClient()

  // Look up invite with anon client — requires RLS policy:
  // CREATE POLICY "Anyone can view invite by token" ON household_invites FOR SELECT USING (true);
  const { data: invite, error: inviteError } = await supabase
    .from("household_invites")
    .select("id, email, accepted_at")
    .eq("token", token)
    .maybeSingle()

  if (inviteError) {
    console.error("[invite/page] invite lookup error:", inviteError.message)
    return <ErrorCard title="Something went wrong" body="Unable to load this invite. Please try again." />
  }

  if (!invite) {
    return <ErrorCard title="Invalid invite" body="This invite link is invalid or has expired." />
  }

  if (invite.accepted_at) {
    return <ErrorCard title="Already accepted" body="This invite has already been used." />
  }

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/signup?invite=${token}`)
  }

  // Email mismatch
  if (invite.email.toLowerCase() !== (user.email ?? "").toLowerCase()) {
    return (
      <ErrorCard
        title="Wrong account"
        body={`This invite was sent to ${invite.email}. Please sign in with that email address to accept it.`}
      />
    )
  }

  return <AcceptInvite token={token} />
}
