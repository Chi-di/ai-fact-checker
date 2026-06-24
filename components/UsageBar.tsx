interface UsageBarProps {
  used: number
  limit: number | null
  plan: string
}

export default function UsageBar({ used, limit, plan }: UsageBarProps) {
  if (!limit) return null

  const remaining = Math.max(0, limit - used)
  const isDaily = plan === 'free'
  const period = isDaily ? 'today' : 'this month'

  return (
    <div className={`font-[family-name:var(--font-mono)] text-[11px] tracking-wide px-4 py-2.5 rounded-lg border ${
      remaining === 0
        ? 'bg-ember/10 text-ember border-ember/30'
        : remaining <= 1
        ? 'bg-uncertain/10 text-uncertain border-uncertain/30'
        : 'bg-surface text-muted border-rim'
    }`}>
      {remaining === 0
        ? `You've used all ${limit} free checks ${period}. Upgrade to keep going.`
        : `${remaining} of ${limit} checks remaining ${period}.`}
    </div>
  )
}
