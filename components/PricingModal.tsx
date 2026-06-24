'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface PricingModalProps {
  onClose: () => void
}

export default function PricingModal({ onClose }: PricingModalProps) {
  const router = useRouter()

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm px-4" onClick={onClose}>
      <div
        className="bg-surface border border-amber rounded-xl shadow-[0_0_60px_rgba(124,58,237,0.25)] p-8 max-w-sm w-full text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-10 bg-ember/15 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-ember text-lg font-bold">!</span>
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-snow text-xl font-bold mb-2">
          Daily limit reached
        </h2>
        <p className="font-[family-name:var(--font-mono)] text-muted text-xs mb-6 leading-relaxed">
          Free accounts get 3 checks per day. Upgrade to Pro for 200 checks per month — that&apos;s a lot of kerfuffles.
        </p>
        <button
          onClick={() => { onClose(); router.push('/pricing') }}
          className="w-full bg-amber hover:bg-violet text-snow font-[family-name:var(--font-display)] font-semibold py-3 rounded-lg text-sm transition-colors mb-3"
        >
          Upgrade to Pro — $15/month
        </button>
        <button
          onClick={onClose}
          className="font-[family-name:var(--font-mono)] w-full text-xs text-muted hover:text-snow transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  )
}
