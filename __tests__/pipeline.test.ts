import { runCheck, fetchUrlContent } from '@/lib/pipeline'

jest.mock('@/lib/anthropic', () => ({
  extractClaims: jest.fn(),
  judgeVerdicts: jest.fn()
}))
jest.mock('@/lib/serper', () => ({
  searchClaim: jest.fn()
}))

global.fetch = jest.fn()

const { extractClaims, judgeVerdicts } = require('@/lib/anthropic')
const { searchClaim } = require('@/lib/serper')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('runCheck with text input', () => {
  it('orchestrates extraction, search, and verdict', async () => {
    extractClaims.mockResolvedValue([
      { text: 'The sun is a star.', startIndex: 0, endIndex: 18 }
    ])
    searchClaim.mockResolvedValue([
      { title: 'Sun', link: 'https://nasa.gov', snippet: 'The sun is a G-type star.' }
    ])
    judgeVerdicts.mockResolvedValue([{
      claimIndex: 0,
      verdict: 'confirmed',
      explanation: 'NASA confirms the sun is a star.',
      sources: [{ url: 'https://nasa.gov', title: 'Sun' }]
    }])

    const result = await runCheck('The sun is a star.', 'text')

    expect(extractClaims).toHaveBeenCalledWith('The sun is a star.')
    expect(searchClaim).toHaveBeenCalledWith('The sun is a star.')
    expect(judgeVerdicts).toHaveBeenCalledTimes(1)
    expect(result.claims).toHaveLength(1)
    expect(result.verdicts).toHaveLength(1)
    expect(result.verdicts[0].verdict).toBe('confirmed')
  })

  it('returns empty result when no claims are found', async () => {
    extractClaims.mockResolvedValue([])
    const result = await runCheck('What do you think?', 'text')
    expect(result.claims).toHaveLength(0)
    expect(result.verdicts).toHaveLength(0)
    expect(searchClaim).not.toHaveBeenCalled()
  })

  it('continues pipeline when one searchClaim call fails', async () => {
    extractClaims.mockResolvedValue([
      { text: 'Claim A', startIndex: 0, endIndex: 7 },
      { text: 'Claim B', startIndex: 8, endIndex: 15 }
    ])
    // First search fails, second succeeds
    searchClaim
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce([{ title: 'B', link: 'https://b.com', snippet: 'B info' }])
    judgeVerdicts.mockResolvedValue([
      { claimIndex: 0, verdict: 'uncertain', explanation: 'No results', sources: [] },
      { claimIndex: 1, verdict: 'confirmed', explanation: 'Found it', sources: [] }
    ])

    const result = await runCheck('Claim A Claim B', 'text')

    expect(result.claims).toHaveLength(2)
    expect(result.verdicts).toHaveLength(2)
    // judgeVerdicts should be called with [] for the failed claim
    const callArgs = judgeVerdicts.mock.calls[0]
    expect(callArgs[1][0]).toEqual([]) // first claim gets empty search results
    expect(callArgs[1][1]).toEqual([{ title: 'B', link: 'https://b.com', snippet: 'B info' }])
  })

  it('truncates text to 6000 words before extraction', async () => {
    const words = Array.from({ length: 7000 }, (_, i) => `word${i}`)
    const longText = words.join(' ')
    extractClaims.mockResolvedValue([])

    await runCheck(longText, 'text')

    const calledWith: string = extractClaims.mock.calls[0][0]
    const wordCount = calledWith.split(/\s+/).length
    expect(wordCount).toBe(6000)
  })
})

describe('fetchUrlContent', () => {
  it('extracts readable text from HTML', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => `
        <html><body>
          <nav>Skip nav</nav>
          <main><article>The main article content.</article></main>
          <footer>Skip footer</footer>
        </body></html>
      `
    })
    const text = await fetchUrlContent('https://example.com/article')
    expect(text).toContain('The main article content.')
    expect(text).not.toContain('Skip nav')
    expect(text).not.toContain('Skip footer')
  })

  it('throws on non-ok response', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 })
    await expect(fetchUrlContent('https://example.com/404')).rejects.toThrow('Failed to fetch URL: 404')
  })

  it('falls back to body text when no article or main element exists', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => `
        <html><body>
          <div>Body fallback content</div>
        </body></html>
      `
    })
    const text = await fetchUrlContent('https://example.com/plain')
    expect(text).toContain('Body fallback content')
  })

  it('normalises whitespace in extracted text', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => `<html><body><main>  lots   of   whitespace  </main></body></html>`
    })
    const text = await fetchUrlContent('https://example.com/ws')
    expect(text).not.toMatch(/\s{2,}/)
  })
})
