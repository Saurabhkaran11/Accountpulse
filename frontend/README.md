# AccountPulse web app (frontend)

Part of the AccountPulse project. Start with the [project README](../README.md); product,
architecture and API docs are in [../docs](../docs).

AI dashboard that shows customer-success teams which customers are about to leave, why, and
what to send them. Built with Next.js 16, Tailwind CSS v4 and framer-motion, using a
claymorphism + glassmorphism design system.

Runs fully on built-in demo data today. Point it at the AccountPulse agent API (the FastAPI
backend) to show live data.

## 1. Requirements

- Node.js 20 or newer (`node -v`)
- npm 10 or newer

## 2. Set up

```bash
cd frontend
npm install
cp .env.example .env.local      # optional: leave NEXT_PUBLIC_API_URL empty for demo data
```

## 3. Run

```bash
npm run dev          # development, with hot reload: http://localhost:3000
```

Production build:

```bash
npm run build
npm run start        # http://localhost:3000
```

Open `http://localhost:3000` for the landing page, or `http://localhost:3000/dashboard` for the app.

## 4. Check everything before a demo or a commit

```bash
npm run check        # typecheck + build + verify every page
```

`npm run verify` starts the built app, requests every page in `agent/page-registry.json`,
fails on any error screen or non-200 response, confirms the 404 page works, and fails if a
confirmed (locked) page has been deleted.

## 5. Lock pages you've approved

```bash
npm run confirm -- --list                  # see each page's status
npm run confirm -- /dashboard/profile      # lock one page
npm run confirm -- --all                   # lock everything
```

Locked pages can be improved but never deleted or renamed. The front-end agent follows this
rule, and `npm run verify` enforces it.

## 6. Use the front-end agent

The agent's instructions live in `.claude/agents/frontend-agent.md`. In Claude Code, open this
folder and say:

> Use the frontend-agent to add a Renewals calendar page. (paste agent/PAGE_REQUEST_TEMPLATE.md, filled in)

The agent builds the page, registers it, runs `npm run check`, and replies with Added /
Changed / Not done yet / Suggested next step / Checks.

## 7. Live check: real data, no API key

`/dashboard/live` checks any U.S. public company using its real **SEC EDGAR** filings
(the SEC's free, official filing database).

- Try it: open the page and click CHGG, SBUX, NKE, ZM or SNOW, or type any stock ticker.
- API: `curl http://localhost:3000/api/live/NKE` returns JSON (score, reasons, next step,
  revenue by quarter, filings with links).
- Set `SEC_USER_AGENT="AccountPulse you@yourcompany.com"` in `.env.local`. SEC asks every app
  to identify itself with a contact email, and allows up to 10 requests per second.
- Optional: set `CRUSOE_API_KEY` (server-side) and Crusoe writes the explanation instead of the
  rule-based summary.

How the score works (`lib/sec.ts`): starts at 20, then adds weight for 8-K events from the last
12 months, such as bankruptcy (+45), delisting notice (+30), layoffs/restructuring (+25), change of
control (+25) or executive change (+10), counting recent events more. Revenue down more than 5%
year over year adds 20; growth over 10% subtracts 10. Each reason is shown to the user.

Limits: public companies only (private companies need Brave news, Merge CRM data, etc.), and
some companies' fourth-quarter revenue appears only in their annual report, so a quarter can be
missing from the chart.

## 8. Connect the backend (next step)

1. Run the agent API (see [../backend/README.md](../backend/README.md)) on port 8000.
2. In `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8000`
3. Add `POST /ask` to the backend returning `{ answer, accounts, engine }` (see `lib/ai.ts`).
   The Ask AI page uses it automatically and falls back to demo answers if it fails.

## Live data

- `components/LiveData.tsx` loads `GET {NEXT_PUBLIC_API_URL}/accounts` and shares it with every page.
- Overview, Accounts, Account detail, Run scan and Ask AI use live data; other pages still use demo data.
- No backend or it fails → pages fall back to demo data and the badge says "Demo data".
- `NEXT_PUBLIC_API_URL` is read when `npm run dev` / `npm run build` starts, so restart after changing it.

## Project map

```
app/
  page.tsx                     landing page
  dashboard/
    layout.tsx                 header + sidebar shell for every dashboard page
    template.tsx               page transition animation
    page.tsx                   overview
    accounts/                  list + [id] detail (AI "why", evidence, email draft)
    live/                      real SEC data for any public company
    signals/ competitors/ graph/ ask/ actions/ briefings/ integrations/ settings/ profile/
  api/live/[ticker]/route.ts   server route that fetches SEC EDGAR
components/
  ui.tsx                       glass panels, clay buttons/toggles, risk ring, badges, sparkline
  motion.tsx                   ambient background, pulse line, logo
  Providers.tsx                reduced-motion, user profile state, toasts
  shell/                       Topbar, Sidebar, SearchBar, AppShell
lib/
  data.ts                      demo data and types (swap for API data later)
  nav.ts                       sidebar + header navigation (single source of truth)
  ai.ts                        Ask AI client with demo fallback
  sec.ts                       SEC EDGAR client + explainable risk scoring (server only)
agent/
  page-registry.json           every page and whether it is locked
  PAGE_REQUEST_TEMPLATE.md     how to ask the agent for a new page
.claude/agents/frontend-agent.md   the front-end agent
scripts/                       verify-pages.mjs, confirm-page.mjs
```

## Deploy

- **Vercel** (free tier): import the repo, no settings needed.
- **Vultr / any VM**: `npm ci && npm run build && npm run start -- -p 80`.
- **DuploCloud**: containerise with the standard Next.js Dockerfile and deploy through the devkit.
