// components/ClaimPopover.tsx
import { ClaimVerdict, Verdict } from '@/lib/types'

const VERDICT_CONFIG: Record<Verdict, { label: string; bg: string; text: string }> = {
  confirmed:    { label: 'Confirmed',    bg: 'bg-green-100',  text: 'text-green-800' },
  uncertain:    { label: 'Uncertain',    bg: 'bg-yellow-100', text: 'text-yellow-800' },
  contradicted: { label: 'Contradicted', bg: 'bg-red-100',    text: 'text-red-800' }
}

interface ClaimPopoverProps {
  verdict: ClaimVerdict
  onClose: () => void
}

export default function ClaimPopover({ verdict, onClose }: ClaimPopoverProps) {
  const config = VERDICT_CONFIG[verdict.verdict]

  return (
    <span
      className="absolute z-20 left-0 top-full mt-1 w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-4 block"
      onClick={e => e.stopPropagation()}
    >
      <div className="border-l-2 border-amber pl-3 mb-3">
        <div className="flex items-center justify-between">
          <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.15em] uppercase text-amber">
            {verdict.verdict.toUpperCase()}
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
        </div>
      </div>
      <p className="text-sm text-gray-700 mb-3">{verdict.explanation}</p>
      {verdict.sources.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sources</p>
          {verdict.sources.slice(0, 3).map((source, i) => (
            <a
              key={i}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-indigo-600 hover:underline truncate"
            >
              {source.title || source.url}
            </a>
          ))}
        </div>
      )}
    </span>
  )
}
