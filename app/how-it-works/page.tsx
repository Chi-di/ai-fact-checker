import Nav from '@/components/Nav'
import Link from 'next/link'
import { ClipboardPaste, ScanSearch, Globe, ListChecks } from 'lucide-react'
import VideoBackground from '@/components/VideoBackground'

export const dynamic = 'force-dynamic'

const STEPS = [
  {
    number: 'STEP ONE',
    title: 'Paste and go',
    description: 'Drop in your AI-generated text or a URL. kerfuffle pulls it apart and gets to work. No formatting required, no signup ritual.',
    tag: 'Works on any AI output',
    icon: ClipboardPaste,
    accent: 'text-violet/70 border-violet/20 bg-violet/5',
  },
  {
    number: 'STEP TWO',
    title: 'Claims extracted',
    description: 'Every verifiable statement gets isolated — dates, statistics, attributions, named facts. The stuff that looks authoritative and quietly isn\'t.',
    tag: 'Nothing slips through',
    icon: ScanSearch,
    accent: 'text-amber/70 border-amber/20 bg-amber/5',
  },
  {
    number: 'STEP THREE',
    title: 'Live verification',
    description: 'Each claim is cross-referenced against live web sources in real time. Not a static database. Not last year\'s training data. The actual internet, right now.',
    tag: 'Sources checked live',
    icon: Globe,
    accent: 'text-pine/70 border-pine/20 bg-pine/5',
  },
  {
    number: 'STEP FOUR',
    title: 'Colour-coded verdict',
    description: 'Results come back Legit, Fuzzy, or Wrong — each linked to the source that sealed its fate. Fix what needs fixing, publish what doesn\'t.',
    tag: 'Green means publish.',
    icon: ListChecks,
    accent: 'text-snow/60 border-rim bg-surface/60',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <VideoBackground />
      <div className="relative z-10">
      <Nav />

      <main className="max-w-6xl mx-auto px-6 pt-20 pb-24">

        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="liquid-glass rounded-full px-5 py-2 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber animate-pulse inline-block" />
            <span className="text-xs text-muted uppercase tracking-widest">How It Works</span>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-16">
          <h1 className="font-[family-name:var(--font-serif)] italic text-snow text-5xl sm:text-6xl leading-tight">
            Four steps between you<br />
            <em className="not-italic text-violet">and an embarrassing correction.</em>
          </h1>
        </div>

        {/* Steps */}
        <div className="flex flex-col md:flex-row items-stretch gap-0">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.number} className="flex flex-col md:flex-row items-stretch flex-1 min-w-0">

                {/* Card */}
                <div className="flex-1 liquid-glass rounded-2xl p-6 flex flex-col min-w-0">
                  <p className="text-[10px] text-muted uppercase tracking-widest mb-1">{step.number}</p>
                  <h2 className="font-[family-name:var(--font-serif)] italic text-snow text-xl mb-5">
                    {step.title}
                  </h2>

                  {/* Icon visual */}
                  <div className={`rounded-xl border p-8 mb-5 flex items-center justify-center ${step.accent}`}>
                    <Icon className="w-12 h-12" strokeWidth={1.25} />
                  </div>

                  <p className="text-sm text-muted leading-relaxed flex-1">{step.description}</p>

                  {/* Tag */}
                  <div className="mt-4 pt-4 border-t border-white/[0.08]">
                    <span className="text-xs text-snow/50">{step.tag}</span>
                  </div>
                </div>

                {/* Arrow connector */}
                {i < STEPS.length - 1 && (
                  <div className="flex items-center justify-center md:px-2 py-3 md:py-0 flex-shrink-0">
                    <div className="w-8 h-8 rounded-full border border-rim/60 bg-ink/60 flex items-center justify-center">
                      <span className="text-muted text-sm rotate-90 md:rotate-0 inline-block">→</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Link
            href="/signup"
            className="liquid-glass rounded-full px-8 py-3.5 text-sm text-snow whitespace-nowrap hover:scale-[1.03] transition-transform inline-block"
          >
            Start checking free →
          </Link>
          <p className="text-xs text-muted mt-3">3 free checks daily · No card required</p>
        </div>

      </main>
      </div>
    </div>
  )
}
