import Anthropic from '@anthropic-ai/sdk'
import { Claim, ClaimVerdict, SearchResult } from './types'

function getClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export async function extractClaims(text: string): Promise<Claim[]> {
  const client = getClient()
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Extract all hard factual assertions from the text below. Skip opinions, hedged statements ("many experts believe", "some say"), questions, and predictions. Only extract statements that make a concrete, verifiable claim about the world.

Return ONLY valid JSON — no markdown, no explanation — in this exact format:
{"claims": [{"text": "exact claim text as it appears", "startIndex": 0, "endIndex": 50}]}

The startIndex and endIndex must be the character offsets of the claim in the original text.

Text:
${text}`
    }]
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  try {
    const parsed = JSON.parse(content.text)
    return (parsed.claims ?? []) as Claim[]
  } catch {
    return []
  }
}

export async function judgeVerdicts(
  claims: Claim[],
  searchResults: SearchResult[][]
): Promise<ClaimVerdict[]> {
  const client = getClient()
  const claimsWithResults = claims.map((claim, i) => ({
    index: i,
    claim: claim.text,
    webResults: searchResults[i] ?? []
  }))

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `For each claim, judge it against the provided web search results.

Verdict options:
- "confirmed": search results clearly support the claim
- "uncertain": results are conflicting, insufficient, or inconclusive
- "contradicted": results clearly contradict the claim

Return ONLY valid JSON — no markdown, no explanation:
{"verdicts": [{"claimIndex": 0, "verdict": "confirmed", "explanation": "one sentence why", "sources": [{"url": "...", "title": "..."}]}]}

Include at most 3 sources per verdict. Use only sources from the provided web results.

Claims and search results:
${JSON.stringify(claimsWithResults)}`
    }]
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  try {
    const parsed = JSON.parse(content.text)
    return (parsed.verdicts ?? []) as ClaimVerdict[]
  } catch {
    return []
  }
}
