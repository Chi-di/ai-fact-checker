import * as cheerio from 'cheerio'
import { extractClaims, judgeVerdicts } from './anthropic'
import { searchClaim } from './serper'
import { CheckResult } from './types'

const MAX_WORDS = 6000
const CONCURRENCY = 10

function truncateToWords(text: string, max: number): string {
  const words = text.split(/\s+/)
  return words.length <= max ? text : words.slice(0, max).join(' ')
}

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,  // link-local / AWS metadata
  /^::1$/,        // IPv6 loopback
  /^fc00:/i,      // IPv6 private
  /^fe80:/i,      // IPv6 link-local
]

function isPrivateHost(hostname: string): boolean {
  return PRIVATE_IP_PATTERNS.some(p => p.test(hostname))
}

export async function fetchUrlContent(url: string): Promise<string> {
  const { hostname } = new URL(url)
  if (isPrivateHost(hostname)) throw new Error('URL resolves to a private host')
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FactChecker/1.0)' }
  })
  if (!response.ok) throw new Error(`Failed to fetch URL: ${response.status}`)

  const html = await response.text()
  const $ = cheerio.load(html)

  $('nav, footer, script, style, header, aside, [role="navigation"]').remove()

  const main = $('article, main, [role="main"]').first()
  const rawText = main.length > 0 ? main.text() : $('body').text()

  return rawText.replace(/\s+/g, ' ').trim()
}

export async function runCheck(input: string, inputType: 'text' | 'url'): Promise<CheckResult> {
  let text = inputType === 'url' ? await fetchUrlContent(input) : input
  text = truncateToWords(text, MAX_WORDS)

  const claims = await extractClaims(text)
  if (claims.length === 0) return { claims: [], verdicts: [] }

  // Parallel search with concurrency cap; failures return [] for that claim
  const searchResults: Awaited<ReturnType<typeof searchClaim>>[] = []
  for (let i = 0; i < claims.length; i += CONCURRENCY) {
    const batch = claims.slice(i, i + CONCURRENCY)
    const batchResults = await Promise.all(
      batch.map(claim => searchClaim(claim.text).catch(() => []))
    )
    searchResults.push(...batchResults)
  }

  const verdicts = await judgeVerdicts(claims, searchResults)
  return { claims, verdicts }
}
