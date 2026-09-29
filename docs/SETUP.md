# Setup guide

## Requirements

| Tool | Version | Check |
|---|---|---|
| Node.js | 20 or newer | `node -v` |
| npm | 10 or newer | `npm -v` |
| Python | 3.10 or newer | `python3 --version` |

On a Mac: `brew install node python` if either is missing ([Homebrew](https://brew.sh)).

## 1. Web app (`frontend/`)

```bash
cd frontend
npm install                 # about 1 minute
cp .env.example .env.local
npm run dev                 # http://localhost:3000
```

Pages to open:

- http://localhost:3000 landing page
- http://localhost:3000/dashboard overview
- http://localhost:3000/dashboard/live real SEC data

### Web app environment variables (`frontend/.env.local`)

| Variable | Required | What it does |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | No | Agent API address, e.g. `http://localhost:8000`. Empty = Ask AI uses demo answers |
| `SEC_USER_AGENT` | Recommended | `"AccountPulse you@yourcompany.com"`. SEC asks every app to identify itself |
| `CRUSOE_API_KEY` | No | Lets Crusoe write the Live check explanation (server-side only) |
| `CRUSOE_MODEL` | No | Defaults to `meta-llama/Llama-3.3-70B-Instruct` |

### Web app commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` then `npm run start` | Production build and server |
| `npm run typecheck` | TypeScript check only |
| `npm run verify` | Starts the built app and checks every page (run `build` first) |
| `npm run check` | typecheck + build + verify: run before every demo or commit |
| `npm run confirm -- --list` | Show which pages are locked |
| `npm run confirm -- /dashboard/profile` | Lock a page you've approved |

## 2. Agent API (`backend/`)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app:app --reload --port 8000
```

Open http://localhost:8000/docs for interactive API docs where you can try every endpoint.

### Agent API environment variables (`backend/.env`)

| Variable | What it does | Where to get it |
|---|---|---|
| `MOCK` | `true` = sample data for everything (default). Set `false` once keys are in | n/a |
| `ALLOWED_ORIGINS` | Web app address(es) allowed to call the API | Default `http://localhost:3000` |
| `CRUSOE_API_KEY` | Main AI model | [Crusoe console](https://console.crusoecloud.com) → Intelligence Foundry |
| `OPENROUTER_API_KEY` | Critic model, routed to Nebius | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `BRAVE_API_KEY` | Customer news | [Brave Search API dashboard](https://api-dashboard.search.brave.com) |
| `SIMILARWEB_API_KEY` | Competitor traffic | Similarweb account team / sponsor desk |
| `MERGE_API_KEY`, `MERGE_ACCOUNT_TOKEN` | CRM accounts and tickets | [app.merge.dev](https://app.merge.dev) (sandbox available) |
| `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` | Graph database | [Neo4j AuraDB Free](https://neo4j.com/cloud/aura-free/) |

Any key left empty falls back to sample data for that source, so you can add keys one at a time.

**Check Crusoe first** (required for the hackathon's overall prize):

```bash
curl https://api.inference.crusoecloud.com/v1/models -H "Authorization: Bearer $CRUSOE_API_KEY"
```

## 3. Set up and verify sponsor keys

Get every key at the sponsor desks in the first half hour (some need approval or a linked sandbox
account), then add and verify them **in this order**:

| # | Sponsor | Why this order | Where to get the key | Time |
|---|---|---|---|---|
| 1 | **Crusoe** | Required for the overall prize. No key yet? Your OpenRouter key reaches Crusoe (pinned) meanwhile | Crusoe console → Intelligence Foundry → Get API key | 5 min |
| 2 | **Neo4j AuraDB** | Free and instant, but the instance takes a few minutes to start | [console.neo4j.io](https://console.neo4j.io) → download credentials file | 5 min |
| 3 | **OpenRouter → Nebius** | Critic model; proves two AI providers | [openrouter.ai/keys](https://openrouter.ai/keys) | 5 min |
| 4 | **Brave Search** | Customer news; quick sign-up | [api-dashboard.search.brave.com](https://api-dashboard.search.brave.com) | 5 min |
| 5 | **Merge.dev** | Needs a linked sandbox CRM, the slowest to set up | [app.merge.dev](https://app.merge.dev) → API keys; Linked accounts → add test account | 15 min |
| 6 | **Similarweb** | Key comes from the sponsor desk; credits are limited | Sponsor desk | varies |
| 7 | **Vultr** | Needed only when you deploy | Add a payment method, then account name → Manage User → Access → API Access → Enable; add your IP | 10 min |
| 8 | **DuploCloud** | Not a key: a local platform (DevKit) where you build an agent. Start the install early; it takes 20-40 min | [docs/DUPLOCLOUD.md](DUPLOCLOUD.md) | 30-45 min |
| 9 | **UserTesting** | One real user reaction for the pitch | Sponsor desk | varies |

**Where to put the keys:** fill in `KEYS.env` in the project root. It lists every variable
with where to get it, and the backend reads it automatically. Copy its WEB APP lines into
`frontend/.env.local`.

Then run the checker from `backend/`:

```bash
python check_keys.py                 # all sponsors
python check_keys.py crusoe neo4j    # just some
```

Example output:

```
  PASS  Crusoe (required)          meta-llama/Llama-3.3-70B-Instruct answered in 0.8s (key ...a1b2)
  FAIL  Brave Search               HTTP 422: key rejected
                                   Fix: Check the key in the Brave API dashboard and that a plan is active.
  SKIP  Similarweb                 SIMILARWEB_API_KEY not set
```

- Each check uses the smallest read-only call that proves the key works. Crusoe and
  OpenRouter send one 5-token prompt (a fraction of a cent); Similarweb's check uses no credits.
- Keys are never printed, only their last 4 characters.
- The OpenRouter check forces the Nebius provider with no fallback, so a PASS proves the Nebius
  route works.
- DuploCloud has no key; its check confirms the DevKit is running (portal on port 4210, platform API
  healthy on 60031). Setup: [DUPLOCLOUD.md](DUPLOCLOUD.md).
- With no `CRUSOE_API_KEY`, the Crusoe check (and the backend) use your OpenRouter key pinned to
  Crusoe's GPUs, so Crusoe still does the reasoning.
- When everything you need passes, set `MOCK=false` in `.env` and restart the API.

## 4. Connect the two

1. Start the agent API on port 8000.
2. In `frontend/.env.local` set `NEXT_PUBLIC_API_URL=http://localhost:8000`.
3. Restart `npm run dev`. The Ask AI page now calls the API; answers show "Answered by
   Crusoe" once `CRUSOE_API_KEY` is set and `MOCK=false`.

## 5. Deploy

| Part | Easiest option | Command / steps |
|---|---|---|
| Web app | [Vercel](https://vercel.com) (free tier) | Import the repo, set root directory to `frontend`, add env vars |
| Web app | Vultr VM | `npm ci && npm run build && npm run start -- -p 80` |
| Agent API | Vultr VM | `pip install -r requirements.txt && uvicorn app:app --host 0.0.0.0 --port 80` |
| Agent API | Vultr (via the DuploCloud agent) | Ask your DuploCloud agent to create a Vultr server, then run the command above on it. The DevKit itself is for local development only |

After deploying, set `ALLOWED_ORIGINS` on the API to the web app's real URL.

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm run verify` says port 3100 is in use | An old server is running. Stop it, or run `BASE_URL=http://localhost:3000 npm run verify` against your dev server |
| Live check says "SEC EDGAR returned 403" | Set `SEC_USER_AGENT` with a real email in `frontend/.env.local` and restart |
| Live check says "No U.S. public company found" | Use the U.S. stock ticker (e.g. `NKE`, not `Nike`). Private companies aren't in SEC data |
| Ask AI answers say "demo data" | `NEXT_PUBLIC_API_URL` isn't set, or the API isn't running on that address |
| Browser console shows a CORS error | Add the web app's address to `ALLOWED_ORIGINS` in `backend/.env` and restart the API |
| `pip install` fails on a Mac | Use the virtual environment (`python3 -m venv .venv`) rather than system Python |
| Fonts look plain | The page loads Sora and Manrope from Google Fonts; check your internet connection |
