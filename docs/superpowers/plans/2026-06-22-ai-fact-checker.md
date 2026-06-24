# AI Fact-Checker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a web app that verifies AI-generated text for hallucinations using inline colour-coded highlights, monetised with Stripe from day one.

**Architecture:** Next.js 14 App Router frontend + API routes. Claude claude-sonnet-4-6 extracts factual claims and judges verdicts. Serper.dev runs parallel Google searches per claim. Supabase handles auth + usage tracking. Stripe handles subscriptions.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase, Stripe, Anthropic SDK, Serper.dev, Cheerio, Vercel

## Global Constraints

- Next.js 14 with App Router — no Pages Router
- TypeScript strict mode throughout
- Tailwind CSS for all styling — no CSS modules or inline styles
- All Supabase calls in API routes use the server client; browser client only in client components
- Claude model: `claude-sonnet-4-6` — do not substitute
- Free tier: 3 checks/day. Pro: $15/month, 200 checks/month. Team: $39/month, unlimited.
- Results are never persisted — ephemeral per request
- No OAuth at launch — email/password only
- All files live under `ai-fact-checker/` — this is the project root

---

## Design System — Intelligence Briefing Aesthetic

**Concept:** Forensic editorial tool. Investigative journalism meets intelligence analysis. Dark, precise, authoritative. Every element feels like a serious annotated document, not a SaaS dashboard.

### Fonts — install via `next/font/google`

```typescript
import { Fraunces, Geist_Mono } from 'next/font/google'

// Display / headlines — variable optical-size serif, editorial authority
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  axes: ['opsz', 'SOFT', 'WONK'],
})

// Body / UI — technical precision
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})
```

Apply both variables to `<body>`: `className={`${fraunces.variable} ${geistMono.variable}`}`

Use `font-[family-name:var(--font-display)]` for headings, `font-[family-name:var(--font-mono)]` for body, labels, and UI text.

### Colour Tokens — add to `tailwind.config.js`

```js
colors: {
  ink:     '#0C0C10',   // page background
  surface: '#16161C',   // card / panel background
  rim:     '#26262E',   // borders
  snow:    '#F2EFE8',   // primary text (warm cream — not pure white)
  muted:   '#8A8A96',   // secondary text
  amber:   '#F0C040',   // primary accent (highlighter yellow)
  pine:    '#3DDC84',   // confirmed
  ember:   '#FF5C5C',   // contradicted
  // uncertain uses amber
}
```

Add to `globals.css`:
```css
:root {
  --font-display: 'Fraunces', Georgia, serif;
  --font-mono: 'Geist Mono', 'Courier New', monospace;
}
body {
  background: #0C0C10;
  color: #F2EFE8;
}
/* Subtle noise texture overlay */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 9999;
  opacity: 0.4;
}
```

### Button Variants

**Primary button** — amber fill, dark text, zero border-radius, left-to-right hover fill:
```tsx
// Achieved with Tailwind gradient trick
<button className="
  relative overflow-hidden px-6 py-3 bg-amber text-ink font-[family-name:var(--font-mono)]
  font-semibold text-sm tracking-wide uppercase
  before:absolute before:inset-0 before:bg-snow before:translate-x-[-101%]
  hover:before:translate-x-0 before:transition-transform before:duration-300
  transition-colors [&>span]:relative [&>span]:z-10
">
  <span>Verify Now</span>
</button>
```

**Ghost button** — 1px amber border, transparent bg, amber text on hover:
```tsx
<button className="
  px-5 py-2.5 border border-rim text-muted font-[family-name:var(--font-mono)]
  text-xs tracking-widest uppercase
  hover:border-amber hover:text-amber transition-colors duration-200
">
  Copy Report
</button>
```

### Claim Highlight Marks

NOT rounded background fills. Instead: bold underline + left marker dot:
```tsx
// confirmed
'relative border-b-2 border-pine cursor-pointer group'
// uncertain  
'relative border-b-2 border-amber cursor-pointer group'
// contradicted
'relative border-b-2 border-ember cursor-pointer group'
```

Each `<mark>` gets a small coloured dot at its left edge using `::before`:
```css
mark::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
}
```

### Verdict Popover

Classified briefing card — dark surface, amber header line, monospace body:
```tsx
<div className="
  absolute z-20 left-0 top-full mt-2 w-76 
  bg-surface border border-rim
  shadow-[0_8px_32px_rgba(0,0,0,0.6)]
  p-4
">
  <div className="border-l-2 border-amber pl-3 mb-3">
    <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.15em] uppercase text-amber">
      {verdict.toUpperCase()}
    </span>
  </div>
  <p className="font-[family-name:var(--font-mono)] text-xs text-snow/80 leading-relaxed mb-3">
    {explanation}
  </p>
  {/* sources */}
</div>
```

### Loading State

Typewriter stepping — each step types out letter-by-letter using CSS animation:
```tsx
// Each step label gets a typing animation
// Use a key prop to restart when step changes
<p key={loadingStep} className="
  font-[family-name:var(--font-mono)] text-xs text-amber tracking-wide
  overflow-hidden whitespace-nowrap
  animate-[typing_1.2s_steps(40,end)]
  border-r-2 border-amber animate-[blink_0.75s_step-end_infinite]
">
  {LOADING_STEPS[loadingStep]}
</p>
```

Add to `tailwind.config.js`:
```js
keyframes: {
  typing: {
    from: { width: '0' },
    to: { width: '100%' },
  },
  blink: {
    '0%, 100%': { borderColor: 'transparent' },
    '50%': { borderColor: '#F0C040' },
  },
  'slide-up': {
    from: { opacity: '0', transform: 'translateY(8px)' },
    to: { opacity: '1', transform: 'translateY(0)' },
  },
  'fade-in': {
    from: { opacity: '0' },
    to: { opacity: '1' },
  },
},
animation: {
  typing: 'typing 1.2s steps(40, end)',
  blink: 'blink 0.75s step-end infinite',
  'slide-up': 'slide-up 0.2s ease-out',
  'fade-in': 'fade-in 0.4s ease-out',
},
```

### Nav

Logo: `Fact` in Fraunces serif + `Check` in Fraunces + `[AI]` in Geist Mono with blinking amber cursor:
```tsx
<span className="font-[family-name:var(--font-display)] text-snow text-xl italic">FactCheck</span>
<span className="font-[family-name:var(--font-mono)] text-amber text-sm ml-1">[AI]<span className="animate-blink">_</span></span>
```

