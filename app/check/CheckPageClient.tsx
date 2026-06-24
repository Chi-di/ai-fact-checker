// app/check/CheckPageClient.tsx
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
  'Judging results…',
]

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
      return `[${v.verdict.toUpperCase()}] "${claim?.text}" — ${v.explanation}`
    })
    navigator.clipboard.writeText(lines.join('\n'))
  }

  return (
    <>
      <Nav userEmail={userEmail} />
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        {searchParams.get('upgraded') === 'true' && (
          <div className="bg-green-900/30 border border-green-700 text-green-300 text-sm px-4 py-3 rounded-xl">
            You are now on Pro. Enjoy 200 checks per month.
          </div>
        )}

        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-snow text-3xl italic mb-2">
            Verify AI Content
          </h1>
          <p className="font-[family-name:var(--font-mono)] text-muted text-xs tracking-wide">
            Paste text or enter a URL to check for hallucinations
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
          <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
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
              <div className="mt-6 space-y-3 animate-fade-in">
                {result.verdicts.map((v, i) => {
                  const claim = result.claims[v.claimIndex]
                  const colorClass = v.verdict === 'confirmed' ? 'border-pine text-pine' : v.verdict === 'contradicted' ? 'border-ember text-ember' : 'border-amber text-amber'
                  return (
                    <div key={i} className={`border-l-2 pl-4 py-2 ${colorClass.split(' ')[0]}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-[family-name:var(--font-mono)] text-[10px] tracking-widest uppercase ${colorClass.split(' ')[1]}`}>
                          {v.verdict}
                        </span>
                      </div>
                      <p className="font-[family-name:var(--font-mono)] text-xs text-snow leading-relaxed">{claim?.text}</p>
                      <p className="font-[family-name:var(--font-mono)] text-xs text-muted mt-1 leading-relaxed">{v.explanation}</p>
                      {v.sources.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {v.sources.slice(0, 3).map(s => (
                            <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer"
                              className="font-[family-name:var(--font-mono)] text-[10px] text-muted hover:text-amber transition-colors underline-offset-2 underline">
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

// useSearchParams requires Suspense boundary in Next.js App Router
export default function CheckPageClient(props: CheckPageClientProps) {
  return (
    <Suspense fallback={null}>
      <CheckPageInner {...props} />
    </Suspense>
  )
}
