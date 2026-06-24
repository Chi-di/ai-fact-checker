'use client'
import { useState } from 'react'
import { Claim, ClaimVerdict, Verdict } from '@/lib/types'
import ClaimPopover from './ClaimPopover'

interface Segment {
  text: string
  claimIndex?: number
  verdict?: Verdict
}

function buildSegments(text: string, claims: Claim[], verdicts: ClaimVerdict[]): Segment[] {
  const verdictMap = new Map(verdicts.map(v => [v.claimIndex, v]))
  const sorted = claims
    .map((c, i) => ({ ...c, originalIndex: i }))
    .sort((a, b) => a.startIndex - b.startIndex)

  const segments: Segment[] = []
  let cursor = 0

  for (const claim of sorted) {
    if (claim.startIndex > cursor) {
      segments.push({ text: text.slice(cursor, claim.startIndex) })
    }
    const v = verdictMap.get(claim.originalIndex)
    segments.push({
      text: text.slice(claim.startIndex, claim.endIndex),
      claimIndex: claim.originalIndex,
      verdict: v?.verdict
    })
    cursor = claim.endIndex
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) })
  }

  return segments
}

const MARK_CLASSES: Record<Verdict, string> = {
  confirmed:    'bg-pine/10 border-b-2 border-pine',
  uncertain:    'bg-uncertain/10 border-b-2 border-uncertain',
  contradicted: 'bg-ember/10 border-b-2 border-ember',
}

interface HighlightedTextProps {
  text: string
  claims: Claim[]
  verdicts: ClaimVerdict[]
}

export default function HighlightedText({ text, claims, verdicts }: HighlightedTextProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const segments = buildSegments(text, claims, verdicts)
  const verdictMap = new Map(verdicts.map(v => [v.claimIndex, v]))

  return (
    <div
      className="text-snow leading-relaxed whitespace-pre-wrap text-sm font-[family-name:var(--font-mono)]"
      onClick={() => setActiveIndex(null)}
    >
      {segments.map((seg, i) => {
        if (seg.claimIndex === undefined || !seg.verdict) {
          return <span key={i} className="text-snow/70">{seg.text}</span>
        }
        const claimVerdict = verdictMap.get(seg.claimIndex)
        return (
          <span key={i} className="relative">
            <mark
              className={`${MARK_CLASSES[seg.verdict]} cursor-pointer px-0.5 text-snow bg-transparent`}
              style={{ backgroundColor: 'transparent' }}
              onClick={e => {
                e.stopPropagation()
                setActiveIndex(activeIndex === seg.claimIndex ? null : seg.claimIndex!)
              }}
            >
              {seg.text}
            </mark>
            {activeIndex === seg.claimIndex && claimVerdict && (
              <ClaimPopover
                verdict={claimVerdict}
                onClose={() => setActiveIndex(null)}
              />
            )}
          </span>
        )
      })}
    </div>
  )
}
