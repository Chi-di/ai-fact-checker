// components/CheckInput.tsx
'use client'
import { useState } from 'react'

interface CheckInputProps {
  onSubmit: (input: string, inputType: 'text' | 'url') => void
  loading: boolean
}

export default function CheckInput({ onSubmit, loading }: CheckInputProps) {
  const [tab, setTab] = useState<'text' | 'url'>('text')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const input = tab === 'text' ? text.trim() : url.trim()
    if (!input) return
    onSubmit(input, tab)
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const isOverLimit = wordCount > 6000

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['text', 'url'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'text' ? 'Paste Text' : 'Check URL'}
          </button>
        ))}
      </div>

      {tab === 'text' ? (
        <div className="relative">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste your AI-generated text here…"
            rows={10}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
          />
          <div className={`absolute bottom-3 right-3 text-xs ${isOverLimit ? 'text-red-500' : 'text-gray-400'}`}>
            {wordCount.toLocaleString()} / 6,000 words
          </div>
        </div>
      ) : (
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://example.com/article"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      )}

      <button
        type="submit"
        disabled={loading || isOverLimit || (tab === 'text' ? !text.trim() : !url.trim())}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
      >
        {loading ? 'Verifying…' : 'Verify Now'}
      </button>
    </form>
  )
}
