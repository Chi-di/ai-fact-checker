import Nav from '@/components/Nav'
import PricingCards from '@/components/PricingCards'

export const dynamic = 'force-dynamic'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-ink">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute w-[600px] h-[400px] rounded-full blur-[120px] bg-amber/10 -top-32 -left-32" />
      </div>
      <Nav />
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="font-[family-name:var(--font-mono)] text-xs text-violet tracking-wide mb-4 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber inline-block" />
            No surprises. No gotchas.
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-snow font-bold text-5xl mb-4 tracking-tight">
            Simple pricing.
          </h1>
          <p className="font-[family-name:var(--font-mono)] text-muted text-sm">
            Start free. Upgrade when the kerfuffles pile up.
          </p>
        </div>
        <PricingCards />
        <p className="font-[family-name:var(--font-mono)] text-muted text-[10px] text-center mt-10 tracking-wide">
          Cancel anytime. No contracts. No drama.
        </p>
      </main>
    </div>
  )
}
