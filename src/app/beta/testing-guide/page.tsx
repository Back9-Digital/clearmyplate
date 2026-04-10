export const dynamic = "force-dynamic"

import Link from "next/link"

const BG     = "#F5F3EE"
const SAGE   = "#4A7C6F"
const DARK   = "#1C2B27"
const GRAY   = "#6B7B77"
const BORDER = "#DDD9D1"

function Card({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-2xl bg-white p-6 shadow-sm" style={{ border: `1px solid ${BORDER}` }}>
      <div className="mb-3 flex items-center gap-2.5">
        <span className="text-2xl leading-none">{icon}</span>
        <h2 className="text-base font-semibold" style={{ color: DARK }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="mb-4 space-y-2 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: GRAY }}>
          <span
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
            style={{ backgroundColor: SAGE }}
          >
            {i + 1}
          </span>
          {item}
        </li>
      ))}
    </ol>
  )
}

function WatchFor({ items }: { items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: SAGE }}>
        What to watch for
      </p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed" style={{ color: GRAY }}>
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: SAGE }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm leading-relaxed" style={{ color: GRAY }}>
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: SAGE }} />
          {item}
        </li>
      ))}
    </ul>
  )
}

export default function BetaTestingGuidePage() {
  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: BG }}>
      <div className="mx-auto max-w-2xl px-4 pt-10 sm:px-6 sm:pt-14">

        {/* Header */}
        <div className="mb-10 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://assets.cdn.filesafe.space/2BecwcueTQNQ4jcrRUnS/media/69d6d65aebf1a608434ba0f3.png"
            alt="ClearMyPlate"
            style={{ width: 200 }}
            className="mx-auto mb-6"
          />
          <span
            className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: `${SAGE}18`, color: SAGE }}
          >
            🧪 Beta Tester Guide
          </span>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl" style={{ color: DARK }}>
            What to look for when testing
          </h1>
          <p className="mt-3 text-sm leading-relaxed sm:text-base" style={{ color: GRAY }}>
            You don&rsquo;t need to be technical. Just use it like a normal family and tell us what feels off. Here&rsquo;s where to focus.
          </p>
        </div>

        {/* Section 1: Getting Started */}
        <Card icon="🚀" title="Setting up your account">
          <Steps items={[
            "Sign up at clearmyplate.app/signup",
            "Complete the onboarding — take your time, it shapes your meal plan",
            "Add your real household size, food preferences and weekly budget",
            "Add the app to your home screen (we'll prompt you — it makes it feel like a real app)",
          ]} />
          <WatchFor items={[
            "Does anything in onboarding feel confusing or unclear?",
            "Are any options missing that matter to your family?",
          ]} />
        </Card>

        {/* Section 2: Generating Meal Plan */}
        <Card icon="🤖" title="Your first meal plan">
          <Steps items={[
            "Hit \"Generate my plan\" from the dashboard",
            "Read through the 7 dinners — do they feel like meals your family would actually eat?",
            "Try swapping a meal you don't like",
            "Try regenerating with a special instruction (e.g. \"make it cheaper\" or \"no pasta this week\")",
          ]} />
          <WatchFor items={[
            "Are the meals practical and realistic for a Kiwi family?",
            "Do the portion sizes make sense for your household?",
            "Does the AI follow your food preferences and avoid things you said you won't eat?",
            "Does swapping and regenerating work smoothly?",
          ]} />
        </Card>

        {/* Section 3: Grocery List */}
        <Card icon="🛒" title="Take it shopping">
          <Steps items={[
            "Open the grocery list before or during your shop",
            "Use it on your phone while you walk around the supermarket",
            "Tick items off as you go",
            "Add any extras your family needs using \"Your Extras\"",
          ]} />
          <WatchFor items={[
            "Is the list easy to use one-handed while pushing a trolley?",
            "Are items organised in a way that makes sense in the supermarket?",
            "Is anything missing that should be there?",
            "Does ticking items off feel satisfying and reliable?",
          ]} />
        </Card>

        {/* Section 4: Recipes */}
        <Card icon="👨‍🍳" title="Cook a meal from the app">
          <Steps items={[
            "Open a recipe and try cooking from it",
            "Use cooking mode — it highlights the current step",
            "Set a timer using the in-app timers",
          ]} />
          <WatchFor items={[
            "Are the instructions clear enough to follow while cooking?",
            "Are the ingredient amounts right for your family size?",
            "Does cooking mode feel useful or unnecessary?",
          ]} />
        </Card>

        {/* Section 5: Mobile */}
        <Card icon="📱" title="Mobile experience">
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: SAGE }}>
              What to check
            </p>
            <CheckList items={[
              "Add to home screen and open it like an app — does it feel native?",
              "Use it at the supermarket — is the text readable? Buttons big enough?",
              "Try it in landscape and portrait",
              "Check everything loads quickly on mobile data",
            ]} />
          </div>
          <WatchFor items={[
            "Anything that's hard to tap or read on a small screen",
            "Any pages that feel cramped or have things cut off",
          ]} />
        </Card>

        {/* Section 6: General Feel */}
        <Card icon="✨" title="Overall impression">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: SAGE }}>
            Questions to think about
          </p>
          <CheckList items={[
            "Would you actually use this every week?",
            "Would you recommend it to another NZ family?",
            "What's the one thing that would make it a no-brainer for you?",
            "What's the one thing that currently stops you from loving it?",
          ]} />
        </Card>

        {/* Feedback Section */}
        <div
          className="mb-4 rounded-2xl p-6"
          style={{ backgroundColor: `${SAGE}0f`, border: `1.5px solid ${SAGE}40` }}
        >
          <h2 className="mb-3 text-base font-semibold" style={{ color: DARK }}>
            How to send us feedback
          </h2>
          <ul className="space-y-2">
            {[
              "Use the Help button (? bubble) inside the app — Contact Us",
              <>Or email directly: <a href="mailto:clearmyplate@back9.co.nz" style={{ color: SAGE }} className="underline underline-offset-2">clearmyplate@back9.co.nz</a></>,
              "You'll also get a short survey from us after your first week",
              "There are no wrong answers — brutal honesty is the most helpful",
            ].map((item, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed" style={{ color: GRAY }}>
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: SAGE }} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <footer className="mt-10 text-center text-xs" style={{ color: GRAY }}>
          <p className="mb-2">
            © 2026 ClearMyPlate · Made for NZ families 🇳🇿
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/terms" className="hover:underline" style={{ color: SAGE }}>Terms</Link>
            <Link href="/privacy" className="hover:underline" style={{ color: SAGE }}>Privacy</Link>
          </div>
        </footer>

      </div>
    </div>
  )
}
