'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavProps {
  userEmail?: string | null
}

export default function Nav({ userEmail }: NavProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="border-b border-rim bg-ink/80 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-6 h-6 bg-amber rounded flex items-center justify-center text-snow text-xs font-bold animate-spin-slow inline-flex shrink-0">✦</span>
          <span className="font-[family-name:var(--font-display)] text-snow text-lg font-bold tracking-tight">kerfuffle</span>
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/pricing" className="font-[family-name:var(--font-mono)] text-sm text-muted hover:text-snow transition-colors">Pricing</Link>
          {userEmail ? (
            <>
              <span className="font-[family-name:var(--font-mono)] text-xs text-muted hidden sm:block">{userEmail}</span>
              <button
                onClick={handleSignOut}
                className="font-[family-name:var(--font-mono)] text-sm text-muted hover:text-snow transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="font-[family-name:var(--font-mono)] text-sm text-muted hover:text-snow transition-colors">Sign in</Link>
              <Link
                href="/signup"
                className="font-[family-name:var(--font-mono)] text-sm bg-amber text-snow px-4 py-2 font-semibold rounded-lg transition-colors hover:bg-violet"
              >
                Try it free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
