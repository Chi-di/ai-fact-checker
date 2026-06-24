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
      <div className="flex gap-1 bg-surface border border-rim p-1 rounded-lg w-fit">
        {(['text', 'url'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md font-[family-name:var(--font-mono)] text-xs font-medium transition-colors ${
              tab === t
                ? 'bg-amber text-snow'
                : 'text-muted hover:text-snow'
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
            className="w-full px-4 py-3 bg-surface border border-rim rounded-xl text-snow text-sm resize-none focus:outline-none focus:border-amber transition-colors font-[family-name:var(--font-mono)] placeholder:text-muted/50"
          />
          <div className={`absolute bottom-3 right-3 font-[family-name:var(--font-mono)] text-xs ${isOverLimit ? 'text-ember' : 'text-muted'}`}>
            {wordCount.toLocaleString()} / 6,000 words
          </div>
        </div>
      ) : (
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://example.com/article"
          className="w-full px-4 py-3 bg-surface border border-rim rounded-xl text-snow text-sm focus:outline-none focus:border-amber transition-colors font-[family-name:var(--font-mono)] placeholder:text-muted/50"
        />
      )}

      <button
        type="submit"
        disabled={loading || isOverLimit || (tab === 'text' ? !text.trim() : !url.trim())}
        className="w-full bg-amber hover:bg-violet disabled:opacity-40 text-snow font-[family-name:var(--font-display)] font-semibold py-3 rounded-xl text-sm transition-colors shadow-[0_0_24px_rgba(124,58,237,0.3)]"
      >
        {loading ? 'Catching fibs…' : 'Check your AI →'}
      </button>
    </form>
  )
}
