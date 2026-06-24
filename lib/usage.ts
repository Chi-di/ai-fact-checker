// lib/usage.ts
import { createHash } from 'crypto'
import { createAdminClient } from './supabase/server'
import { Plan, UsageStatus } from './types'

const PRO_MONTHLY_LIMIT = 200
const FREE_DAILY_LIMIT = 3

export function getFingerprint(ip: string, userAgent: string): string {
  return createHash('sha256').update(`${ip}:${userAgent}`).digest('hex').slice(0, 32)
}

export async function checkAndIncrementUsage(
  userId: string | null,
  fingerprint: string,
  plan: Plan
): Promise<UsageStatus> {
  // Unlimited plans — skip all DB checks
  if (plan === 'team' || plan === 'lifetime') {
    return { allowed: true, used: 0, limit: null }
  }

  const supabase = createAdminClient()

  // Pro: count monthly checks from checks table
  if (plan === 'pro' && userId) {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('checks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())

    const used = count ?? 0
    if (used >= PRO_MONTHLY_LIMIT) {
      return { allowed: false, used, limit: PRO_MONTHLY_LIMIT }
    }
    return { allowed: true, used, limit: PRO_MONTHLY_LIMIT }
  }

  // Free: daily_usage table (signed-in user or guest by fingerprint)
  const today = new Date().toISOString().split('T')[0]
  const matchKey = userId ? { user_id: userId, date: today } : { fingerprint, date: today }

  const { data: existing } = await supabase
    .from('daily_usage')
    .select('id, check_count')
    .match(matchKey)
    .single()

  const used = existing?.check_count ?? 0
  const limit = FREE_DAILY_LIMIT

  if (used >= limit) return { allowed: false, used, limit }

  if (existing) {
    await supabase
      .from('daily_usage')
      .update({ check_count: used + 1 })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('daily_usage')
      .insert({ ...matchKey, check_count: 1 })
  }

  return { allowed: true, used: used + 1, limit }
}
