import { ClaimVerdict, Verdict } from '@/lib/types'

const VERDICT_CONFIG: Record<Verdict, { label: string; color: string }> = {
  confirmed:    { label: 'Legit',  color: 'text-pine' },
  uncertain:    { label: 'Fuzzy',  color: 'text-uncertain' },
  contradicted: { label: 'Wrong',  color: 'text-ember' },
}

interface ClaimPopoverProps {
  verdict: ClaimVerdict
  onClose: () => void
}

export default function ClaimPopover({ verdict, onClose }: ClaimPopoverProps) {
  const config = VERDICT_CONFIG[verdict.verdict]

  return (
    <span
      className="absolute z-20 left-0 top-full mt-2 w-80 bg-card border border-rim rounded-xl shadow-[0_0_40px_rgba(124,58,237,0.2)] p-4 block"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`font-[family-name:var(--font-mono)] text-[10px] font-bold tracking-[0.15em] uppercase ${config.color}`}>
          {config.label}
        </span>
        <button onClick={onClose} className="text-muted hover:text-snow text-xs transition-colors">✕</button>
      </div>
      <p className="font-[family-name:var(--font-mono)] text-xs text-snow/80 mb-3 leading-relaxed">{verdict.explanation}</p>
      {verdict.sources.length > 0 && (
        <div className="space-y-1.5">
          <p className="font-[family-name:var(--font-mono)] text-[9px] font-medium text-muted uppercase tracking-[0.15em]">Sources</p>
          {verdict.sources.slice(0, 3).map((source, i) => (
            <a
              key={i}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block font-[family-name:var(--font-mono)] text-[10px] text-violet hover:text-snow transition-colors underline underline-offset-2 truncate"
            >
              {source.title || source.url}
            </a>
          ))}
        </div>
      )}
    </span>
  )
}
