import Link from "next/link"
import Image from "next/image"

const BG     = "#F5F3EE"
const BORDER = "#DDD9D1"
const DARK   = "#1C2B27"
const GRAY   = "#6B7B77"
const SAGE   = "#4A7C6F"

function Section({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-base font-semibold" style={{ color: DARK }}>
        {number}. {title}
      </h2>
      <div className="space-y-2 text-sm leading-relaxed" style={{ color: GRAY }}>
        {children}
      </div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: BG }}>
      <div className="mx-auto max-w-3xl px-6 pt-12">

        {/* Logo + back */}
        <div className="mb-10 flex items-center justify-between">
          <Link href="/">
            <Image src="/images/Clear My Plate Logo Horizontal Lockup.svg" alt="ClearMyPlate" width={176} height={44} className="h-11 w-auto" unoptimized />
          </Link>
          <Link href="/" className="text-sm font-medium" style={{ color: SAGE }}>
            ← Back to home
          </Link>
        </div>

        {/* Header */}
        <div className="mb-10 border-b pb-8" style={{ borderColor: BORDER }}>
          <h1 className="mb-1 text-3xl font-bold" style={{ color: DARK }}>Privacy Policy</h1>
          <p className="text-sm" style={{ color: GRAY }}>Clear My Plate · Last updated: April 2026</p>
        </div>

        <Section number={1} title="Who We Are">
          <p>
            Clear My Plate operates ClearMyPlate (clearmyplate.app), an AI-powered meal planning service based
            in New Zealand.
          </p>
        </Section>

        <Section number={2} title="Information We Collect">
          <p>We collect the following information when you use ClearMyPlate:</p>
          <div className="mt-3 space-y-3">
            <p>
              <span className="font-medium" style={{ color: DARK }}>Account information:</span>{" "}
              Your name, email address, and password when you sign up.
            </p>
            <p>
              <span className="font-medium" style={{ color: DARK }}>Household information:</span>{" "}
              Number of adults and children in your household, weekly budget, dietary preferences, food allergies,
              and meal planning goals. This information is used solely to generate your personalised meal plans.
            </p>
            <p>
              <span className="font-medium" style={{ color: DARK }}>Usage data:</span>{" "}
              How you interact with the service, including meal plans generated, recipes saved, and grocery lists viewed.
            </p>
            <p>
              <span className="font-medium" style={{ color: DARK }}>Payment information:</span>{" "}
              Payment is processed securely by Stripe. ClearMyPlate does not store your full card details.
            </p>
          </div>
        </Section>

        <Section number={3} title="How We Use Your Information">
          <p>We use your information to:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Generate personalised meal plans and grocery lists</li>
            <li>Manage your account and subscription</li>
            <li>Send you service-related emails (account confirmation, plan reminders, trial expiry notices)</li>
            <li>Improve the service over time</li>
          </ul>
        </Section>

        <Section number={4} title="AI and Your Data">
          <p>
            Your household preferences are sent to Anthropic&rsquo;s AI API to generate meal plans. This data is
            used only for generating your meal plan and is subject to{" "}
            <a
              href="https://www.anthropic.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium"
              style={{ color: SAGE }}
            >
              Anthropic&rsquo;s privacy policy
            </a>
            . We do not sell your data to third parties.
          </p>
        </Section>

        <Section number={5} title="CRM and Marketing">
          <p>
            When you sign up or make a purchase, your name, email, and plan type are shared with our CRM system
            (Amplify HQ) to manage customer communications. You can unsubscribe from marketing emails at any
            time using the unsubscribe link in any email.
          </p>
        </Section>

        <Section number={6} title="Data Storage">
          <p>
            Your data is stored securely using Supabase, hosted in data centres that comply with industry security
            standards. We retain your data for as long as your account is active, or as required by law.
          </p>
        </Section>

        <Section number={7} title="Your Rights">
          <p>Under New Zealand&rsquo;s Privacy Act 2020, you have the right to:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your account and associated data</li>
          </ul>
          <p className="mt-2">
            To exercise these rights, contact us at{" "}
            <a href="mailto:clearmyplate@back9.co.nz" className="font-medium" style={{ color: SAGE }}>
              clearmyplate@back9.co.nz
            </a>
          </p>
        </Section>

        <Section number={8} title="Cookies">
          <p>
            ClearMyPlate uses cookies to maintain your login session. We do not use third-party advertising cookies.
          </p>
        </Section>

        <Section number={9} title="Children">
          <p>
            ClearMyPlate is not directed at children under 13. We do not knowingly collect personal information
            from children under 13.
          </p>
        </Section>

        <Section number={10} title="Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes via
            email or in-app notice.
          </p>
        </Section>

        <Section number={11} title="Contact">
          <p>
            For privacy-related enquiries, contact us at{" "}
            <a href="mailto:clearmyplate@back9.co.nz" className="font-medium" style={{ color: SAGE }}>
              clearmyplate@back9.co.nz
            </a>
          </p>
        </Section>

      </div>
    </div>
  )
}
