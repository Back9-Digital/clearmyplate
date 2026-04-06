import Link from "next/link"
import { ArrowLeft, Heart } from "lucide-react"

const SAGE    = "#4A7C6F"
const BG      = "#F5F3EE"
const BORDER  = "#DDD9D1"
const DARK    = "#1C2B27"
const GRAY    = "#6B7B77"
const ACCENT  = "#D4E8E2" // used for empty-state icon background

export default function FavouritesPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>

      {/* Nav */}
      <header className="border-b bg-white" style={{ borderColor: BORDER }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <button className="flex items-center gap-1.5 text-sm" style={{ color: GRAY }}>
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </button>
            </Link>
            <span style={{ color: BORDER }}>/</span>
            <span className="text-sm font-medium" style={{ color: DARK }}>Favourite Meals</span>
          </div>
          <span className="text-base font-semibold" style={{ color: SAGE }}>ClearMyPlate</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: DARK }}>Favourite Meals</h1>
          <p className="mt-1 text-sm" style={{ color: GRAY }}>
            Saved meals appear here and come up more often in your weekly plans.
          </p>
        </div>

        {/* Empty state */}
        <div
          className="flex flex-col items-center justify-center rounded-2xl bg-white px-8 py-20 text-center"
          style={{ border: `1px solid ${BORDER}` }}
        >
          <div
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: ACCENT }}
          >
            <Heart className="h-7 w-7" style={{ color: SAGE }} />
          </div>
          <h2 className="mb-2 text-lg font-semibold" style={{ color: DARK }}>
            No favourites yet.
          </h2>
          <p className="max-w-xs text-sm leading-relaxed" style={{ color: GRAY }}>
            Tap the heart icon on meals in your weekly plan to save them here.
          </p>
          <Link href="/dashboard/plan">
            <button
              className="mt-8 rounded-full px-6 py-2.5 text-sm font-medium text-white transition-all"
              style={{ backgroundColor: SAGE }}
            >
              Go to this week&rsquo;s plan →
            </button>
          </Link>
        </div>
      </main>
    </div>
  )
}
