// app/api/check/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { runCheck } from '@/lib/pipeline'
import { checkAndIncrementUsage, getFingerprint } from '@/lib/usage'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Plan } from '@/lib/types'

export async function POST(req: NextRequest) {
  let body: { input?: string; inputType?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { input, inputType } = body

  if (!input || !inputType) {
    return NextResponse.json({ error: 'Missing input or inputType' }, { status: 400 })
  }

  if (input.length > 50_000) {
    return NextResponse.json({ error: 'Input too long (max 50,000 characters)' }, { status: 400 })
  }

  if (inputType !== 'text' && inputType !== 'url') {
    return NextResponse.json({ error: 'inputType must be text or url' }, { status: 400 })
  }

  if (inputType === 'url') {
    let parsed: URL
    try { parsed = new URL(input) } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return NextResponse.json({ error: 'URL must use http or https' }, { status: 400 })
    }
  }

  // Resolve user + plan
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let plan: Plan = 'free'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()
    plan = (profile?.plan as Plan) ?? 'free'
  }

  // Usage check
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const userAgent = req.headers.get('user-agent') ?? ''
  const fingerprint = getFingerprint(ip, userAgent)

  const usage = await checkAndIncrementUsage(user?.id ?? null, fingerprint, plan)

  if (!usage.allowed) {
    return NextResponse.json(
      { error: 'limit_reached', used: usage.used, limit: usage.limit },
      { status: 429 }
    )
  }

  // Run pipeline
  try {
    const result = await runCheck(input, inputType as 'text' | 'url')

    // Log check (fire-and-forget — don't block response)
    const admin = createAdminClient()
    void Promise.resolve(
      admin.from('checks').insert({
        user_id: user?.id ?? null,
        input_type: inputType,
        input_preview: input.slice(0, 100),
        claim_count: result.claims.length
      })
    ).catch(() => {})

    return NextResponse.json({
      ...result,
      usage: { used: usage.used, limit: usage.limit }
    })
  } catch (err) {
    console.error('[/api/check] Pipeline error:', err)
    return NextResponse.json({ error: 'Check failed. Please try again.' }, { status: 500 })
  }
}
