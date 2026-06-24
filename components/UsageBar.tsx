// components/UsageBar.tsx
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
    <div className={`text-sm px-3 py-2 rounded-lg ${
      remaining === 0
        ? 'bg-red-50 text-red-700'
        : remaining <= 1
        ? 'bg-yellow-50 text-yellow-700'
        : 'bg-gray-50 text-gray-600'
    }`}>
      <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-wide">
        {remaining === 0
          ? `You've used all ${limit} free checks ${period}.`
          : `${remaining} of ${limit} checks remaining ${period}.`}
      </span>
    </div>
  )
}