Thin 1px bottom border `border-rim`. Dark `bg-ink/80` with `backdrop-blur-sm`.

### Summary Bar

Dossier header — left-aligned label + right-aligned counts as monospace tags:
```tsx
<div className="flex items-center justify-between border border-rim p-3 bg-surface">
  <span className="font-[family-name:var(--font-mono)] text-[10px] text-muted tracking-[0.15em] uppercase">
    Analysis Complete — {total} claims
  </span>
  <div className="flex gap-3">
    <span className="font-[family-name:var(--font-mono)] text-[11px] text-pine">{confirmed} confirmed</span>
    <span className="font-[family-name:var(--font-mono)] text-[11px] text-amber">{uncertain} uncertain</span>
    <span className="font-[family-name:var(--font-mono)] text-[11px] text-ember">{contradicted} contradicted</span>
  </div>
</div>
```

### Usage Bar

Amber progress line with monospace counter:
```tsx
<div className="space-y-1">
  <div className="h-px bg-rim w-full">
    <div
      className="h-px bg-amber transition-all duration-500"
      style={{ width: `${(used / limit) * 100}%` }}
    />
  </div>
  <span className="font-[family-name:var(--font-mono)] text-[10px] text-muted tracking-wide">
    {remaining} checks remaining today
  </span>
</div>
```

### Pricing Cards

No rounded cards. Sharp-cornered panels with amber accent on the recommended tier:
- Default: `border border-rim bg-surface`
- Highlighted: `border border-amber bg-surface` with a thin amber top bar `border-t-2 border-amber`
- Price in Fraunces Display, features in Geist Mono

### Auth Forms

Document-style forms on dark background. Input fields: no border-radius, `border-b border-rim` only (underline style), amber focus indicator.

---

## File Map

```
ai-fact-checker/
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── middleware.ts                          # Supabase session refresh
├── .env.local.example
├── app/
│   ├── layout.tsx                         # Root layout + fonts
│   ├── page.tsx                           # Landing page
│   ├── check/
│   │   ├── page.tsx                       # Server component: resolves user + plan, passes to client
│   │   └── CheckPageClient.tsx            # Client component: input, loading, results, upgrade gate
│   ├── pricing/
│   │   └── page.tsx                       # Pricing tiers
│   ├── login/
│   │   └── page.tsx                       # Login form
│   ├── signup/
│   │   └── page.tsx                       # Signup form
│   └── api/
│       ├── check/
│       │   └── route.ts                   # POST: run check pipeline
│       └── stripe/
│           └── webhook/
│               └── route.ts              # POST: Stripe events
├── components/
│   ├── Nav.tsx                            # Top nav with auth state
│   ├── CheckInput.tsx                     # Paste/URL tab switcher + submit
│   ├── HighlightedText.tsx                # Renders text with coloured claim spans
│   ├── ClaimPopover.tsx                   # Verdict + sources popover
│   ├── SummaryBar.tsx                     # "N claims — X confirmed..." 
│   ├── UsageBar.tsx                       # "2 of 3 checks remaining"
│   ├── PricingCards.tsx                   # Three plan tier cards
│   └── PricingModal.tsx                   # Upgrade gate modal
├── lib/
│   ├── types.ts                           # All shared TypeScript types
│   ├── supabase/
│   │   ├── client.ts                      # Browser Supabase client
│   │   └── server.ts                      # Server + admin Supabase clients
│   ├── anthropic.ts                       # extractClaims + judgeVerdicts
│   ├── serper.ts                          # searchClaim
│   ├── pipeline.ts                        # fetchUrlContent + runCheck
│   ├── usage.ts                           # checkAndIncrementUsage + getFingerprint
│   └── stripe.ts                          # Stripe client + createCheckoutSession
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
└── __tests__/
    ├── anthropic.test.ts
    ├── serper.test.ts
    ├── pipeline.test.ts
    └── usage.test.ts
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `ai-fact-checker/package.json`
- Create: `ai-fact-checker/next.config.js`
- Create: `ai-fact-checker/tailwind.config.js`
- Create: `ai-fact-checker/tsconfig.json`
- Create: `ai-fact-checker/.env.local.example`
- Create: `ai-fact-checker/postcss.config.js`

**Interfaces:**
- Produces: runnable Next.js 14 dev server at `localhost:3000`

- [ ] **Step 1: Initialise Next.js project**

Run from `claude-code-projects/`:
```bash
cd ai-fact-checker
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```
When prompted, accept all defaults.

- [ ] **Step 2: Install dependencies**

```bash
npm install @anthropic-ai/sdk @supabase/supabase-js @supabase/ssr stripe cheerio
npm install -D @types/cheerio jest @types/jest ts-jest jest-environment-node
```

- [ ] **Step 3: Create `.env.local.example`**

```bash
cat > .env.local.example << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
SERPER_API_KEY=your_serper_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_signing_secret
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxx
NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID=price_xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
```

Copy and fill in `.env.local` — do not commit it.

- [ ] **Step 4: Add Jest config**

Add to `package.json` (merge with existing scripts):
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "moduleNameMapper": {
      "^@/(.*)$": "<rootDir>/$1"
    },
    "testMatch": ["**/__tests__/**/*.test.ts"]
  }
}
```

- [ ] **Step 5: Verify scaffold**

```bash
npm run dev
```
Expected: Next.js dev server starts at `http://localhost:3000` with no errors.

- [ ] **Step 6: Commit**

```bash
git add ai-fact-checker/
git commit -m "feat: scaffold Next.js 14 project for ai-fact-checker"
```

---

### Task 2: Shared Types + Supabase Schema

**Files:**
- Create: `lib/types.ts`
- Create: `supabase/migrations/001_initial_schema.sql`

**Interfaces:**
- Produces: `Claim`, `ClaimVerdict`, `CheckResult`, `UsageStatus`, `Plan`, `Source` — imported by all subsequent tasks

- [ ] **Step 1: Create `lib/types.ts`**

```typescript
// lib/types.ts
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
```

- [ ] **Step 2: Create `supabase/migrations/001_initial_schema.sql`**

