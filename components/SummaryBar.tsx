// components/SummaryBar.tsx
import { ClaimVerdict } from '@/lib/types'

interface SummaryBarProps {
  verdicts: ClaimVerdict[]
  onCopyReport: () => void
}

export default function SummaryBar({ verdicts, onCopyReport }: SummaryBarProps) {
  const confirmed = verdicts.filter(v => v.verdict === 'confirmed').length
  const uncertain = verdicts.filter(v => v.verdict === 'uncertain').length
  const contradicted = verdicts.filter(v => v.verdict === 'contradicted').length

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center gap-4 text-sm">
        <span className="font-medium text-gray-700">{verdicts.length} claims checked</span>
        <span className="flex items-center gap-1 text-green-700">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
          {confirmed} confirmed
        </span>
        <span className="flex items-center gap-1 text-yellow-700">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
          {uncertain} uncertain
        </span>
        <span className="flex items-center gap-1 text-red-700">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
          {contradicted} contradicted
        </span>
      </div>
      <button
        onClick={onCopyReport}
        className="text-xs text-gray-500 hover:text-gray-800 border border-gray-300 px-3 py-1.5 rounded-lg transition-colors"
      >
        Copy report
      </button>
    </div>
  )
}
