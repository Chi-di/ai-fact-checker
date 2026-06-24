import { ClaimVerdict } from '@/lib/types'

interface SummaryBarProps {
  verdicts: ClaimVerdict[]
  onCopyReport: () => void
}

const VERDICT_LABEL = {
  confirmed: 'Legit',
  uncertain: 'Fuzzy',
  contradicted: 'Wrong',
}

export default function SummaryBar({ verdicts, onCopyReport }: SummaryBarProps) {
  const confirmed = verdicts.filter(v => v.verdict === 'confirmed').length
  const uncertain = verdicts.filter(v => v.verdict === 'uncertain').length
  const contradicted = verdicts.filter(v => v.verdict === 'contradicted').length

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-surface border border-rim rounded-xl">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="font-[family-name:var(--font-mono)] text-xs text-muted">
          // {verdicts.length} claims checked
        </span>
        {confirmed > 0 && (
          <span className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-pine/15 text-pine">
            {confirmed} {VERDICT_LABEL.confirmed}
          </span>
        )}
        {uncertain > 0 && (
          <span className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-uncertain/15 text-uncertain">
            {uncertain} {VERDICT_LABEL.uncertain}
          </span>
        )}
        {contradicted > 0 && (
          <span className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-ember/15 text-ember">
            {contradicted} {VERDICT_LABEL.contradicted}
          </span>
        )}
      </div>
      <button
        onClick={onCopyReport}
        className="font-[family-name:var(--font-mono)] text-xs text-muted hover:text-snow border border-rim px-3 py-1.5 rounded-lg transition-colors hover:border-amber"
      >
        Copy report
      </button>
    </div>
  )
}
