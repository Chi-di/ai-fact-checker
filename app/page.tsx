import Link from 'next/link'
import Nav from '@/components/Nav'
import PricingCards from '@/components/PricingCards'

export const dynamic = 'force-dynamic'

const HOW_IT_WORKS = [
  { num: '01', title: 'Drop it in', body: 'Paste any AI-generated text, or give us a URL. We handle the rest.' },
  { num: '02', title: 'We dig in', body: 'Every hard factual claim gets extracted — dates, stats, attributions, events — and checked against live sources.' },
  { num: '03', title: 'The verdict', body: 'Claims come back colour-coded: Legit, Fuzzy, or Wrong. Click any one for sources.' },
]

const FAQ = [
  { q: 'Is it free?', a: 'Yes — 3 checks per day, no credit card required. Pro gets you 200 checks per month for $15.' },
  { q: 'What counts as a kerfuffle?', a: 'Any factual claim that contradicts or is unsupported by live web sources. Dates, figures, attributions — the things that get you in trouble.' },
  { q: 'How fast is a check?', a: 'Under 10 seconds for most text. Complex pages with lots of claims take a few seconds more.' },
  { q: 'Does it store my content?', a: 'Never. We log an anonymised check count for rate limiting — no content is retained, ever.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-ink">
      <Nav />

      {/* Glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute w-[600px] h-[500px] rounded-full blur-[120px] bg-amber/10 -top-32 -left-32" />
        <div className="absolute w-[400px] h-[300px] rounded-full blur-[100px] bg-ember/6 bottom-0 right-0" />
      </div>

      {/* Hero */}
      <section className="relative z-10 min-h-[88vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="font-[family-name:var(--font-mono)] text-xs text-violet tracking-wide mb-6 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber inline-block" />
          AI hallucination fact-checker — kerfuffle.app
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-snow font-bold text-6xl md:text-8xl leading-[1.0] mb-4 tracking-tight">
          AI said <span className="text-ember">what?</span>
        </h1>
        <h2 className="font-[family-name:var(--font-display)] text-violet font-bold text-5xl md:text-7xl leading-[1.05] mb-8 tracking-tight">
          We checked.
        </h2>
        <p className="font-[family-name:var(--font-display)] text-muted text-lg max-w-md mb-10 leading-relaxed font-normal">
          Paste any AI-generated text or URL. We extract every factual claim and verify it against live sources. No more embarrassing corrections.
        </p>
        <Link
          href="/check"
          className="inline-flex items-center gap-2 px-8 py-4 bg-amber text-snow font-[family-name:var(--font-display)] font-semibold text-base rounded-xl shadow-[0_0_32px_rgba(124,58,237,0.4)] hover:bg-violet transition-colors"
        >
          Check your AI →
        </Link>
        <Link
          href="/pricing"
          className="mt-4 font-[family-name:var(--font-mono)] text-xs text-muted hover:text-snow transition-colors"
        >
          See pricing
        </Link>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="border-t border-rim pt-16">
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-muted tracking-[0.2em] uppercase">
            How It Works
          </span>
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {HOW_IT_WORKS.map(({ num, title, body }) => (
              <div key={num} className="bg-surface border border-rim p-6 rounded-xl">
                <span className="font-[family-name:var(--font-mono)] text-amber text-xs mb-4 block">{num}</span>
                <h3 className="font-[family-name:var(--font-display)] text-snow text-lg font-bold mb-3">{title}</h3>
                <p className="font-[family-name:var(--font-mono)] text-muted text-xs leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="border-t border-rim pt-16 mb-12">
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-muted tracking-[0.2em] uppercase">
            Pricing
          </span>
        </div>
        <PricingCards />
      </section>

      {/* FAQ */}
      <section className="relative z-10 max-w-2xl mx-auto px-6 pb-32">
        <div className="border-t border-rim pt-16">
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-muted tracking-[0.2em] uppercase">
            FAQ
          </span>
          <div className="mt-8 space-y-px">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group border border-rim bg-surface rounded-lg mb-1 overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none">
                  <span className="font-[family-name:var(--font-display)] text-sm text-snow font-medium">{q}</span>
                  <span className="font-[family-name:var(--font-mono)] text-amber text-sm group-open:rotate-45 transition-transform">+</span>
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
      <footer className="relative z-10 border-t border-rim py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 bg-amber rounded flex items-center justify-center text-snow text-[10px] font-bold">✦</span>
            <span className="font-[family-name:var(--font-display)] text-snow text-sm font-bold">kerfuffle</span>
          </div>
          <span className="font-[family-name:var(--font-mono)] text-muted text-[10px] tracking-wide">Catching fibs since 2026.</span>
        </div>
      </footer>
    </div>
  )
}
