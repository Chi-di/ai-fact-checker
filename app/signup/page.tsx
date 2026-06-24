'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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
      <main className="min-h-screen bg-ink flex items-center justify-center p-4">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="mb-8 text-center">
            <span className="font-[family-name:var(--font-display)] text-snow text-2xl italic">FactCheck</span>
            <span className="font-[family-name:var(--font-mono)] text-amber text-sm ml-1">
              [AI]<span className="animate-blink">_</span>
            </span>
          </div>

          <div className="bg-surface border border-rim p-8">
            <div className="h-px bg-amber mb-6" />
            <h1 className="font-[family-name:var(--font-mono)] text-xs text-muted tracking-[0.2em] uppercase mb-4">
              Account Created
            </h1>
            <p className="font-[family-name:var(--font-mono)] text-sm text-snow mb-6">
              Check your email to confirm your account, then sign in to continue.
            </p>
            <Link
              href="/login"
              className="
                relative overflow-hidden inline-flex items-center justify-center w-full px-6 py-3 bg-amber text-ink
                font-[family-name:var(--font-mono)] font-semibold text-sm tracking-wide uppercase
                before:absolute before:inset-0 before:bg-snow before:translate-x-[-101%]
                hover:before:translate-x-0 before:transition-transform before:duration-300
              "
            >
              <span className="relative z-10">Go to Sign In</span>
            </Link>
          </div>

        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="font-[family-name:var(--font-display)] text-snow text-2xl italic">FactCheck</span>
          <span className="font-[family-name:var(--font-mono)] text-amber text-sm ml-1">
            [AI]<span className="animate-blink">_</span>
          </span>
        </div>

        {/* Form card */}
        <div className="bg-surface border border-rim p-8">
          {/* Amber top accent */}
          <div className="h-px bg-amber mb-6" />

          <h1 className="font-[family-name:var(--font-mono)] text-xs text-muted tracking-[0.2em] uppercase mb-6">
            Create Account
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="font-[family-name:var(--font-mono)] text-[10px] text-muted tracking-[0.15em] uppercase mb-1.5 block"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="
                  w-full bg-ink border border-rim px-4 py-3
                  font-[family-name:var(--font-mono)] text-sm text-snow
                  placeholder:text-muted/40
                  focus:border-amber focus:outline-none
                  transition-colors duration-200
                "
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="font-[family-name:var(--font-mono)] text-[10px] text-muted tracking-[0.15em] uppercase mb-1.5 block"
              >
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
                className="
                  w-full bg-ink border border-rim px-4 py-3
                  font-[family-name:var(--font-mono)] text-sm text-snow
                  placeholder:text-muted/40
                  focus:border-amber focus:outline-none
                  transition-colors duration-200
                "
                placeholder="Min. 8 characters"
              />
            </div>

            {error && (
              <div className="border border-ember/30 bg-ember/5 px-4 py-3">
                <p className="font-[family-name:var(--font-mono)] text-xs text-ember">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="
                relative overflow-hidden w-full px-6 py-3 bg-amber text-ink
                font-[family-name:var(--font-mono)] font-semibold text-sm tracking-wide uppercase
                before:absolute before:inset-0 before:bg-snow before:translate-x-[-101%]
                hover:before:translate-x-0 before:transition-transform before:duration-300
                [&>span]:relative [&>span]:z-10
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
            </button>
          </form>

          <p className="font-[family-name:var(--font-mono)] text-xs text-muted text-center mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-amber hover:text-snow transition-colors">
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </main>
  )
}
