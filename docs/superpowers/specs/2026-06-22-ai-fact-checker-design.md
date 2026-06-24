# AI Hallucination Fact-Checker — Design Spec
**Date:** 2026-06-22
**Status:** Approved — ready for implementation planning

---

## 1. Problem

AI tools hallucinate at rates of 15–55% depending on topic freshness. Only 33% of organisations trust AI output (Stack Overflow 2025). There is no simple consumer tool for freelancers and content creators to verify AI-generated text before publishing. Enterprise solutions cost thousands per month. This is the gap.

---

## 2. Product

A web app that accepts AI-generated text (paste) or a URL, extracts every factual claim, verifies each against live web sources in real time, and returns the original text with inline colour-coded highlights:

- 🟢 **Green** — confirmed by web sources
- 🟡 **Yellow** — uncertain / conflicting results
- 🔴 **Red** — contradicted by web sources

Clicking any highlight opens a popover with: verdict, one-line explanation, up to 3 clickable source links.

---

## 3. Target User

**Primary:** Freelance writers, copywriters, bloggers, journalists who use AI to draft content and need to verify before publishing.

**Acquisition channels:** Reddit (r/freelance, r/blogging, r/copywriting), Twitter/X, Product Hunt launch, AppSumo.

---

## 4. Architecture

### Stack
| Layer | Technology |
|---|---|
| Frontend + API routes | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Auth + database | Supabase |
| Payments | Stripe |
| AI: claim extraction + verdict | Anthropic Claude claude-sonnet-4-6 |
| Web search | Serper.dev API |
| URL content extraction | Cheerio |
| Deployment | Vercel |

### System flow
```
User input (text or URL)
  ↓
/api/check (Next.js API route)
  ├── [URL path] fetch page → Cheerio → readable text
  ├── Claude: extract factual claims + character offsets
  ├── Serper: parallel web search per claim (top 5 results each)
  └── Claude: batch verdict judgement across all claims
        → confirmed | uncertain | contradicted
        → explanation (1 sentence)
        → sources (max 3 per claim)
  ↓
JSON response to frontend
  ↓
Frontend: wrap claim spans in coloured <mark> elements using character offsets
```

### Cost per check
| Service | Cost |
|---|---|
| Claude (extraction + verdict, ~2 calls) | ~$0.003 |
| Serper (10 searches avg) | ~$0.01 |
| **Total** | **~$0.013–0.05** |

At Pro plan (200 checks/month, $15): API cost $2.60–10, margin $5–12.40.

---

## 5. Pages

### `/` — Landing page
- Hero: headline + one-line description
- Inline demo: paste box on the page, run one free check without signing in
- Below fold: how it works (3 steps), pricing summary, FAQ
- CTA: "Start checking free"

### `/check` — Main product page
- Tab switcher: `Paste Text` | `Check URL`
- `Paste Text`: large textarea, 6,000 word max, character count
- `Check URL`: single URL input field with validation
- "Verify Now" button (disabled while processing)
- Usage bar: `2 of 3 free checks remaining today`
- Loading state: progress indicator with step labels ("Extracting claims…", "Searching sources…", "Judging results…")
- Results render below input on the same page (no navigation)

### Results (rendered inline on `/check`)
- Original text with coloured `<mark>` spans for each claim
- Click any highlight → popover with:
  - Verdict badge (Confirmed / Uncertain / Contradicted)
  - One-line explanation
  - 2–3 source links (title + URL, open in new tab)
- Summary bar above text: "12 claims checked — 8 confirmed, 3 uncertain, 1 contradicted"
- "Copy report" button → copies plain text summary to clipboard
- "Run new check" button

### `/pricing` — Pricing page
- Three tiers side by side (Free / Pro / Team)
- Stripe Checkout on click for paid tiers
- Link to Stripe Customer Portal for existing subscribers

### `/login` and `/signup`
- Supabase email + password auth
- No OAuth at launch (add Google post-launch)
- Redirect to `/check` after auth

---

## 6. Data Model (Supabase)

### `profiles`
```sql
id                 uuid PRIMARY KEY  -- = auth.users.id
email              text NOT NULL
plan               text NOT NULL DEFAULT 'free'  -- 'free' | 'pro' | 'team' | 'lifetime'
stripe_customer_id text
created_at         timestamptz DEFAULT now()
```

### `checks`
```sql
id             uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id        uuid REFERENCES profiles(id)  -- nullable (guest checks)
input_type     text NOT NULL  -- 'text' | 'url'
input_preview  text           -- first 100 chars of input
claim_count    int
created_at     timestamptz DEFAULT now()
```

