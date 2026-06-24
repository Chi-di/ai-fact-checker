import Link from 'next/link'
import Nav from '@/components/Nav'
import PricingCards from '@/components/PricingCards'

export const dynamic = 'force-dynamic'

const HOW_IT_WORKS = [
  { num: '01', title: 'Paste or URL', body: 'Drop in any AI-generated text or paste a URL to an article you want to verify.' },
  { num: '02', title: 'We Extract Claims', body: 'Claude identifies every hard factual assertion — dates, statistics, attributions, events.' },
  { num: '03', title: 'Colour-Coded Results', body: 'Each claim is highlighted green, yellow, or red with source citations you can click.' },
]

const FAQ = [
  { q: 'Is it free?', a: 'Yes — 3 checks per day, no credit card required. Pro gives you 200/month for $15.' },
  { q: 'What counts as a hallucination?', a: 'Any factual claim that contradicts or is unsupported by live web sources.' },
  { q: 'How fast is a check?', a: 'Under 10 seconds for most articles. Complex pages with many claims take a few seconds more.' },
  { q: 'Does it store my content?', a: 'Your input is never stored. We log an anonymised check count and claim count for usage limits — no content is retained.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-ink">
      <Nav />

      {/* Hero */}
      <section className="min-h-[90vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-px bg-amber mb-8" />
        <h1 className="font-[family-name:var(--font-display)] text-snow text-5xl md:text-7xl italic leading-tight mb-6 max-w-3xl">
          AI writes.<br />We verify.
        </h1>
        <p className="font-[family-name:var(--font-mono)] text-muted text-sm tracking-wide max-w-md mb-10">
          Paste any AI-generated text or URL. We extract every factual claim and verify it against live sources in seconds.
        </p>
        <Link
          href="/check"
          className="relative overflow-hidden inline-block px-8 py-4 bg-amber text-ink font-[family-name:var(--font-mono)] font-semibold text-sm tracking-widest uppercase before:absolute before:inset-0 before:bg-snow before:translate-x-[-101%] hover:before:translate-x-0 before:transition-transform before:duration-300 [&>span]:relative [&>span]:z-10"
        >
          <span>Start Checking Free →</span>
        </Link>
        <Link
          href="/pricing"
          className="mt-4 font-[family-name:var(--font-mono)] text-xs text-muted tracking-widest uppercase hover:text-amber transition-colors"
        >
          View Pricing
        </Link>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-24">
        <div className="border-t border-rim pt-16">
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-muted tracking-[0.2em] uppercase">
            How It Works
          </span>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {HOW_IT_WORKS.map(({ num, title, body }) => (
              <div key={num} className="border-l border-rim pl-6">
                <span className="font-[family-name:var(--font-mono)] text-amber text-xs mb-4 block">{num}</span>
                <h3 className="font-[family-name:var(--font-display)] text-snow text-xl italic mb-3">{title}</h3>
                <p className="font-[family-name:var(--font-mono)] text-muted text-xs leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="border-t border-rim pt-16 mb-12">
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-muted tracking-[0.2em] uppercase">
            Pricing
          </span>
        </div>
        <PricingCards />
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-6 pb-32">
        <div className="border-t border-rim pt-16">
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-muted tracking-[0.2em] uppercase">
            FAQ
          </span>
          <div className="mt-8 space-y-px">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group border border-rim bg-surface">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none">
                  <span className="font-[family-name:var(--font-mono)] text-xs text-snow">{q}</span>
                  <span className="font-[family-name:var(--font-mono)] text-amber text-xs group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-5 pb-4">
                  <p className="font-[family-name:var(--font-mono)] text-xs text-muted leading-relaxed">{a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-rim py-8">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <span className="font-[family-name:var(--font-display)] text-snow text-sm italic">FactCheck<span className="font-[family-name:var(--font-mono)] text-amber text-xs ml-1">[AI]</span></span>
          <span className="font-[family-name:var(--font-mono)] text-muted text-[10px] tracking-wide">Verify before you publish.</span>
        </div>
      </footer>
    </div>
  )
}
