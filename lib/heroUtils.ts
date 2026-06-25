export function detectInputType(input: string): 'text' | 'url' {
  return input.startsWith('https://') || input.startsWith('http://') ? 'url' : 'text'
}

export function parsePendingCheck(
  raw: string
): { input: string; inputType: 'text' | 'url' } | null {
  try {
    const parsed = JSON.parse(raw) as { input?: string; inputType?: 'text' | 'url' }
    if (!parsed.input) return null
    return { input: parsed.input, inputType: parsed.inputType ?? 'text' }
  } catch {
    return null
  }
}