### `daily_usage`
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
fingerprint  text    -- SHA-256(IP + user-agent) for guests
user_id      uuid REFERENCES profiles(id)  -- nullable
date         date NOT NULL
check_count  int NOT NULL DEFAULT 0
UNIQUE(fingerprint, date)
UNIQUE(user_id, date)
```

### `subscriptions`
```sql
id                     uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id                uuid REFERENCES profiles(id)
stripe_subscription_id text UNIQUE
plan                   text NOT NULL
status                 text NOT NULL  -- 'active' | 'cancelled' | 'past_due'
current_period_end     timestamptz
```

**Note:** Claim results are not stored. Results are ephemeral — computed on request, returned to client, not persisted. This avoids privacy risk with user content and keeps the DB lean. Pro users get a Check History list (rows from `checks` table only) with a re-run button, not stored results.

---

## 7. Core Pipeline (`/api/check`)

### Step 1 — Input normalisation
- `input_type === 'url'`: fetch page with `node-fetch`, parse HTML with Cheerio, extract `<article>` or `<main>` body text, strip tags
- `input_type === 'text'`: use as-is
- Truncate to 6,000 words (cost cap, not a Claude limit)

### Step 2 — Claim extraction (Claude)
Prompt: extract all hard factual assertions (skip opinions, hedged statements, questions). Return JSON:
```json
{
  "claims": [
    { "text": "The Eiffel Tower is 330 metres tall.", "startIndex": 142, "endIndex": 178 }
  ]
}
```
Target 5–15 claims per check. Use `claude-sonnet-4-6` with `max_tokens: 1024`.

### Step 3 — Web search (Serper, parallel)
- Fire one `serper.dev/search` request per claim simultaneously
- `Promise.all()` — fully parallel
- Cap at 10 concurrent requests
- Collect top 5 results per claim: `{ title, link, snippet }`

### Step 4 — Batch verdict judgement (Claude)
Send all claims + search results in one prompt. Return JSON:
```json
{
  "verdicts": [
    {
      "claimIndex": 0,
      "verdict": "contradicted",
      "explanation": "Multiple sources confirm the Eiffel Tower is 330m including antenna, but 300m without — the claim omits this distinction.",
      "sources": [
        { "url": "https://...", "title": "Eiffel Tower — Wikipedia" }
      ]
    }
  ]
}
```
One Claude call for all verdicts — not one per claim. Keeps latency under 8 seconds.

### Step 5 — Response
Merge claims + verdicts, return array to frontend. Frontend uses `startIndex`/`endIndex` to inject `<mark>` spans into original text.

---

## 8. Monetisation

### Plans
| Plan | Price | Limit | Notes |
|---|---|---|---|
| Free | $0 | 3 checks/day | IP fingerprint for guests, user_id for signed-in |
| Pro | $15/month | 200 checks/month | Stripe monthly subscription |
| Team | $39/month | Unlimited | Stripe monthly subscription |
| Lifetime (AppSumo, week 2) | $79 one-time | 500 checks/month | Add after 50 Pro subscribers |

### Usage enforcement
```
guest       → daily_usage by fingerprint, max 3/day
free user   → daily_usage by user_id, max 3/day
pro user    → COUNT(checks) WHERE user_id AND created_at > billing_period_start, max 200
team user   → skip limit check
lifetime    → treat same as team
```

### Upgrade gate UX
- Check 1: no sign-in required
- Check 2: email capture prompt ("Save your results — it's free")
- Check 3: full sign-up required
- Check 4+: hard paywall, pricing modal

### Stripe integration
- Two Products: Pro ($15/mo), Team ($39/mo)
- Stripe Checkout (hosted) — no custom payment UI
- Stripe Customer Portal — self-serve upgrade/downgrade/cancel
- Webhook endpoint: `/api/stripe/webhook`
  - `checkout.session.completed` → create subscription row, update profile plan
  - `customer.subscription.updated` → update subscription row + profile plan
  - `customer.subscription.deleted` → set plan = 'free', subscription status = 'cancelled'

---

## 9. Revenue Projection (Month 1, Conservative)

| | Count | Revenue |
|---|---|---|
| Pro subscribers | 20 | $300 MRR |
| Team subscribers | 3 | $117 MRR |
| AppSumo lifetime (week 2) | 10 | $790 one-time |
| **Total month 1** | | **~$1,200** |

---

## 10. Out of Scope (Launch)

- Google / GitHub OAuth
- Check history with stored results
- Browser extension
- Team member management / shared seats
- API access for developers
- Mobile app
- PDF / DOCX upload
- Bulk URL checking

---

## 11. Open Questions (Post-Launch)

- Which search API gives better coverage — Serper or Brave Search? Test both at launch.
- Should uncertain (yellow) claims prompt a "suggest a better source" CTA to drive engagement?
- At what subscriber count does AppSumo listing make sense without cannibalising MRR?
