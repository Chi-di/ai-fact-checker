// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string

        if (!userId || !subscriptionId) break

        const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
        const plan = (subscription.metadata.plan as 'pro' | 'team') ?? 'pro'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const periodEnd = (subscription as any).current_period_end as number | undefined

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          plan,
          status: 'active',
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null
        }, { onConflict: 'stripe_subscription_id' })

        await supabase.from('profiles')
          .update({ plan, stripe_customer_id: customerId })
          .eq('id', userId)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const plan = (subscription.metadata.plan as 'pro' | 'team') ?? 'pro'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updatedPeriodEnd = (subscription as any).current_period_end as number | undefined

        await supabase.from('subscriptions')
          .update({
            plan,
            status: subscription.status as 'active' | 'cancelled' | 'past_due',
            current_period_end: updatedPeriodEnd ? new Date(updatedPeriodEnd * 1000).toISOString() : null
          })
          .eq('stripe_subscription_id', subscription.id)

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (sub?.user_id) {
          await supabase.from('profiles').update({ plan }).eq('id', sub.user_id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        await supabase.from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', subscription.id)

        if (sub?.user_id) {
          await supabase.from('profiles').update({ plan: 'free' }).eq('id', sub.user_id)
        }
        break
      }
    }
  } catch (err) {
    console.error('[stripe/webhook] Error processing event:', (event as Stripe.Event).type, err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
