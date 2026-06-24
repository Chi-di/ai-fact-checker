// components/Nav.tsx
'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavProps {
  userEmail?: string | null
}

export default function Nav({ userEmail }: NavProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="border-b border-rim bg-ink/80 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1">
          <span className="font-[family-name:var(--font-display)] text-snow text-xl italic">FactCheck</span>
          <span className="font-[family-name:var(--font-mono)] text-amber text-sm ml-1">[AI]<span className="animate-blink">_</span></span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="font-[family-name:var(--font-mono)] text-sm text-muted hover:text-amber transition-colors">Pricing</Link>
          {userEmail ? (
            <>
              <span className="font-[family-name:var(--font-mono)] text-sm text-muted hidden sm:block">{userEmail}</span>
              <button
                onClick={handleSignOut}
                className="font-[family-name:var(--font-mono)] text-sm text-muted hover:text-amber transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="font-[family-name:var(--font-mono)] text-sm text-muted hover:text-amber transition-colors">Sign in</Link>
              <Link
                href="/signup"
                className="font-[family-name:var(--font-mono)] text-sm bg-amber text-ink px-3 py-1.5 font-semibold transition-colors hover:bg-snow"
              >
                Get started free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
