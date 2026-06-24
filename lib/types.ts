export type Verdict = 'confirmed' | 'uncertain' | 'contradicted'
export type Plan = 'free' | 'pro' | 'team' | 'lifetime'

export interface Source {
  url: string
  title: string
}

export interface Claim {
  text: string
  startIndex: number
  endIndex: number
}

export interface ClaimVerdict {
  claimIndex: number
  verdict: Verdict
  explanation: string
  sources: Source[]
}

export interface CheckResult {
  claims: Claim[]
  verdicts: ClaimVerdict[]
}

export interface UsageStatus {
  allowed: boolean
  used: number
  limit: number | null
}

export interface SearchResult {
  title: string
  link: string
  snippet: string
}
