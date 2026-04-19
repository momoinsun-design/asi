# ASI — Global Influencer Marketplace

Brand-side procurement platform for discovering, negotiating, and paying Instagram · TikTok · YouTube Shorts creators, with AI matching and Stripe escrow. Built as a vertical-slice scaffold from a deep-interview spec (ambiguity 19.2%, 9-entity ontology, 100% stability).

- **Source spec:** `.omc/specs/deep-interview-influencer-marketplace.md`
- **Implementation plan:** `.omc/plans/autopilot-impl.md`

## What's working end-to-end

| AC | Feature | Flow |
|----|---------|------|
| AC-1 | **Discovery** | `/discover` ranks 30 seeded creators across 3 platforms by vertical × budget × engagement |
| AC-2 | **In-platform negotiation** | `/campaigns/[id]` thread with counter-offer field; no email/DM leakage |
| AC-3 | **Escrow** | Stripe adapter (mock default, real test-mode when `STRIPE_SECRET_KEY` set) funds → holds → releases |
| AC-4 | **Platform coverage** | IG, TikTok, YouTube Shorts all present in the seed |
| AC-5 | **GMV telemetry** | `Report` row written in one Prisma transaction on `COMPLETED` |
| AC-6 | **Reporting** | `/dashboard` GMV tile + per-platform split + reach/engagement per campaign |
| AC-7 | **Global compliance surface** | English-first UI, Stripe rail, sanctions blocklist documented as TODO |
| AC-8 | **North-star** | Trailing-30d completed campaigns + GMV on the dashboard |

## Quick start

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env
# Edit .env and set at minimum:
#   DATABASE_URL="file:./dev.db"
#   NEXTAUTH_SECRET="$(openssl rand -base64 32)"
#   NEXTAUTH_URL="http://localhost:3000"

# 3. Migrate + seed
npm run prisma:migrate   # creates dev.db
npm run seed              # demo brand + 30 influencers

# 4. Run
npm run dev
# Open http://localhost:3000 and log in with demo@asi.local / demo1234
```

## Demo flow (5 minutes)

1. Log in as `demo@asi.local` / `demo1234`.
2. `/dashboard` — see GMV tile at 0 (no completed campaigns yet) and per-platform split.
3. `/discover` — see ranked influencer grid; filter by platform.
4. Click **Start campaign** on any creator → fill brief + offer → create **Draft**.
5. On the campaign page, **Send brief** (DRAFT → SENT), send a negotiation message (SENT → NEGOTIATING), **Accept terms** (→ ACCEPTED), **Fund escrow** (→ FUNDED; mock Stripe records `HELD`), **Mark delivered** (→ DELIVERED), **Complete campaign** (→ COMPLETED; emits a `Report` row in one transaction).
6. Return to `/dashboard` — GMV tile reflects the completed campaign.
7. Optional — click **Release escrow** to transition the `Escrow` row to `RELEASED`.

## Environment variables

| Var | Required | Purpose |
|-----|----------|---------|
| `DATABASE_URL` | yes | SQLite path in dev (`file:./dev.db`); PostgreSQL URL in prod |
| `NEXTAUTH_SECRET` | yes | Session cookie signing. Generate with `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | yes (non-prod) | Base URL for auth callbacks |
| `STRIPE_SECRET_KEY` | no | When set, escrow uses real Stripe test mode. When omitted, a deterministic mock is used (default). |
| `STRIPE_MODE` | no | `mock` or `test`; inferred from the key when omitted |
| `CREATOR_MARKETPLACE_MODE` | no | `MOCK` (default) uses the seeded corpus. `REAL` dispatches per-platform to the official APIs below (all require credentials + partnership approval). |
| `META_ACCESS_TOKEN`, `META_BUSINESS_ID` | when REAL | Instagram — Meta Creator Marketplace API (requires partnership approval). |
| `TIKTOK_BUSINESS_ACCESS_TOKEN`, `TIKTOK_ADVERTISER_ID` | when REAL | TikTok Creator Marketplace API (TCM, requires partnership approval). |
| `YOUTUBE_API_KEY`, `YOUTUBE_OAUTH_CLIENT_ID`, `YOUTUBE_OAUTH_CLIENT_SECRET` | when REAL | YouTube Data API v3 + creator OAuth (no CMP equivalent; supply grows from channel linking). |
| `SIMULATE_INFLUENCER_REPLY` | no | Set to `1` to auto-generate a canned influencer reply on outreach (demo only). |

