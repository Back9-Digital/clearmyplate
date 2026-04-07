import Link from "next/link"

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

export default function TermsPage() {
  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: BG }}>
      <div className="mx-auto max-w-3xl px-6 pt-12">

        {/* Logo + back */}
        <div className="mb-10 flex items-center justify-between">
          <Link href="/">
            <img
              src="/images/Clear My Plate Logo Horizontal Lockup.svg"
              alt="ClearMyPlate"
              style={{ height: 44 }}
            />
          </Link>
          <Link href="/" className="text-sm font-medium" style={{ color: SAGE }}>
            ← Back to home
          </Link>
        </div>

        {/* Header */}
        <div className="mb-10 border-b pb-8" style={{ borderColor: BORDER }}>
          <h1 className="mb-1 text-3xl font-bold" style={{ color: DARK }}>Terms of Service</h1>
          <p className="text-sm" style={{ color: GRAY }}>Clear My Plate · Last updated: April 2026</p>
        </div>

        <Section number={1} title="Acceptance of Terms">
          <p>
            By accessing or using ClearMyPlate (clearmyplate.app), you agree to be bound by these Terms of Service.
            If you do not agree, please do not use the service.
          </p>
        </Section>

        <Section number={2} title="Description of Service">
          <p>
            ClearMyPlate is an AI-powered meal planning service that generates weekly dinner plans, grocery lists,
            and recipes based on your household preferences. The service is operated by Clear My Plate.
          </p>
        </Section>

        <Section number={3} title="Meal Plans and AI-Generated Content">
          <p>ClearMyPlate uses artificial intelligence to generate meal plans, recipes, and grocery lists. Please note:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Meal plans are generated automatically and are intended as a guide only.</li>
            <li>We do not guarantee the nutritional accuracy of any meal plan or recipe.</li>
            <li>
              Grocery cost estimates are approximate and based on general NZ pricing. Actual costs will vary
              depending on your location, chosen supermarket, and product availability. ClearMyPlate is not
              responsible for any difference between estimated and actual grocery costs.
            </li>
            <li>
              You are responsible for checking all ingredients against any dietary requirements, allergies, or
              health conditions before preparing any meal.
            </li>
          </ul>
        </Section>

        <Section number={4} title="Allergies and Dietary Requirements">
          <p>
            While ClearMyPlate allows you to specify allergies and dietary preferences, you must always independently
            verify that any meal plan or recipe is safe for your household. ClearMyPlate is not a medical or dietary
            service and accepts no liability for allergic reactions or adverse health outcomes resulting from the use
            of our meal plans.
          </p>
        </Section>

        <Section number={5} title="Free Trial">
          <p>
            New accounts receive a free trial with limited meal plan generations. After the trial period, a paid
            subscription is required to continue generating meal plans. ClearMyPlate reserves the right to modify
            the terms of the free trial at any time.
          </p>
        </Section>

        <Section number={6} title="Subscriptions and Payments">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Subscriptions are billed monthly or annually as selected at checkout.</li>
            <li>The Launch Special ($39 one-time) and Lifetime Access ($299 one-time) are non-refundable once activated.</li>
            <li>
              Monthly and annual subscriptions may be cancelled at any time. Cancellation takes effect at the end
              of the current billing period.
            </li>
            <li>All prices are in NZD unless otherwise stated.</li>
          </ul>
        </Section>

        <Section number={7} title="Accounts">
          <p>
            You are responsible for maintaining the confidentiality of your account credentials. You must notify us
            immediately of any unauthorised use of your account. ClearMyPlate is not liable for any loss resulting
            from unauthorised use of your account.
          </p>
        </Section>

        <Section number={8} title="Prohibited Use">
          <p>You must not use ClearMyPlate to:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Violate any applicable law or regulation</li>
            <li>Attempt to reverse-engineer or copy any part of the service</li>
            <li>Use the service for commercial resale without written permission</li>
          </ul>
        </Section>

        <Section number={9} title="Limitation of Liability">
          <p>
            To the maximum extent permitted by New Zealand law, Clear My Plate is not liable for any indirect,
            incidental, or consequential damages arising from your use of the service, including but not limited
            to health outcomes, grocery costs, or data loss.
          </p>
        </Section>

        <Section number={10} title="Changes to Terms">
          <p>
            We may update these Terms from time to time. Continued use of the service after changes are posted
            constitutes acceptance of the updated Terms.
          </p>
        </Section>

        <Section number={11} title="Governing Law">
          <p>These Terms are governed by the laws of New Zealand.</p>
        </Section>

        <Section number={12} title="Contact">
          <p>
            For any questions about these Terms, contact us at{" "}
            <a href="mailto:hello@clearmyplate.app" className="font-medium" style={{ color: SAGE }}>
              hello@clearmyplate.app
            </a>
          </p>
        </Section>

      </div>
    </div>
  )
}
