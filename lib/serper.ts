import { SearchResult } from './types'

export async function searchClaim(query: string): Promise<SearchResult[]> {
  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': process.env.SERPER_API_KEY!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ q: query, num: 5 })
  })

  if (!response.ok) throw new Error(`Serper API error: ${response.status}`)

  const data = await response.json()
  return ((data.organic ?? []) as Array<{ title: string; link: string; snippet: string }>)
    .slice(0, 5)
    .map(r => ({ title: r.title, link: r.link, snippet: r.snippet }))
}
