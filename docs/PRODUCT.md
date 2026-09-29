# AccountPulse: product overview

## The real-world problem

B2B companies lose customers without warning. By the time a customer says "we're not renewing,"
the decision was made weeks earlier, and the signs were there all along, just scattered:

- **Inside the company:** support tickets piling up, product usage dropping, the champion
  changing jobs. These live in the CRM and help desk, and nobody reads them together.
- **Outside the company:** the customer announcing layoffs, getting acquired, hiring a new
  executive who used a rival product, or a competitor suddenly gaining traffic. These live in
  news, filings and web data that customer-success teams rarely watch.

Customer-success managers often look after dozens of accounts each. They can't read every ticket,
news story and filing for all of them, so at-risk accounts get noticed late, or never.

**What that costs:** for a subscription business, keeping an existing customer is usually far
cheaper than winning a new one, and every lost renewal removes revenue the company was counting on
for years.

## What AccountPulse does

1. **Connects** to the CRM and help desk (through Merge.dev) and pulls accounts, revenue,
   renewal dates and tickets.
2. **Watches** outside signals: news about each customer (Brave Search), competitor momentum
   (Similarweb), and official company filings (SEC EDGAR).
3. **Scores** every account from 0 to 100 using an AI model (Crusoe), and a second AI model
   (via OpenRouter on Nebius) double-checks each verdict and can veto weak ones.
4. **Explains** each score in plain English, with every reason linked to its source.
5. **Recommends** one concrete next step and drafts the email or call notes to do it.
6. **Maps** how accounts, signals and competitors connect (Neo4j graph), so questions like
   "which accounts are exposed to Routewise?" have instant answers.

## Who it's for

| User | What they get |
|---|---|
| Customer-success manager | "Who do I call today, and what do I say?" answered every morning |
| Head of customer success / VP | Revenue at risk in one number, with trend and team view |
| Account executive at renewal time | The full story on an account in one page |

Launch market: B2B software companies with roughly $5M–$50M in yearly revenue. See
[BUSINESS.md](BUSINESS.md) for six other industries the same engine fits.

## Features

| Page | What it does | AI? |
|---|---|---|
| Overview | Revenue at risk, who to call first, accounts to watch, latest signals | Yes |
| Accounts | Every customer with risk score, 8-week trend, filter and sort | |
| Account detail | "Why this score", evidence with sources, trend chart, drafted email | Yes |
| Signals | Timeline of news, competitor and CRM changes | |
| Competitors | Rival traffic momentum and which accounts each one threatens | |
| **Live check** | Any U.S. public company scored from real SEC filings | Optional |
| Relationship map | Interactive graph: signals, accounts, competitors | |
| Ask AI | Plain-English questions about your customers | Yes |
| Rescue actions | Editable AI drafts: emails, call notes, offers | Yes |
| Daily briefing | What changed overnight, in a two-minute read | Yes |
| Integrations | Which data sources and models are connected | |
| Settings / Profile | Alerts, risk threshold, scan schedule, personal details | |

### Design principles

- **Every AI claim shows its source.** Source chips (Brave, Similarweb, Merge.dev, SEC EDGAR)
  and a "double-checked by a second AI" badge build trust.
- **Understandable in five seconds.** Plain words ("Draft email", not "Generate content"),
  one number per card, colour reserved for risk (coral high, amber watch, mint healthy).
- **Glass holds information, clay takes action.** Frosted-glass panels for content, soft clay
  for buttons and toggles.
- **Motion that means something.** Numbers count up, risk rings fill, trend lines draw, and
  the pulse line beats. All motion switches off for users who ask their system to reduce it.

## Libraries and services used

### Web app (`frontend/`)

| Library | Version | Why it's used | Link |
|---|---|---|---|
| Next.js (App Router) | 16.3 | Pages, routing, server API routes, static pre-rendering | [nextjs.org](https://nextjs.org) |
| React | 19.3 | UI components | [react.dev](https://react.dev) |
| TypeScript | 5.9 | Type safety; `npm run typecheck` catches errors before build | [typescriptlang.org](https://www.typescriptlang.org) |
| Tailwind CSS | 4.3 | Styling and the design tokens (colours, fonts) | [tailwindcss.com](https://tailwindcss.com) |
| framer-motion | 13.4 | All animation: counters, rings, page transitions, drawers | [motion.dev](https://motion.dev) |
| lucide-react | 1.48 | Icons | [lucide.dev](https://lucide.dev) |
| clsx | 2.1 | Combining CSS class names conditionally | [npm: clsx](https://www.npmjs.com/package/clsx) |
| Google Fonts: Sora, Manrope | n/a | Headings (Sora) and body text (Manrope) | [fonts.google.com](https://fonts.google.com) |

### Agent API (`backend/`)

| Library | Why it's used | Link |
|---|---|---|
| FastAPI | HTTP API with automatic interactive docs at `/docs` | [fastapi.tiangolo.com](https://fastapi.tiangolo.com) |
| Uvicorn | Runs the FastAPI app | [uvicorn.org](https://www.uvicorn.org) |
| OpenAI Python SDK | Talks to Crusoe and OpenRouter (both use the OpenAI API format) | [github.com/openai/openai-python](https://github.com/openai/openai-python) |
| neo4j driver | Writes the account/signal/competitor graph | [neo4j.com/docs/python-manual](https://neo4j.com/docs/python-manual/current/) |
| requests | Calls Merge.dev, Brave and Similarweb | [requests.readthedocs.io](https://requests.readthedocs.io) |
| python-dotenv | Loads API keys from `.env` | [pypi: python-dotenv](https://pypi.org/project/python-dotenv/) |

### External services

| Service | Role | Cost to start |
|---|---|---|
| [SEC EDGAR](https://www.sec.gov/search-filings/edgar-application-programming-interfaces) | Real filings and revenue for public companies (Live check) | Free, no key |
| [Crusoe Managed Inference](https://docs.crusoecloud.com/serverless-inference/) | Main AI model: scores, explanations, answers | Paid (hackathon credits) |
| [OpenRouter](https://openrouter.ai) → [Nebius](https://nebius.com) | Second AI model that checks each verdict | Paid, pay per use |
| [Merge.dev](https://merge.dev) | One API for many CRMs and help desks | Free tier, then paid |
| [Brave Search API](https://brave.com/search/api/) | News about customers | Check current plans |
| [Similarweb](https://www.similarweb.com) | Competitor web traffic | Paid (enterprise) |
| [Neo4j AuraDB](https://neo4j.com/cloud/aura-free/) | Graph database | Free tier |
| [Vultr](https://www.vultr.com) / [DuploCloud](https://duplocloud.com) / [Vercel](https://vercel.com) | Hosting | Free tiers / credits |
| [UserTesting](https://www.usertesting.com) | Real users' feedback on the dashboard | Paid |

### Tooling

| Tool | Why |
|---|---|
| `scripts/verify-pages.mjs` | Starts the app, checks every page loads and 404 works, fails if a locked page is deleted |
| `scripts/confirm-page.mjs` | Locks pages you've approved |
| `.claude/agents/frontend-agent.md` | Instructions for the AI front-end agent that builds new pages to these rules |
| [Mermaid](https://mermaid.js.org) | Diagrams in these docs |
