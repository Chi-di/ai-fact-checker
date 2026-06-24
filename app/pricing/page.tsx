import Nav from '@/components/Nav'
import PricingCards from '@/components/PricingCards'

export const dynamic = 'force-dynamic'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-ink">
      <Nav />
      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="w-12 h-px bg-amber mx-auto mb-6" />
          <h1 className="font-[family-name:var(--font-display)] text-snow text-4xl italic mb-4">
            Simple Pricing
          </h1>
          <p className="font-[family-name:var(--font-mono)] text-muted text-xs tracking-wide">
            Start free. Upgrade when you need more.
          </p>
        </div>
        <PricingCards />
        <p className="font-[family-name:var(--font-mono)] text-muted text-[10px] text-center mt-10 tracking-wide">
          Cancel anytime. No contracts.
        </p>
      </main>
    </div>
  )
}
