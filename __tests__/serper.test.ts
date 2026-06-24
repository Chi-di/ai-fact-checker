import { searchClaim } from '@/lib/serper'

global.fetch = jest.fn()

beforeEach(() => {
  (fetch as jest.Mock).mockReset()
})

describe('searchClaim', () => {
  it('returns top 5 results from Serper API', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        organic: [
          { title: 'Result 1', link: 'https://a.com', snippet: 'Snippet 1' },
          { title: 'Result 2', link: 'https://b.com', snippet: 'Snippet 2' },
          { title: 'Result 3', link: 'https://c.com', snippet: 'Snippet 3' },
          { title: 'Result 4', link: 'https://d.com', snippet: 'Snippet 4' },
          { title: 'Result 5', link: 'https://e.com', snippet: 'Snippet 5' },
          { title: 'Result 6', link: 'https://f.com', snippet: 'Snippet 6' }
        ]
      })
    })

    const results = await searchClaim('Earth is flat')
    expect(results).toHaveLength(5)
    expect(results[0]).toEqual({ title: 'Result 1', link: 'https://a.com', snippet: 'Snippet 1' })
  })

  it('returns empty array when organic results are missing', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({})
    })
    const results = await searchClaim('obscure query')
    expect(results).toHaveLength(0)
  })

  it('throws on non-ok response', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false, status: 401 })
    await expect(searchClaim('test')).rejects.toThrow('Serper API error: 401')
  })
})
