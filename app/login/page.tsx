'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.push('/check')
    router.refresh()
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
            Access Terminal
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
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="
                  w-full bg-ink border border-rim px-4 py-3
                  font-[family-name:var(--font-mono)] text-sm text-snow
                  placeholder:text-muted/40
                  focus:border-amber focus:outline-none
                  transition-colors duration-200
                "
                placeholder="••••••••"
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
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>

          <p className="font-[family-name:var(--font-mono)] text-xs text-muted text-center mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-amber hover:text-snow transition-colors">
              Create one
            </Link>
          </p>
        </div>

      </div>
    </main>
  )
}
