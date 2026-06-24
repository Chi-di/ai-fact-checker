'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Nav from '@/components/Nav'
import CheckInput from '@/components/CheckInput'
import UsageBar from '@/components/UsageBar'
import SummaryBar from '@/components/SummaryBar'
import HighlightedText from '@/components/HighlightedText'
import PricingModal from '@/components/PricingModal'
import { CheckResult } from '@/lib/types'

const LOADING_STEPS = [
  'Extracting factual claims…',
  'Searching the web for each claim…',
  'Judging the receipts…',
]

const VERDICT_LABEL = {
  confirmed: 'Legit',
  uncertain: 'Fuzzy',
  contradicted: 'Wrong',
} as const

const VERDICT_COLORS = {
  confirmed:    { border: 'border-pine',      text: 'text-pine',      pill: 'bg-pine/15 text-pine' },
  uncertain:    { border: 'border-uncertain', text: 'text-uncertain', pill: 'bg-uncertain/15 text-uncertain' },
  contradicted: { border: 'border-ember',     text: 'text-ember',     pill: 'bg-ember/15 text-ember' },
}

interface CheckPageClientProps {
  userEmail: string | null
  plan: string
  initialUsed: number
}

function CheckPageInner({ userEmail, plan, initialUsed }: CheckPageClientProps) {
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [originalInput, setOriginalInput] = useState('')
  const [currentInputType, setCurrentInputType] = useState<'text' | 'url'>('text')
  const [used, setUsed] = useState(initialUsed)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const limit = plan === 'free' ? 3 : plan === 'pro' ? 200 : null

  async function handleCheck(input: string, inputType: 'text' | 'url') {
    setError('')
    setResult(null)
    setLoading(true)
    setOriginalInput(inputType === 'text' ? input : '')
    setCurrentInputType(inputType)
    setLoadingStep(0)

    const stepTimer = setInterval(() => {
      setLoadingStep(s => Math.min(s + 1, LOADING_STEPS.length - 1))
    }, 2500)

    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, inputType }),
      })

      const data = await res.json()
      clearInterval(stepTimer)

      if (res.status === 429) {
        setShowPricingModal(true)
        return
      }

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      setResult(data)
      if (data.usage?.used != null) setUsed(data.usage.used)
    } finally {
      clearInterval(stepTimer)
      setLoading(false)
    }
  }

  function copyReport() {
    if (!result) return
    const lines = result.verdicts.map(v => {
      const claim = result.claims[v.claimIndex]
      return `[${VERDICT_LABEL[v.verdict]}] "${claim?.text}" — ${v.explanation}`
    })
    navigator.clipboard.writeText(lines.join('\n'))
  }

  return (
    <>
      <Nav userEmail={userEmail} />
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        {searchParams.get('upgraded') === 'true' && (
          <div className="bg-pine/10 border border-pine/40 text-pine font-[family-name:var(--font-mono)] text-xs px-4 py-3 rounded-xl">
            ✓ You are now on Pro. Enjoy 200 checks per month.
          </div>
        )}

        <div className="mb-8">
          <div className="font-[family-name:var(--font-mono)] text-[10px] text-violet tracking-wide mb-3">
            // kerfuffle scan
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-snow text-3xl font-bold mb-2 tracking-tight">
            Check your AI
          </h1>
          <p className="font-[family-name:var(--font-mono)] text-muted text-xs tracking-wide">
            Paste text or enter a URL — we&apos;ll find every kerfuffle
          </p>
        </div>

        {limit !== null && (
          <UsageBar used={used} limit={limit} plan={plan} />
        )}

        <CheckInput onSubmit={handleCheck} loading={loading} />

        {loading && (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="w-6 h-6 border-2 border-amber border-t-transparent rounded-full animate-spin" />
            <p
              key={loadingStep}
              className="font-[family-name:var(--font-mono)] text-xs text-amber tracking-wide overflow-hidden whitespace-nowrap w-fit animate-typing border-r-2 border-amber"
            >
              {LOADING_STEPS[loadingStep]}
            </p>
          </div>
        )}

        {error && (
          <div className="font-[family-name:var(--font-mono)] text-xs text-ember bg-ember/10 border border-ember/30 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4 animate-fade-in">
            <SummaryBar verdicts={result.verdicts} onCopyReport={copyReport} />
            {currentInputType === 'text' && (
              <div className="border border-rim rounded-xl p-6 bg-surface">
                <HighlightedText
                  text={originalInput}
                  claims={result.claims}
                  verdicts={result.verdicts}
                />
              </div>
            )}
            {currentInputType === 'url' && (
              <div className="mt-6 space-y-3">
                {result.verdicts.map((v, i) => {
                  const claim = result.claims[v.claimIndex]
                  const colors = VERDICT_COLORS[v.verdict]
                  return (
                    <div key={i} className={`border-l-2 pl-4 py-2 ${colors.border}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`font-[family-name:var(--font-mono)] text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${colors.pill}`}>
                          {VERDICT_LABEL[v.verdict]}
                        </span>
                      </div>
                      <p className="font-[family-name:var(--font-mono)] text-xs text-snow leading-relaxed">{claim?.text}</p>
                      <p className="font-[family-name:var(--font-mono)] text-xs text-muted mt-1 leading-relaxed">{v.explanation}</p>
                      {v.sources.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {v.sources.slice(0, 3).map(s => (
                            <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer"
                              className="font-[family-name:var(--font-mono)] text-[10px] text-violet hover:text-snow transition-colors underline-offset-2 underline">
                              {s.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {showPricingModal && <PricingModal onClose={() => setShowPricingModal(false)} />}
    </>
  )
}

export default function CheckPageClient(props: CheckPageClientProps) {
  return (
    <Suspense fallback={null}>
      <CheckPageInner {...props} />
    </Suspense>
  )
}
