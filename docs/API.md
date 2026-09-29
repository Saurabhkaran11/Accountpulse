# API reference

AccountPulse has two APIs:

| API | Runs in | Base URL (local) |
|---|---|---|
| Web app server routes | `frontend/` (Next.js) | `http://localhost:3000` |
| Agent API | `backend/` (FastAPI) | `http://localhost:8000` (interactive docs at `/docs`) |

All responses are JSON. The example responses below were captured from the running apps on
Sep 29, 2026 (shortened where marked).

---

## Web app routes

### `GET /api/live/{ticker}`

Scores a U.S. public company from its real SEC EDGAR filings. Free, no API key.

| Parameter | In | Example | Notes |
|---|---|---|---|
| `ticker` | path | `NKE` | U.S. stock ticker, 1-6 letters |

```bash
curl http://localhost:3000/api/live/NKE
```

Response `200` (events and quarters shortened):

```json
{
  "company": { "name": "NIKE, Inc.", "ticker": "NKE", "cik": "0000320187", "industry": "Rubber & Plastics Footwear" },
  "risk": 50,
  "reasons": [
    "Announced restructuring or layoffs (SEC filing, 2026-03-05)",
    "Ended a major contract (SEC filing, 2026-03-09)",
    "Executive or board member left or joined (SEC filing, 2026-09-16)"
  ],
  "play": "Budgets are being cut. Book a value review showing the savings you deliver before renewal.",
  "why": "NIKE, Inc. has 3 signals in its SEC filings: announced restructuring or layoffs; ended a major contract; executive or board member left or joined.",
  "whyEngine": "rules",
  "revenue": {
    "quarters": [ { "label": "2025Q4", "value": 12427000000 }, { "label": "2026Q1", "value": 11279000000 } ],
    "yoyChange": 0.1
  },
  "events": [
    {
      "date": "2026-09-16",
      "form": "8-K",
      "items": [
        { "code": "5.02", "label": "Executive or board member left or joined", "weight": 10 },
        { "code": "7.01", "label": "Made a public disclosure", "weight": 0 }
      ],
      "url": "https://www.sec.gov/Archives/edgar/data/320187/000032018726000170/nke-20260915.htm"
    }
  ],
  "source": "SEC EDGAR",
  "fetchedAt": "2026-09-29T19:26:11.205Z"
}
```

| Field | Meaning |
|---|---|
| `risk` | 0-100. 70+ high risk, 40-69 watch, under 40 healthy |
| `reasons` | Strongest first; each names its filing date |
| `whyEngine` | `rules` (built-in summary) or `crusoe` (when `CRUSOE_API_KEY` is set) |
| `revenue.yoyChange` | % change of the latest quarter vs the same quarter a year earlier; `null` if unavailable |
| `events[].items[].weight` | Points that item added to the score (0 = routine, shown for context) |

Errors:

| Status | When | Body |
|---|---|---|
| 400 | Ticker format invalid | `{"error": "Enter a stock ticker like ZM or INTC."}` |
| 404 | No such company | `{"error": "No U.S. public company found for \"ZZZZQ\". Check the stock ticker."}` |
| 502 | SEC unavailable | `{"error": "SEC EDGAR returned 503. Try again in a minute."}` |

Caching: SEC responses are cached for 1 hour on the server, and the route sends
`Cache-Control: s-maxage=3600, stale-while-revalidate=86400`.

### Scoring rules (from `frontend/lib/sec.ts`)

| 8-K item | Meaning | Points |
|---|---|---|
| 1.03 | Bankruptcy | +45 |
| 3.01 | Stock exchange delisting notice | +30 |
| 2.05 | Restructuring or layoffs | +25 |
| 5.01 | Change in control | +25 |
| 4.02 | Past financial statements can't be relied on | +20 |
| 1.02 | Ended a major contract | +15 |
| 2.01 | Completed acquisition or sale of assets | +12 |
| 5.02 | Executive or board change | +10 |
| 2.06 | Asset write-down | +10 |

Start at 20. Each item type counts once at full weight if filed within 90 days, half within 180
days, a quarter within 365 days; repeats add 2. Revenue down more than 5% year over year adds
20, down 0-5% adds 10, up more than 10% subtracts 10. The result is clamped to 0-100.

---

## Agent API

### `GET /health`

```bash
curl http://localhost:8000/health
```

```json
{ "ok": true, "mock": true }
```

### `GET /scan`

Runs the full pipeline (Merge.dev → Brave → Similarweb → Crusoe → critic → Neo4j) over every
account and returns them sorted by risk. With `MOCK=true` it returns sample data.

```bash
curl http://localhost:8000/scan
```

Response `200` in mock mode (one account shown):

```json
{
  "revenue_at_risk": 214000,
  "accounts": [
    {
      "account": { "name": "Acme Logistics", "domain": "acmelogistics.com", "arr": 120000, "competitor": "routewise.com", "open_tickets": 7 },
      "news": ["Acme Logistics announces 15% layoffs and vendor consolidation review"],
      "competitor": { "domain": "routewise.com", "visits_change_pct": 38.0 },
      "verdict": {
        "risk_score": 82,
        "reasons": ["Layoffs announced", "Competitor traffic +38%", "7 open tickets"],
        "play": "Exec sponsor call this week + offer migration-lock discount",
        "provider": "mock"
      },
      "critic": { "approve": true, "note": "Evidence supports the score." }
    }
  ]
}
```

- `verdict.provider` shows `crusoe:<model>` when Crusoe produced it: show this to judges.
- If the critic vetoes, `risk_score` is capped at 50 and a "Critic veto: ..." reason is added.
- `revenue_at_risk` sums yearly revenue of accounts scoring 70 or more.

### `POST /ask`

Answers a plain-English question using the latest scan.

```bash
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Who should I call today?"}'
```

```json
{
  "answer": "Start with Acme Logistics: risk 82. Next step: Exec sponsor call this week + offer migration-lock discount",
  "accounts": [],
  "engine": "demo"
}
```

This is the contract the web app expects (`frontend/lib/ai.ts`): `answer`, `accounts`, and
`engine` (`demo` or `crusoe`). `accounts` stays empty until the API returns the web app's
Account shape.

### `GET /docs`

Interactive documentation generated by FastAPI. Try every endpoint from the browser.

---

## Live dashboard endpoints (added for the live demo)

- `GET /accounts`: latest scan in the web app's Account format (runs a first scan if none yet).
- `GET /accounts/{id}`: one account, e.g. `/accounts/chegg`; 404 if not in the latest scan.
- `POST /scan`: fresh scan (the dashboard's Run scan button); returns the same shape as `GET /accounts`.
- `POST /ask`: now returns the accounts it mentions in `accounts`, so the chat shows clickable chips.
- Each account carries `provider` (scoring model), `criticProvider` (fact-check model) and `criticNote`.
- MCP tools wrapping these endpoints: see [../mcp/README.md](../mcp/README.md).

## Planned endpoints

| Endpoint | Purpose |
|---|---|
| `POST /draft` | Crusoe writes a rescue email in the account owner's voice |
| `GET /accounts`, `GET /accounts/{id}` | Saved accounts and score history from the database |
| `POST /watchlist` | Save Live check companies and re-check them daily |
| `POST /feedback` | Thumbs up/down on an alert, to improve scoring |
