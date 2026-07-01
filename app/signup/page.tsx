'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import VideoBackground from '@/components/VideoBackground'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setConfirmed(true)
  }

  if (confirmed) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <VideoBackground />
      <main className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <Link href="/" className="font-[family-name:var(--font-serif)] text-snow text-3xl italic tracking-tight hover:opacity-80 transition-opacity">
              kerfuffle<sup className="text-xs not-italic">®</sup>
            </Link>
          </div>
          <div className="liquid-glass rounded-2xl p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-pine/20 border border-pine/40 flex items-center justify-center mx-auto mb-4">
              <span className="text-pine text-lg">✓</span>
            </div>
            <h1 className="font-[family-name:var(--font-serif)] italic text-snow text-2xl mb-2">Check your inbox.</h1>
            <p className="text-sm text-muted mb-6">
              We sent a confirmation link to <span className="text-snow">{email}</span>. Click it to activate your account.
            </p>
            <Link
              href="/login"
              className="inline-block w-full bg-violet/20 border border-violet/40 rounded-full px-6 py-3 text-sm text-snow hover:bg-violet/30 transition-colors text-center"
            >
              Go to sign in
            </Link>
          </div>
        </div>
      </main>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <VideoBackground />
      <main className="relative z-10 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="font-[family-name:var(--font-serif)] text-snow text-3xl italic tracking-tight hover:opacity-80 transition-opacity">
            kerfuffle<sup className="text-xs not-italic">®</sup>
          </Link>
          <p className="text-sm text-muted mt-2">3 free checks daily. No card required.</p>
        </div>

        {/* Form card */}
        <div className="liquid-glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="text-xs text-muted uppercase tracking-widest mb-1.5 block">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-ink/60 border border-rim/60 rounded-xl px-4 py-3 text-sm text-snow placeholder:text-muted/40 focus:border-violet/60 focus:outline-none transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-xs text-muted uppercase tracking-widest mb-1.5 block">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-ink/60 border border-rim/60 rounded-xl px-4 py-3 text-sm text-snow placeholder:text-muted/40 focus:border-violet/60 focus:outline-none transition-colors"
                placeholder="Min. 8 characters"
              />
            </div>

            {error && (
              <p className="text-xs text-ember bg-ember/10 border border-ember/30 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet/20 border border-violet/40 rounded-full px-6 py-3 text-sm text-snow hover:bg-violet/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account…' : 'Create free account'}
            </button>
          </form>

          <p className="text-xs text-muted text-center mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-violet hover:text-snow transition-colors">
              Sign in
            </Link>
          </p>
        </div>

      </div>
      </main>
    </div>
  )
}
