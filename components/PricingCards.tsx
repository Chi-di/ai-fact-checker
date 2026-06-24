'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    features: ['3 checks per day', 'Paste text or URL', 'Inline highlights', 'Source citations'],
    cta: 'Get started free',
    priceId: null as string | null | undefined,
    plan: 'free',
    highlight: false
  },
  {
    name: 'Pro',
    price: '$15',
    period: '/month',
    features: ['200 checks per month', 'Paste text or URL', 'Inline highlights', 'Source citations', 'Check history'],
    cta: 'Start Pro',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID as string | null | undefined,
    plan: 'pro',
    highlight: true
  },
  {
    name: 'Team',
    price: '$39',
    period: '/month',
    features: ['Unlimited checks', 'Paste text or URL', 'Inline highlights', 'Source citations', 'Check history', 'Priority support'],
    cta: 'Start Team',
    priceId: process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID as string | null | undefined,
    plan: 'team',
    highlight: false
  }
]

export default function PricingCards() {
  const router = useRouter()

  async function handlePlanClick(priceId: string | null | undefined, plan: string) {
    if (!priceId) { router.push('/signup'); return }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/signup'); return }

    const { data: profile } = await supabase.from('profiles').select('email').eq('id', user.id).single()

    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, plan, email: profile?.email ?? user.email })
    })
    const { url } = await response.json()
    if (url) window.location.href = url
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {PLANS.map(plan => (
        <div
          key={plan.name}
          className={`relative border p-6 flex flex-col rounded-xl ${
            plan.highlight
              ? 'border-amber bg-surface shadow-[0_0_40px_rgba(124,58,237,0.15)]'
              : 'border-rim bg-surface'
          }`}
        >
          {plan.highlight && (
            <span className="font-[family-name:var(--font-mono)] text-[9px] text-amber uppercase tracking-[0.18em] mb-4 block">
              ✦ Most popular
            </span>
          )}
          <h3 className="font-[family-name:var(--font-display)] text-snow text-xl font-bold mb-1">{plan.name}</h3>
          <div className="mt-1 mb-6 flex items-baseline gap-1">
            <span className="font-[family-name:var(--font-display)] text-snow text-4xl font-bold">{plan.price}</span>
            <span className="font-[family-name:var(--font-mono)] text-muted text-xs">{plan.period}</span>
          </div>
          <ul className="space-y-2.5 mb-8 flex-1">
            {plan.features.map(f => (
              <li key={f} className="flex items-center gap-2.5">
                <span className="font-[family-name:var(--font-mono)] text-pine text-xs">✓</span>
                <span className="font-[family-name:var(--font-mono)] text-sm text-snow/80">{f}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => handlePlanClick(plan.priceId, plan.plan)}
            className={`w-full py-3 font-[family-name:var(--font-display)] font-semibold text-sm rounded-lg transition-colors ${
              plan.highlight
                ? 'bg-amber text-snow hover:bg-violet'
                : 'bg-card text-muted border border-rim hover:border-amber hover:text-snow'
            }`}
          >
            {plan.cta}
          </button>
        </div>
      ))}
    </div>
  )
}
