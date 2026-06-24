// components/PricingModal.tsx
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-4xl mb-4">🚫</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">You&apos;ve hit your daily limit</h2>
        <p className="text-gray-500 text-sm mb-6">
          Free accounts get 3 checks per day. Upgrade to Pro for 200 checks per month.
        </p>
        <button
          onClick={() => { onClose(); router.push('/pricing') }}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors mb-3"
        >
          Upgrade to Pro — $15/month
        </button>
        <button
          onClick={onClose}
          className="w-full text-sm text-gray-500 hover:text-gray-700"
        >
          Maybe later
        </button>
      </div>
    </div>
  )
}
