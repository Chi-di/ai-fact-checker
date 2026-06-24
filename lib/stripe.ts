// lib/stripe.ts
import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  return _stripe
}

// Server-side price→plan map — client cannot override this
const PRICE_PLAN_MAP: Record<string, 'pro' | 'team'> = {
  [process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? '']: 'pro',
  [process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID ?? '']: 'team',
}

export function planFromPriceId(priceId: string): 'pro' | 'team' | null {
  return PRICE_PLAN_MAP[priceId] ?? null
}

export async function createCheckoutSession(
  priceId: string,
  userId: string,
  userEmail: string
): Promise<string> {
  const plan = planFromPriceId(priceId)
  if (!plan) throw new Error(`Unknown priceId: ${priceId}`)

  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: userEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId, plan },
    subscription_data: { metadata: { userId, plan } },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/check?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`
  })
  return session.url!
}