```sql
-- profiles (extends auth.users)
CREATE TABLE profiles (
  id                 uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email              text NOT NULL,
  plan               text NOT NULL DEFAULT 'free'
                     CHECK (plan IN ('free', 'pro', 'team', 'lifetime')),
  stripe_customer_id text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- checks (one row per verification run)
CREATE TABLE checks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  input_type    text NOT NULL CHECK (input_type IN ('text', 'url')),
  input_preview text,
  claim_count   int,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own checks"
  ON checks FOR SELECT USING (auth.uid() = user_id);

-- daily_usage (tracks free tier limits)
CREATE TABLE daily_usage (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint  text,
  user_id      uuid REFERENCES profiles(id) ON DELETE CASCADE,
  date         date NOT NULL,
  check_count  int NOT NULL DEFAULT 0,
  UNIQUE (fingerprint, date),
  UNIQUE (user_id, date)
);

ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;
-- Service role bypasses RLS for usage tracking

-- subscriptions
CREATE TABLE subscriptions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE,
  plan                   text NOT NULL CHECK (plan IN ('pro', 'team')),
  status                 text NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due')),
  current_period_end     timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own subscriptions"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);
```

- [ ] **Step 3: Run migration in Supabase**

Go to your Supabase project dashboard → SQL Editor → paste the contents of `001_initial_schema.sql` → Run.

Expected: All 4 tables created with no errors. Verify in Table Editor.

- [ ] **Step 4: Commit**

```bash
git add ai-fact-checker/lib/types.ts ai-fact-checker/supabase/
git commit -m "feat: add shared types and Supabase schema migration"
```

---

### Task 3: Supabase Clients + Auth Middleware

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `middleware.ts`

**Interfaces:**
- Produces: `createBrowserClient()` (client components), `createServerClient()` (API routes/server components), `createAdminClient()` (webhook, bypasses RLS)

- [ ] **Step 1: Create browser client `lib/supabase/client.ts`**

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Create server client `lib/supabase/server.ts`**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        }
      }
    }
  )
}

// Admin client — bypasses RLS. Only use in API routes, never client-side.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

- [ ] **Step 3: Create `middleware.ts`**

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        }
      }
    }
  )

  await supabase.auth.getUser()
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
```

- [ ] **Step 4: Verify clients compile**

```bash
npx tsc --noEmit
```
Expected: No TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add ai-fact-checker/lib/supabase/ ai-fact-checker/middleware.ts
git commit -m "feat: add Supabase browser/server clients and auth middleware"
```

---

### Task 4: Claude API Wrapper

**Files:**
- Create: `lib/anthropic.ts`
- Create: `__tests__/anthropic.test.ts`

**Interfaces:**
- Consumes: `Claim`, `ClaimVerdict`, `SearchResult` from `lib/types.ts`
- Produces:
  - `extractClaims(text: string): Promise<Claim[]>`
  - `judgeVerdicts(claims: Claim[], searchResults: SearchResult[][]): Promise<ClaimVerdict[]>`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/anthropic.test.ts
import { extractClaims, judgeVerdicts } from '@/lib/anthropic'
import { Claim, SearchResult } from '@/lib/types'

