// components/PricingCards.tsx
'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
// NOTE: do NOT import from lib/stripe here — it's server-only (STRIPE_SECRET_KEY).
// Checkout is handled via /api/stripe/checkout.

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {PLANS.map(plan => (
        <div
          key={plan.name}
          className={`rounded-2xl border p-6 flex flex-col ${
            plan.highlight
              ? 'border-indigo-500 bg-indigo-50 shadow-md'
              : 'border-gray-200 bg-white'
          }`}
        >
          {plan.highlight && (
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Most popular</span>
          )}
          <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
          <div className="mt-2 mb-6">
            <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
            <span className="text-gray-500 text-sm">{plan.period}</span>
          </div>
          <ul className="space-y-2 mb-8 flex-1">
            {plan.features.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-500">✓</span> {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handlePlanClick(plan.priceId, plan.plan)}
            className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${
              plan.highlight
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            }`}
          >
            {plan.cta}
          </button>
        </div>
      ))}
    </div>
  )
}