## Scripts

```
npm run dev              # local dev server
npm run build            # prisma generate + next build
npm run start            # serve production build
npm run typecheck        # tsc --noEmit
npm run lint             # next lint
npm run test             # vitest run (ranking + FSM unit tests)
npm run prisma:generate  # regenerate Prisma client
npm run prisma:migrate   # dev migration + regenerate
npm run prisma:reset     # drop + re-migrate (loses data)
npm run seed             # re-seed the demo data
```

## Architecture highlights

- **Single deployable**: Next.js 15 App Router with server components for reads and client components only where interactivity is needed (auth forms, FSM action buttons, outreach composer).
- **9-entity ontology → Prisma**: `Brand`, `Influencer`, `Campaign`, `Platform` (enum), `Recommendation`, `OutreachMessage`, `Escrow`, `Report`, `DataSource` (enum). See `prisma/schema.prisma`.
- **Finite state machine**: `src/lib/campaign-state.ts` defines the canonical transition table. `assertTransition` is called before every state change. Covered by 6 unit tests.
- **Transactional state changes**: `COMPLETED` (Report + state) and escrow funding (Escrow + state) run in a single `prisma.$transaction`.
- **IDOR defense**: every protected handler scopes Prisma queries via `findFirst({ where: { id, brandId: session.user.brandId } })`.
- **Payment adapter pattern**: `src/lib/adapters/stripe.ts` switches between `mock` (deterministic, demo-safe) and `test` (real Stripe test APIs); the app code is identical.
- **AI matching stub**: `src/lib/ranking.ts` — vertical overlap × budget match × engagement × scale heuristic. Real implementation would learn from brand ↔ influencer acceptance history.

## TODO before production

1. **Real influencer data**: complete the three adapters behind the `creator-marketplace` facade — `ig-marketplace.ts` (Meta Creator Marketplace), `tiktok-tcm.ts` (TikTok Creator Marketplace), `youtube-oauth.ts` (YouTube Data API v3 + creator OAuth). Each stub currently throws until partnership approvals land.
2. **Partnership approvals (multi-week)**: Meta Business + Creator Marketplace app review; TikTok for Business + TCM approval; YouTube OAuth consent screen verification if `sensitive` scopes are requested.
3. **Sync job**: a scheduled worker that calls each live adapter and upserts the local `Influencer` cache (the `discover` route reads only from this cache for latency).
4. **Stripe Connect**: the current escrow adapter captures but does not transfer to creator Connect accounts — wire `transfers.create` and the Connect onboarding flow.
5. **KYC / sanctions blocklist**: add OFAC screening for brand signup and influencer payout; Stripe KYC via Connect onboarding.
6. **GDPR**: cookie banner, data export, data deletion, data-retention job.
7. **Deliverable verification**: currently the brand manually clicks "Mark delivered". Production should verify posted content via platform APIs or link hash.
8. **Rate limiting**: add a limiter on `/api/signup`, `/api/auth/callback/credentials`, `/api/outreach`. Upstash + Vercel `next-safe-action` pattern recommended.
9. **Reconciliation sweep**: a job that reconciles Stripe state with local `Escrow` rows — the transactional fix only guards the DB; a dropped process after the Stripe call still needs recovery.
10. **Observability**: structured logging, request IDs, Sentry.
11. **Email/notifications**: campaign state change emails, influencer invitations.
12. **Test coverage**: API-route integration tests covering IDOR, FSM illegal paths, and the full DRAFT → COMPLETED lifecycle.

## License

Private — scaffold generated autonomously via `/deep-interview` → `/autopilot` on 2026-04-19.