jest.mock('@anthropic-ai/sdk', () => ({
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern=anthropic
```
Expected: FAIL — `Cannot find module '@/lib/anthropic'`

- [ ] **Step 3: Implement `lib/anthropic.ts`**

```typescript
// lib/anthropic.ts
import Anthropic from '@anthropic-ai/sdk'
import { Claim, ClaimVerdict, SearchResult } from './types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function extractClaims(text: string): Promise<Claim[]> {
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern=anthropic
```
Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add ai-fact-checker/lib/anthropic.ts ai-fact-checker/__tests__/anthropic.test.ts
git commit -m "feat: add Claude API wrapper for claim extraction and verdict judgement"
```

---

### Task 5: Serper Search Wrapper

**Files:**
- Create: `lib/serper.ts`
- Create: `__tests__/serper.test.ts`

**Interfaces:**
- Consumes: `SearchResult` from `lib/types.ts`
- Produces: `searchClaim(query: string): Promise<SearchResult[]>`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/serper.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern=serper
```
Expected: FAIL — `Cannot find module '@/lib/serper'`

- [ ] **Step 3: Implement `lib/serper.ts`**

```typescript
// lib/serper.ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern=serper
```
Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add ai-fact-checker/lib/serper.ts ai-fact-checker/__tests__/serper.test.ts
git commit -m "feat: add Serper.dev search wrapper"
```

---

### Task 6: Core Pipeline

**Files:**
- Create: `lib/pipeline.ts`
- Create: `__tests__/pipeline.test.ts`

**Interfaces:**
- Consumes: `extractClaims()` from `lib/anthropic.ts`, `judgeVerdicts()` from `lib/anthropic.ts`, `searchClaim()` from `lib/serper.ts`
- Produces: `runCheck(input: string, inputType: 'text' | 'url'): Promise<CheckResult>`, `fetchUrlContent(url: string): Promise<string>`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/pipeline.test.ts
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
})

describe('fetchUrlContent', () => {
  it('extracts readable text from HTML', async () => {
    (fetch as jest.Mock).mockResolvedValue({
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
    (fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 })
    await expect(fetchUrlContent('https://example.com/404')).rejects.toThrow('Failed to fetch URL: 404')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern=pipeline
```
Expected: FAIL — `Cannot find module '@/lib/pipeline'`

- [ ] **Step 3: Implement `lib/pipeline.ts`**

```typescript
// lib/pipeline.ts
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

export async function fetchUrlContent(url: string): Promise<string> {
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

  // Parallel search with concurrency cap
  const searchResults = []
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern=pipeline
```
Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add ai-fact-checker/lib/pipeline.ts ai-fact-checker/__tests__/pipeline.test.ts
git commit -m "feat: add core check pipeline (URL fetch, claim extraction, search, verdict)"
```

---

### Task 7: Usage Enforcement

**Files:**
- Create: `lib/usage.ts`
- Create: `__tests__/usage.test.ts`

**Interfaces:**
- Consumes: `Plan` from `lib/types.ts`, `createAdminClient()` from `lib/supabase/server.ts`
- Produces:
  - `getFingerprint(ip: string, userAgent: string): string`
  - `checkAndIncrementUsage(userId: string | null, fingerprint: string, plan: Plan): Promise<UsageStatus>`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/usage.test.ts
import { getFingerprint, checkAndIncrementUsage } from '@/lib/usage'

jest.mock('@/lib/supabase/server', () => ({
  createAdminClient: jest.fn()
}))

const mockFrom = jest.fn()
const mockSupabase = { from: mockFrom }

beforeEach(() => {
  jest.resetAllMocks()
  const { createAdminClient } = require('@/lib/supabase/server')
  createAdminClient.mockReturnValue(mockSupabase)
})

describe('getFingerprint', () => {
  it('returns a 32-char hex string', () => {
    const fp = getFingerprint('1.2.3.4', 'Mozilla/5.0')
    expect(fp).toHaveLength(32)
    expect(fp).toMatch(/^[a-f0-9]+$/)
  })

  it('returns the same fingerprint for same inputs', () => {
    const a = getFingerprint('1.2.3.4', 'Mozilla/5.0')
    const b = getFingerprint('1.2.3.4', 'Mozilla/5.0')
    expect(a).toBe(b)
  })

  it('returns different fingerprints for different IPs', () => {
    const a = getFingerprint('1.2.3.4', 'Mozilla/5.0')
    const b = getFingerprint('5.6.7.8', 'Mozilla/5.0')
    expect(a).not.toBe(b)
  })
})

describe('checkAndIncrementUsage', () => {
  it('returns allowed: true and no limit for team plan', async () => {
    const result = await checkAndIncrementUsage('user-1', 'fp-1', 'team')
    expect(result.allowed).toBe(true)
    expect(result.limit).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('blocks free user who has used 3 checks today', async () => {
    const mockSelect = jest.fn().mockReturnThis()
    const mockMatch = jest.fn().mockReturnThis()
    const mockSingle = jest.fn().mockResolvedValue({
      data: { id: 'row-1', check_count: 3 }
    })
    mockFrom.mockReturnValue({ select: mockSelect, match: mockMatch, single: mockSingle })

    const result = await checkAndIncrementUsage('user-1', 'fp-1', 'free')
    expect(result.allowed).toBe(false)
    expect(result.used).toBe(3)
    expect(result.limit).toBe(3)
  })

  it('increments count and allows free user with 2 checks used', async () => {
    const mockUpdate = jest.fn().mockReturnThis()
    const mockEq = jest.fn().mockResolvedValue({ error: null })
    const mockSelect = jest.fn().mockReturnThis()
    const mockMatch = jest.fn().mockReturnThis()
    const mockSingle = jest.fn().mockResolvedValue({
      data: { id: 'row-1', check_count: 2 }
    })
    mockFrom.mockReturnValue({
      select: mockSelect,
      match: mockMatch,
      single: mockSingle,
      update: mockUpdate,
      eq: mockEq
    })

    const result = await checkAndIncrementUsage('user-1', 'fp-1', 'free')
    expect(result.allowed).toBe(true)
    expect(result.used).toBe(3)
    expect(result.limit).toBe(3)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern=usage
```
Expected: FAIL — `Cannot find module '@/lib/usage'`

- [ ] **Step 3: Implement `lib/usage.ts`**

```typescript
// lib/usage.ts
import { createHash } from 'crypto'
import { createAdminClient } from './supabase/server'
import { Plan, UsageStatus } from './types'

const DAILY_LIMITS: Record<string, number | null> = {
  free: 3,
  pro: null,    // pro uses monthly limit, handled separately
  team: null,
  lifetime: null
}

const PRO_MONTHLY_LIMIT = 200

export function getFingerprint(ip: string, userAgent: string): string {
  return createHash('sha256').update(`${ip}:${userAgent}`).digest('hex').slice(0, 32)
}

export async function checkAndIncrementUsage(
  userId: string | null,
  fingerprint: string,
  plan: Plan
): Promise<UsageStatus> {
  // Unlimited plans — skip all DB checks
  if (plan === 'team' || plan === 'lifetime') {
    return { allowed: true, used: 0, limit: null }
  }

  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // Pro: count monthly checks from checks table
  if (plan === 'pro' && userId) {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('checks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())

    const used = count ?? 0
    if (used >= PRO_MONTHLY_LIMIT) {
      return { allowed: false, used, limit: PRO_MONTHLY_LIMIT }
    }
    return { allowed: true, used, limit: PRO_MONTHLY_LIMIT }
  }

  // Free: daily_usage table
  const matchKey = userId ? { user_id: userId, date: today } : { fingerprint, date: today }

  const { data: existing } = await supabase
    .from('daily_usage')
    .select('id, check_count')
    .match(matchKey)
    .single()

  const used = existing?.check_count ?? 0
  const limit = 3

  if (used >= limit) return { allowed: false, used, limit }

  if (existing) {
    await supabase
      .from('daily_usage')
      .update({ check_count: used + 1 })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('daily_usage')
      .insert({ ...matchKey, check_count: 1 })
  }

  return { allowed: true, used: used + 1, limit }
}
```

- [ ] **Step 4: Run all tests**

```bash
npm test
```
Expected: PASS — all tests in all files passing

- [ ] **Step 5: Commit**

```bash
git add ai-fact-checker/lib/usage.ts ai-fact-checker/__tests__/usage.test.ts
git commit -m "feat: add usage enforcement for free/pro/team plans"
```

---

### Task 8: API Routes

**Files:**
- Create: `app/api/check/route.ts`
- Create: `app/api/stripe/webhook/route.ts`
- Create: `lib/stripe.ts`

**Interfaces:**
- Consumes: `runCheck()` from `lib/pipeline.ts`, `checkAndIncrementUsage()` from `lib/usage.ts`, `createClient()` + `createAdminClient()` from `lib/supabase/server.ts`
- Produces:
  - `POST /api/check` → `{ claims, verdicts, usage: { used, limit } }` or `{ error, used?, limit? }`
  - `POST /api/stripe/webhook` → `{ received: true }`
  - `createCheckoutSession(priceId: string, userId: string, plan: string): Promise<string>` (returns Checkout URL)

- [ ] **Step 1: Create `lib/stripe.ts`**

```typescript
// lib/stripe.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function createCheckoutSession(
  priceId: string,
  userId: string,
  plan: string,
  userEmail: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: userEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId, plan },
    subscription_data: { metadata: { userId, plan } },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/check?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`
  })
  return session.url!
}
```

- [ ] **Step 2: Create `app/api/check/route.ts`**

```typescript
// app/api/check/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { runCheck } from '@/lib/pipeline'
import { checkAndIncrementUsage, getFingerprint } from '@/lib/usage'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Plan } from '@/lib/types'

export async function POST(req: NextRequest) {
  let body: { input?: string; inputType?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { input, inputType } = body

  if (!input || !inputType) {
    return NextResponse.json({ error: 'Missing input or inputType' }, { status: 400 })
  }

  if (inputType !== 'text' && inputType !== 'url') {
    return NextResponse.json({ error: 'inputType must be text or url' }, { status: 400 })
  }

  if (inputType === 'url') {
    try { new URL(input) } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }
  }

  // Resolve user + plan
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let plan: Plan = 'free'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()
    plan = (profile?.plan as Plan) ?? 'free'
  }

  // Usage check
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const userAgent = req.headers.get('user-agent') ?? ''
  const fingerprint = getFingerprint(ip, userAgent)

  const usage = await checkAndIncrementUsage(user?.id ?? null, fingerprint, plan)

  if (!usage.allowed) {
    return NextResponse.json(
      { error: 'limit_reached', used: usage.used, limit: usage.limit },
      { status: 429 }
    )
  }

  // Run pipeline
  try {
    const result = await runCheck(input, inputType as 'text' | 'url')

    // Log check (fire-and-forget — don't block response)
    const admin = createAdminClient()
    admin.from('checks').insert({
      user_id: user?.id ?? null,
      input_type: inputType,
      input_preview: input.slice(0, 100),
      claim_count: result.claims.length
    }).then(() => {}).catch(() => {})

    return NextResponse.json({
      ...result,
      usage: { used: usage.used, limit: usage.limit }
    })
  } catch (err) {
    console.error('[/api/check] Pipeline error:', err)
    return NextResponse.json({ error: 'Check failed. Please try again.' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Create `app/api/stripe/webhook/route.ts`**

```typescript
// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.CheckoutSession
        const userId = session.metadata?.userId
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string

        if (!userId || !subscriptionId) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const plan = (subscription.metadata.plan as 'pro' | 'team') ?? 'pro'

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          plan,
          status: 'active',
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
        }, { onConflict: 'stripe_subscription_id' })

        await supabase.from('profiles')
          .update({ plan, stripe_customer_id: customerId })
          .eq('id', userId)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const plan = (subscription.metadata.plan as 'pro' | 'team') ?? 'pro'

        await supabase.from('subscriptions')
          .update({
            plan,
            status: subscription.status as 'active' | 'cancelled' | 'past_due',
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (sub?.user_id) {
          await supabase.from('profiles').update({ plan }).eq('id', sub.user_id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        await supabase.from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', subscription.id)

        if (sub?.user_id) {
          await supabase.from('profiles').update({ plan: 'free' }).eq('id', sub.user_id)
        }
        break
      }
    }
  } catch (err) {
    console.error('[stripe/webhook] Error processing event:', event.type, err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
```

- [ ] **Step 4: Set up Stripe products**

In the Stripe dashboard (or CLI):
```bash
# Create Pro product + price
stripe products create --name="Pro" --description="200 fact-checks per month"
stripe prices create --unit-amount=1500 --currency=usd --recurring[interval]=month --product=<pro_product_id>

# Create Team product + price
stripe products create --name="Team" --description="Unlimited fact-checks"
stripe prices create --unit-amount=3900 --currency=usd --recurring[interval]=month --product=<team_product_id>
```

Add the price IDs to `.env.local`:
```
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID=price_...
```

- [ ] **Step 5: Verify API route compiles**

```bash
npx tsc --noEmit
```
Expected: No TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add ai-fact-checker/lib/stripe.ts ai-fact-checker/app/api/
git commit -m "feat: add /api/check route, Stripe client, and webhook handler"
```

---

### Task 9: Auth Pages

**Files:**
- Create: `app/login/page.tsx`
- Create: `app/signup/page.tsx`

**Interfaces:**
- Consumes: `createClient()` from `lib/supabase/client.ts`
- Produces: Working login and signup forms that redirect to `/check` on success

- [ ] **Step 1: Create `app/login/page.tsx`**

```tsx
// app/login/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.push('/check')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign in</h1>
        <p className="text-sm text-gray-500 mb-6">
          No account?{' '}
          <Link href="/signup" className="text-indigo-600 hover:underline">Sign up free</Link>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/signup/page.tsx`**

```tsx
// app/signup/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.push('/check')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create account</h1>
        <p className="text-sm text-gray-500 mb-6">
          Already have one?{' '}
          <Link href="/login" className="text-indigo-600 hover:underline">Sign in</Link>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Creating account…' : 'Create account — it\'s free'}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-4 text-center">
          3 free checks per day. No credit card required.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```
Navigate to `http://localhost:3000/signup`. Sign up with a test email. Verify redirect to `/check` succeeds. Navigate to `http://localhost:3000/login`. Sign in. Verify redirect works.

- [ ] **Step 4: Commit**

```bash
git add ai-fact-checker/app/login/ ai-fact-checker/app/signup/
git commit -m "feat: add login and signup pages with Supabase auth"
```

---

### Task 10: Core UI Components

**Files:**
- Create: `components/Nav.tsx`
- Create: `components/CheckInput.tsx`
- Create: `components/UsageBar.tsx`
- Create: `components/SummaryBar.tsx`
- Create: `components/ClaimPopover.tsx`
- Create: `components/HighlightedText.tsx`
- Create: `components/PricingCards.tsx`
- Create: `components/PricingModal.tsx`

**Interfaces:**
- Consumes: `Claim`, `ClaimVerdict`, `Verdict`, `UsageStatus` from `lib/types.ts`
- Produces: All visual components consumed by the check page and landing page

- [ ] **Step 1: Create `components/Nav.tsx`**

```tsx
// components/Nav.tsx
'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavProps {
  userEmail?: string | null
}

export default function Nav({ userEmail }: NavProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-gray-900 text-lg tracking-tight">
          FactCheck<span className="text-indigo-600">AI</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link>
          {userEmail ? (
            <>
              <span className="text-sm text-gray-500 hidden sm:block">{userEmail}</span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">Sign in</Link>
              <Link
                href="/signup"
                className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                Get started free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Create `components/CheckInput.tsx`**

```tsx
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
```

- [ ] **Step 3: Create `components/UsageBar.tsx`**

```tsx
// components/UsageBar.tsx
interface UsageBarProps {
  used: number
  limit: number | null
  plan: string
}

export default function UsageBar({ used, limit, plan }: UsageBarProps) {
  if (!limit) return null

  const remaining = Math.max(0, limit - used)
  const isDaily = plan === 'free'
  const period = isDaily ? 'today' : 'this month'

  return (
    <div className={`text-sm px-3 py-2 rounded-lg ${
      remaining === 0
        ? 'bg-red-50 text-red-700'
        : remaining <= 1
        ? 'bg-yellow-50 text-yellow-700'
        : 'bg-gray-50 text-gray-600'
    }`}>
      {remaining === 0
        ? `You've used all ${limit} free checks ${period}.`
        : `${remaining} of ${limit} checks remaining ${period}.`}
    </div>
  )
}
```

- [ ] **Step 4: Create `components/SummaryBar.tsx`**

```tsx
// components/SummaryBar.tsx
import { ClaimVerdict } from '@/lib/types'

interface SummaryBarProps {
  verdicts: ClaimVerdict[]
  onCopyReport: () => void
}

export default function SummaryBar({ verdicts, onCopyReport }: SummaryBarProps) {
  const confirmed = verdicts.filter(v => v.verdict === 'confirmed').length
  const uncertain = verdicts.filter(v => v.verdict === 'uncertain').length
  const contradicted = verdicts.filter(v => v.verdict === 'contradicted').length

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center gap-4 text-sm">
        <span className="font-medium text-gray-700">{verdicts.length} claims checked</span>
        <span className="flex items-center gap-1 text-green-700">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
          {confirmed} confirmed
        </span>
        <span className="flex items-center gap-1 text-yellow-700">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
          {uncertain} uncertain
        </span>
        <span className="flex items-center gap-1 text-red-700">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
          {contradicted} contradicted
        </span>
      </div>
      <button
        onClick={onCopyReport}
        className="text-xs text-gray-500 hover:text-gray-800 border border-gray-300 px-3 py-1.5 rounded-lg transition-colors"
      >
        Copy report
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Create `components/ClaimPopover.tsx`**

```tsx
// components/ClaimPopover.tsx
import { ClaimVerdict, Verdict } from '@/lib/types'

const VERDICT_CONFIG: Record<Verdict, { label: string; bg: string; text: string }> = {
  confirmed:    { label: 'Confirmed',    bg: 'bg-green-100',  text: 'text-green-800' },
  uncertain:    { label: 'Uncertain',    bg: 'bg-yellow-100', text: 'text-yellow-800' },
  contradicted: { label: 'Contradicted', bg: 'bg-red-100',    text: 'text-red-800' }
}

interface ClaimPopoverProps {
  verdict: ClaimVerdict
  onClose: () => void
}

export default function ClaimPopover({ verdict, onClose }: ClaimPopoverProps) {
  const config = VERDICT_CONFIG[verdict.verdict]

  return (
    <span
      className="absolute z-20 left-0 top-full mt-1 w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-4 block"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
          {config.label}
        </span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
      </div>
      <p className="text-sm text-gray-700 mb-3">{verdict.explanation}</p>
      {verdict.sources.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sources</p>
          {verdict.sources.slice(0, 3).map((source, i) => (
            <a
              key={i}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-indigo-600 hover:underline truncate"
            >
              {source.title || source.url}
            </a>
          ))}
        </div>
      )}
    </span>
  )
}
```

- [ ] **Step 6: Create `components/HighlightedText.tsx`**

```tsx
// components/HighlightedText.tsx
'use client'
import { useState } from 'react'
import { Claim, ClaimVerdict, Verdict } from '@/lib/types'
import ClaimPopover from './ClaimPopover'

interface Segment {
  text: string
  claimIndex?: number
  verdict?: Verdict
}

function buildSegments(text: string, claims: Claim[], verdicts: ClaimVerdict[]): Segment[] {
  const verdictMap = new Map(verdicts.map(v => [v.claimIndex, v]))
  const sorted = claims
    .map((c, i) => ({ ...c, originalIndex: i }))
    .sort((a, b) => a.startIndex - b.startIndex)

  const segments: Segment[] = []
  let cursor = 0

  for (const claim of sorted) {
    if (claim.startIndex > cursor) {
      segments.push({ text: text.slice(cursor, claim.startIndex) })
    }
    const v = verdictMap.get(claim.originalIndex)
    segments.push({
      text: text.slice(claim.startIndex, claim.endIndex),
      claimIndex: claim.originalIndex,
      verdict: v?.verdict
    })
    cursor = claim.endIndex
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) })
  }

  return segments
}

const MARK_CLASSES: Record<Verdict, string> = {
  confirmed:    'bg-green-100 border-b-2 border-green-400',
  uncertain:    'bg-yellow-100 border-b-2 border-yellow-400',
  contradicted: 'bg-red-100 border-b-2 border-red-500'
}

interface HighlightedTextProps {
  text: string
  claims: Claim[]
  verdicts: ClaimVerdict[]
}

export default function HighlightedText({ text, claims, verdicts }: HighlightedTextProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const segments = buildSegments(text, claims, verdicts)
  const verdictMap = new Map(verdicts.map(v => [v.claimIndex, v]))

  return (
    <div
      className="text-gray-800 leading-relaxed whitespace-pre-wrap text-base"
      onClick={() => setActiveIndex(null)}
    >
      {segments.map((seg, i) => {
        if (seg.claimIndex === undefined || !seg.verdict) {
          return <span key={i}>{seg.text}</span>
        }
        const claimVerdict = verdictMap.get(seg.claimIndex)
        return (
          <span key={i} className="relative">
            <mark
              className={`${MARK_CLASSES[seg.verdict]} cursor-pointer rounded-sm px-0.5`}
              onClick={e => {
                e.stopPropagation()
                setActiveIndex(activeIndex === seg.claimIndex ? null : seg.claimIndex!)
              }}
            >
              {seg.text}
            </mark>
            {activeIndex === seg.claimIndex && claimVerdict && (
              <ClaimPopover
                verdict={claimVerdict}
                onClose={() => setActiveIndex(null)}
              />
            )}
          </span>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 7: Create `components/PricingCards.tsx`**

```tsx
// components/PricingCards.tsx
'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
// NOTE: do NOT import from lib/stripe here — it's server-only (STRIPE_SECRET_KEY).
// Checkout is handled via /api/stripe/checkout.

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    features: ['3 checks per day', 'Paste text or URL', 'Inline highlights', 'Source citations'],
    cta: 'Get started free',
    priceId: null,
    plan: 'free',
    highlight: false
  },
  {
    name: 'Pro',
    price: '$15',
    period: '/month',
    features: ['200 checks per month', 'Paste text or URL', 'Inline highlights', 'Source citations', 'Check history'],
    cta: 'Start Pro',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    plan: 'pro',
    highlight: true
  },
  {
    name: 'Team',
    price: '$39',
    period: '/month',
    features: ['Unlimited checks', 'Paste text or URL', 'Inline highlights', 'Source citations', 'Check history', 'Priority support'],
    cta: 'Start Team',
    priceId: process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID,
    plan: 'team',
    highlight: false
  }
]

export default function PricingCards() {
  const router = useRouter()

  async function handlePlanClick(priceId: string | null | undefined, plan: string) {
    if (!priceId) { router.push('/signup'); return }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/signup'); return }

    const { data: profile } = await supabase.from('profiles').select('email').eq('id', user.id).single()

    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, plan, email: profile?.email ?? user.email })
    })
    const { url } = await response.json()
    if (url) window.location.href = url
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {PLANS.map(plan => (
        <div
          key={plan.name}
          className={`rounded-2xl border p-6 flex flex-col ${
            plan.highlight
              ? 'border-indigo-500 bg-indigo-50 shadow-md'
              : 'border-gray-200 bg-white'
          }`}
        >
          {plan.highlight && (
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Most popular</span>
          )}
          <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
          <div className="mt-2 mb-6">
            <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
            <span className="text-gray-500 text-sm">{plan.period}</span>
          </div>
          <ul className="space-y-2 mb-8 flex-1">
            {plan.features.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-500">✓</span> {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handlePlanClick(plan.priceId, plan.plan)}
            className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${
              plan.highlight
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            }`}
          >
            {plan.cta}
          </button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 8: Create `components/PricingModal.tsx`**

```tsx
// components/PricingModal.tsx
'use client'
import { useRouter } from 'next/navigation'

interface PricingModalProps {
  onClose: () => void
}

export default function PricingModal({ onClose }: PricingModalProps) {
  const router = useRouter()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-4xl mb-4">🚫</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">You've hit your daily limit</h2>
        <p className="text-gray-500 text-sm mb-6">
          Free accounts get 3 checks per day. Upgrade to Pro for 200 checks per month.
        </p>
        <button
          onClick={() => { onClose(); router.push('/pricing') }}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors mb-3"
        >
          Upgrade to Pro — $15/month
        </button>
        <button
          onClick={onClose}
          className="w-full text-sm text-gray-500 hover:text-gray-700"
        >
          Maybe later
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 9: Add Stripe Checkout API route**

Create `app/api/stripe/checkout/route.ts`:
```typescript
// app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { priceId, plan, email } = await req.json()

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = await createCheckoutSession(priceId, user.id, plan, email ?? user.email!)
  return NextResponse.json({ url })
}
```

- [ ] **Step 10: Verify all components compile**

```bash
npx tsc --noEmit
```
Expected: No TypeScript errors.

- [ ] **Step 11: Commit**

```bash
git add ai-fact-checker/components/ ai-fact-checker/app/api/stripe/checkout/
git commit -m "feat: add all UI components (Nav, CheckInput, HighlightedText, Pricing, modals)"
```

---

### Task 11: Check Page + Root Layout

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/check/page.tsx`

**Interfaces:**
- Consumes: all components from `components/`, `CheckResult` from `lib/types.ts`
- Produces: fully working `/check` page with input, loading states, results, and upgrade gate

- [ ] **Step 1: Update `app/layout.tsx`**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FactCheckAI — Verify AI-generated content instantly',
  description: 'Paste AI-generated text or a URL and instantly see which claims are confirmed, uncertain, or contradicted — with real source citations.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Create `app/check/page.tsx`**

```tsx
// app/check/page.tsx
import { createClient } from '@/lib/supabase/server'
import CheckPageClient from './CheckPageClient'

export default async function CheckPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let plan = 'free'
  let usedToday = 0

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()
    plan = profile?.plan ?? 'free'

    const today = new Date().toISOString().split('T')[0]
    const { data: usage } = await supabase
      .from('daily_usage')
      .select('check_count')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()
    usedToday = usage?.check_count ?? 0
  }

  return (
    <CheckPageClient
      userEmail={user?.email ?? null}
      plan={plan}
      initialUsed={usedToday}
    />
  )
}
```

- [ ] **Step 3: Create `app/check/CheckPageClient.tsx`**

```tsx
// app/check/CheckPageClient.tsx
'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Nav from '@/components/Nav'
import CheckInput from '@/components/CheckInput'
import UsageBar from '@/components/UsageBar'
import SummaryBar from '@/components/SummaryBar'
import HighlightedText from '@/components/HighlightedText'
import PricingModal from '@/components/PricingModal'
import { CheckResult } from '@/lib/types'

const LOADING_STEPS = [
  'Extracting factual claims…',
  'Searching the web for each claim…',
  'Judging results…'
]

interface CheckPageClientProps {
  userEmail: string | null
  plan: string
  initialUsed: number
}

export default function CheckPageClient({ userEmail, plan, initialUsed }: CheckPageClientProps) {
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [originalInput, setOriginalInput] = useState('')
  const [used, setUsed] = useState(initialUsed)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const limit = plan === 'free' ? 3 : plan === 'pro' ? 200 : null

  async function handleCheck(input: string, inputType: 'text' | 'url') {
    setError('')
    setResult(null)
    setLoading(true)
    setOriginalInput(inputType === 'text' ? input : '')
    setLoadingStep(0)

    const stepTimer = setInterval(() => {
      setLoadingStep(s => Math.min(s + 1, LOADING_STEPS.length - 1))
    }, 2500)

    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, inputType })
      })

      const data = await res.json()
      clearInterval(stepTimer)

      if (res.status === 429) {
        setShowPricingModal(true)
        return
      }

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      setResult(data)
      if (data.usage?.used) setUsed(data.usage.used)
    } finally {
      clearInterval(stepTimer)
      setLoading(false)
    }
  }

  function copyReport() {
    if (!result) return
    const lines = result.verdicts.map(v => {
      const claim = result.claims[v.claimIndex]
      return `[${v.verdict.toUpperCase()}] "${claim?.text}" — ${v.explanation}`
    })
    navigator.clipboard.writeText(lines.join('\n'))
  }

  return (
    <>
      <Nav userEmail={userEmail} />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {searchParams.get('upgraded') === 'true' && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-xl">
            You're now on Pro. Enjoy 200 checks per month.
          </div>
        )}

        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Verify AI-generated content</h1>
          <p className="text-gray-500 text-sm">
            Paste text or enter a URL. We'll check every factual claim against live web sources.
          </p>
        </div>

        {limit !== null && (
          <UsageBar used={used} limit={limit} plan={plan} />
        )}

        <CheckInput onSubmit={handleCheck} loading={loading} />

        {loading && (
          <div className="flex items-center gap-3 text-sm text-gray-500 py-4">
            <svg className="animate-spin h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            {LOADING_STEPS[loadingStep]}
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <SummaryBar verdicts={result.verdicts} onCopyReport={copyReport} />
            <div className="border border-gray-200 rounded-xl p-6">
              <HighlightedText
                text={originalInput}
                claims={result.claims}
                verdicts={result.verdicts}
              />
            </div>
          </div>
        )}
      </main>

      {showPricingModal && <PricingModal onClose={() => setShowPricingModal(false)} />}
    </>
  )
}
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Navigate to `http://localhost:3000/check`. Paste sample AI text. Click "Verify Now". Verify:
- Loading steps cycle through "Extracting claims…" → "Searching the web…" → "Judging results…"
- Results render with coloured highlights
- Clicking a highlight opens the popover with verdict + sources
- Clicking outside closes the popover

- [ ] **Step 5: Commit**

```bash
git add ai-fact-checker/app/layout.tsx ai-fact-checker/app/check/
git commit -m "feat: add check page with inline highlight results and upgrade gate"
```

---

### Task 12: Landing Page + Pricing Page

**Files:**
- Modify: `app/page.tsx`
- Create: `app/pricing/page.tsx`

**Interfaces:**
- Consumes: `PricingCards` from `components/PricingCards.tsx`, `Nav` from `components/Nav.tsx`
- Produces: public landing page with live demo and `/pricing` page

- [ ] **Step 1: Replace `app/page.tsx`**

```tsx
// app/page.tsx
import Link from 'next/link'
import Nav from '@/components/Nav'
import PricingCards from '@/components/PricingCards'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <>
      <Nav userEmail={user?.email ?? null} />

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 pt-20 pb-16 text-center">
        <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-6 uppercase tracking-wide">
          AI outputs hallucinate 15–55% of the time
        </span>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-5">
          Verify AI content<br />before you publish
        </h1>
        <p className="text-xl text-gray-500 mb-8 max-w-xl mx-auto">
          Paste any AI-generated text or URL. Every factual claim gets checked against live web sources and highlighted in green, yellow, or red.
        </p>
        <Link
          href="/check"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-colors shadow-lg shadow-indigo-200"
        >
          Start checking free →
        </Link>
        <p className="text-sm text-gray-400 mt-4">3 free checks per day. No credit card required.</p>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Paste your text or URL', desc: 'Drop in AI output or link to any published article.' },
              { step: '2', title: 'We check every claim', desc: 'Each factual assertion is searched against live Google results.' },
              { step: '3', title: 'See exactly what to trust', desc: 'Claims are highlighted green, yellow, or red with source citations.' }
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Simple pricing</h2>
        <PricingCards />
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-400">
        FactCheckAI — built for freelancers who can't afford to publish AI hallucinations.
      </footer>
    </>
  )
}
```

- [ ] **Step 2: Create `app/pricing/page.tsx`**

```tsx
// app/pricing/page.tsx
import Nav from '@/components/Nav'
import PricingCards from '@/components/PricingCards'
import { createClient } from '@/lib/supabase/server'

export default async function PricingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <>
      <Nav userEmail={user?.email ?? null} />
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Choose your plan</h1>
          <p className="text-gray-500">Start free. Upgrade when you need more.</p>
        </div>
        <PricingCards />
        <p className="text-center text-sm text-gray-400 mt-8">
          Cancel anytime. No contracts.{' '}
          <a href="mailto:support@factcheckai.com" className="hover:underline">Questions? Email us.</a>
        </p>
      </main>
    </>
  )
}
```

- [ ] **Step 3: End-to-end browser test**

```bash
npm run dev
```

Walk through the full user journey:
1. `http://localhost:3000` — landing page loads, CTA works
2. Click "Start checking free" → `/check` loads
3. Paste AI text → results appear with highlights → click a highlight → popover shows
4. `http://localhost:3000/pricing` — pricing page loads with 3 plan cards
5. Sign up at `/signup` → redirect to `/check` → usage bar shows
6. Trigger the 4-check limit (or mock it) → pricing modal appears

- [ ] **Step 4: Commit**

```bash
git add ai-fact-checker/app/page.tsx ai-fact-checker/app/pricing/
git commit -m "feat: add landing page and pricing page"
```

---

### Task 13: Deploy to Vercel

**Files:**
- No code changes — deployment config only

**Interfaces:**
- Produces: live production URL at `https://your-app.vercel.app`

- [ ] **Step 1: Run final type check and tests**

```bash
cd ai-fact-checker
npx tsc --noEmit && npm test
```
Expected: 0 TypeScript errors, all tests passing.

- [ ] **Step 2: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 3: Deploy via Vercel CLI**

```bash
npx vercel --prod
```
Or connect the repo in the Vercel dashboard at vercel.com/new.

- [ ] **Step 4: Add environment variables in Vercel**

In Vercel project → Settings → Environment Variables, add all variables from `.env.local.example`:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
SERPER_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID
NEXT_PUBLIC_APP_URL   ← set to your production URL
```

- [ ] **Step 5: Register Stripe webhook**

In Stripe Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://your-app.vercel.app/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

Copy the signing secret into `STRIPE_WEBHOOK_SECRET` in Vercel env vars. Redeploy.

- [ ] **Step 6: Smoke test production**

1. Open production URL
2. Run one check as a guest — verify it works
3. Sign up — verify profile is created in Supabase
4. Click upgrade → verify Stripe Checkout opens
5. Complete a test payment (use Stripe test card `4242 4242 4242 4242`) → verify plan updates to `pro` in Supabase

- [ ] **Step 7: Final commit**

```bash
git commit --allow-empty -m "chore: deploy ai-fact-checker to production"
```
