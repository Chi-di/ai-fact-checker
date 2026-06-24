// components/HighlightedText.tsx
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
  confirmed:    'bg-green-100 border-b-2 border-green-400',
  uncertain:    'bg-yellow-100 border-b-2 border-yellow-400',
  contradicted: 'bg-red-100 border-b-2 border-red-500'
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
      className="text-gray-800 leading-relaxed whitespace-pre-wrap text-base"
      onClick={() => setActiveIndex(null)}
    >
      {segments.map((seg, i) => {
        if (seg.claimIndex === undefined || !seg.verdict) {
          return <span key={i}>{seg.text}</span>
        }
        const claimVerdict = verdictMap.get(seg.claimIndex)
        return (
          <span key={i} className="relative">
            <mark
              className={`${MARK_CLASSES[seg.verdict]} cursor-pointer rounded-sm px-0.5`}
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
