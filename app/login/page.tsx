'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import VideoBackground from '@/components/VideoBackground'

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
    <div className="relative min-h-screen overflow-hidden">
      <VideoBackground />
      <main className="relative z-10 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="font-[family-name:var(--font-serif)] text-snow text-3xl italic tracking-tight hover:opacity-80 transition-opacity">
            kerfuffle<sup className="text-xs not-italic">®</sup>
          </Link>
          <p className="text-sm text-muted mt-2">Welcome back.</p>
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
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-ink/60 border border-rim/60 rounded-xl px-4 py-3 text-sm text-snow placeholder:text-muted/40 focus:border-violet/60 focus:outline-none transition-colors"
                placeholder="••••••••"
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
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-xs text-muted text-center mt-6">
            No account?{' '}
            <Link href="/signup" className="text-violet hover:text-snow transition-colors">
              Create one free
            </Link>
          </p>
        </div>

      </div>
      </main>
    </div>
  )
}
