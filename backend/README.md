# AccountPulse agent API (backend)

FastAPI service that runs the risk pipeline across six sponsor tools and answers questions for
the web app. Every external call falls back to sample data, so it always responds.

Full docs: [../docs/API.md](../docs/API.md) · diagrams:
[../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) · setup: [../docs/SETUP.md](../docs/SETUP.md)

## Run it

```bash
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # starts with MOCK=true, no keys needed
uvicorn app:app --reload --port 8000
```

Then open:

- http://localhost:8000/docs interactive API docs
- http://localhost:8000/scan full pipeline result
- http://localhost:8000/health status

## Endpoints

| Method | Path | What it does |
|---|---|---|
| GET | `/` | Service info |
| GET | `/health` | `{ok, mock}` |
| GET | `/scan` | Scores every account; sorted by risk; total revenue at risk |
| POST | `/ask` | `{question}` → `{answer, accounts, engine}` (contract used by the web app) |

## Pipeline (in `app.py`)

| Step | Function | Service | Mock fallback |
|---|---|---|---|
| 1 | `get_accounts()` | Merge.dev CRM | 2 sample accounts |
| 2 | `brave_news()` | Brave Search news | Sample layoff headline |
| 3 | `competitor_momentum()` | Similarweb | +38% traffic |
| 4 | `analyze()` | Crusoe (main model) | Score 82 with reasons |
| 5 | `critic()` | OpenRouter → Nebius | Approves |
| 6 | `save_graph()` | Neo4j | Skipped |

## Going live

First verify every key: `python check_keys.py` (see [SETUP.md](../docs/SETUP.md#3-set-up-and-verify-sponsor-keys)).


1. Put keys in `.env` (see the table in [SETUP.md](../docs/SETUP.md)).
2. Set `MOCK=false`. Any key still empty keeps its step on sample data.
3. Watch the terminal for `[LLM] provider=crusoe model=...` on every scored account.
4. Test each integration once with a real key before a demo; they have only been run in mock
   mode so far.

## Deploy

```bash
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 80
```

Set `ALLOWED_ORIGINS` to the deployed web app's URL.
