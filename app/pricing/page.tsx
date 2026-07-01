import Nav from '@/components/Nav'
import PricingCards from '@/components/PricingCards'
import VideoBackground from '@/components/VideoBackground'

export default function PricingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <VideoBackground />
      <div className="relative z-10">
      <Nav />
      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="font-[family-name:var(--font-serif)] italic text-snow text-5xl mb-3">
            Simple Pricing
          </h1>
          <p className="text-muted text-base">
            Start free. Upgrade when your reputation demands it.
          </p>
        </div>
        <PricingCards />
        <p className="font-[family-name:var(--font-mono)] text-muted text-[10px] text-center mt-10 tracking-wide">
          Cancel anytime. No contracts.
        </p>
      </main>
      </div>
    </div>
  )
}
