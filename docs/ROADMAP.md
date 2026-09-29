# Roadmap: from demo to launched product

## Where it stands (Sep 29, 2026)

| Built and working | Not built yet |
|---|---|
| 14-page web app, responsive, zero errors, motion, clay + glass design | Login and company workspaces |
| Live check on real SEC data | Database: nothing is saved across refreshes |
| Agent API pipeline with mock fallbacks for 6 services | Scheduled daily scans |
| `/ask` endpoint wired to the web app | Real CRM connection flow for customers |
| Front-end agent with page locking and automated page checks | Billing |
| Architecture docs and sequence diagrams | Tests beyond the page check, error monitoring |

## Phase 1: first paying customer (weeks 1-3)

- [ ] **Database.** Postgres on [Supabase](https://supabase.com) or [Neon](https://neon.tech)
  (free tiers): accounts, daily scores (real trend lines), signals, actions, settings, profiles.
- [ ] **Connect web app to API.** Replace `lib/data.ts` with API calls; loading and error
  states on every page.
- [ ] **Login and workspaces.** [Clerk](https://clerk.com) or
  [Supabase Auth](https://supabase.com/auth) (free tiers); each company's data fully separate;
  invites and roles. Single sign-on later via [Auth0](https://auth0.com) (paid).
- [ ] **Customer-driven CRM connection.** Merge Link in onboarding, then field mapping
  (revenue, renewal date, owner).
- [ ] **Scheduled scans.** [Inngest](https://www.inngest.com) or [Trigger.dev](https://trigger.dev)
  (free tiers); wire the "Run scan" button to `/scan`.
- [ ] **Watch list for Live check.** Save companies, re-check daily, alert on new filings.

## Phase 2: trustworthy AI (weeks 3-6)

- [ ] **Backtest scoring** on 20-50 accounts that really churned or renewed.
- [ ] **Validated structured output**: schema check, retry on bad JSON, never show a score
  without evidence.
- [ ] **Prompt-injection defence** for news and ticket text (data-only prompts, critic check).
- [ ] **Feedback loop**: thumbs up/down on alerts feeding score tuning.
- [ ] **Cost controls**: per-workspace AI limits and caching.
- [ ] **Real Ask AI**: text-to-Cypher over Neo4j.
- [ ] **Crusoe-written drafts** in the account owner's voice (`POST /draft`).

## Phase 3: security, legal, quality (weeks 6-10)

- [ ] Encrypted secrets and data, audit logs, backups, separate staging environment.
- [ ] Terms of Service, Privacy Policy, Data Processing Agreement (GDPR/CCPA). Draft with
  [Termly](https://termly.io) (free tier); have a lawyer review.
- [ ] Trust page now; SOC 2 within 6-12 months via [Vanta](https://www.vanta.com) or
  [Drata](https://drata.com) (paid).
- [ ] Confirm commercial-use terms and pricing for Similarweb, Brave and Merge before setting
  your own prices.
- [ ] End-to-end tests with [Playwright](https://playwright.dev); unit tests for scoring.
- [ ] CI on every pull request with [GitHub Actions](https://github.com/features/actions)
  running `npm run check`.
- [ ] Monitoring: [Sentry](https://sentry.io) (errors), [PostHog](https://posthog.com) (usage),
  [Better Stack](https://betterstack.com) (uptime). All have free tiers.
- [ ] Daily briefing by email via [Resend](https://resend.com); Slack app for high-risk alerts.

## Phase 4: launch (weeks 10-12)

- [ ] Onboarding wizard: connect CRM → pick competitors → first scan → first alert.
- [ ] ROI report: revenue flagged vs revenue saved.
- [ ] Team workflow: assign owners, notes, mark saved or lost; push tasks back to the CRM.
- [ ] Dark mode, accessibility audit.
- [ ] Billing with [Stripe](https://stripe.com): trial, plans, customer portal.
- [ ] Paid beta with 3-5 design partners, then public launch
  ([Product Hunt](https://www.producthunt.com), LinkedIn, customer-success communities).

## Known limitations today

- Live check covers U.S. public companies only; most SaaS customers are private and need the
  CRM, news and traffic sources.
- Some companies report fourth-quarter revenue only in annual reports, so a quarter can be
  missing from the Live check chart.
- Sponsor integrations (Crusoe, Merge.dev, Brave, Similarweb, OpenRouter/Nebius, Neo4j) are
  coded but have only been run in mock mode. Test each with a real key before a demo.
- Settings, profile edits, "Mark as sent" and "Add to my accounts" are not saved yet.
