// app/check/page.tsx
import { createClient } from '@/lib/supabase/server'
import CheckPageClient from './CheckPageClient'

export const dynamic = 'force-dynamic'

export default async function CheckPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let plan = 'free'
  let usedToday = 0

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()
    plan = profile?.plan ?? 'free'

    const today = new Date().toISOString().split('T')[0]
    const { data: usage } = await supabase
      .from('daily_usage')
      .select('check_count')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()
    usedToday = usage?.check_count ?? 0
  }

  return (
    <CheckPageClient
      userEmail={user?.email ?? null}
      plan={plan}
      initialUsed={usedToday}
    />
  )
}
