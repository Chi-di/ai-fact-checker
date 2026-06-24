import { extractClaims, judgeVerdicts } from '@/lib/anthropic'
import { Claim, SearchResult } from '@/lib/types'

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn()
    }
  }))
}))

const mockCreate = jest.fn()
beforeEach(() => {
  const Anthropic = require('@anthropic-ai/sdk').default
  Anthropic.mockImplementation(() => ({ messages: { create: mockCreate } }))
  mockCreate.mockReset()
})

describe('extractClaims', () => {
  it('returns parsed claims from Claude response', async () => {
    mockCreate.mockResolvedValue({
      content: [{
        type: 'text',
        text: JSON.stringify({
          claims: [{ text: 'The sky is blue.', startIndex: 0, endIndex: 16 }]
        })
      }]
    })

    const result = await extractClaims('The sky is blue.')
    expect(result).toHaveLength(1)
    expect(result[0].text).toBe('The sky is blue.')
    expect(result[0].startIndex).toBe(0)
    expect(result[0].endIndex).toBe(16)
  })

  it('returns empty array when no claims found', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify({ claims: [] }) }]
    })
    const result = await extractClaims('What do you think?')
    expect(result).toHaveLength(0)
  })

  it('throws if Claude returns non-text content', async () => {
    mockCreate.mockResolvedValue({ content: [{ type: 'tool_use', id: 'x' }] })
    await expect(extractClaims('test')).rejects.toThrow('Unexpected response type')
  })
})

describe('judgeVerdicts', () => {
  it('returns verdicts matching claim indices', async () => {
    const claims: Claim[] = [{ text: 'Earth is flat.', startIndex: 0, endIndex: 14 }]
    const searchResults: SearchResult[][] = [[
      { title: 'Earth is round', link: 'https://nasa.gov', snippet: 'Earth is an oblate spheroid.' }
    ]]

    mockCreate.mockResolvedValue({
      content: [{
        type: 'text',
        text: JSON.stringify({
          verdicts: [{
            claimIndex: 0,
            verdict: 'contradicted',
            explanation: 'Multiple sources confirm Earth is round.',
            sources: [{ url: 'https://nasa.gov', title: 'Earth is round' }]
          }]
        })
      }]
    })

    const result = await judgeVerdicts(claims, searchResults)
    expect(result).toHaveLength(1)
    expect(result[0].verdict).toBe('contradicted')
    expect(result[0].claimIndex).toBe(0)
    expect(result[0].sources).toHaveLength(1)
  })
})
