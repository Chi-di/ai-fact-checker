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
    <nav className="w-full">
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-3 grid grid-cols-3 items-center">

        {/* Logo — left */}
        <Link href="/" className="font-[family-name:var(--font-serif)] text-snow text-3xl tracking-tight hover:opacity-80 transition-opacity">
          kerfuffle<sup className="text-xs">®</sup>
        </Link>

        {/* Center links */}
        <div className="hidden md:flex items-center justify-center gap-8">
          <Link href="/how-it-works" className="text-sm text-muted hover:text-snow transition-colors">
            How It Works
          </Link>
          <Link href="/pricing" className="text-sm text-muted hover:text-snow transition-colors">
            Pricing
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center justify-end gap-4">
          {userEmail ? (
            <>
              <span className="text-sm text-muted hidden sm:block">{userEmail}</span>
              <button
                onClick={handleSignOut}
                className="text-sm text-muted hover:text-snow transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-muted hover:text-snow transition-colors">Log in</Link>
              <Link
                href="/signup"
                className="liquid-glass rounded-full px-5 py-2 text-sm text-snow whitespace-nowrap hover:scale-[1.03] transition-transform"
              >
                Start free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
