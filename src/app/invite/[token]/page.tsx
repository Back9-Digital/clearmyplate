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

export function ErrorCard({ title, body }: { title: string; body: string }) {
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

  // Only check auth here — all invite validation happens in /api/invite/accept
  // (admin client only works reliably in API routes, not server components)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/signup?invite=${token}`)
  }

  return <AcceptInvite token={token} />
}
