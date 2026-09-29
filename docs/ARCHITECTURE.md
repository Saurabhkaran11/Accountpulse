# Architecture and sequence diagrams

Each diagram below is shown twice: as an image (works anywhere) and as Mermaid source (GitHub
renders it; edit the matching file in `diagrams/`). **Live** means it runs today; **planned**
means the design for the next step.

## 1. System overview

![System architecture](diagrams/00-system-architecture.png)

- **Frontend** (Next.js) serves the dashboard and one server route, `/api/live/[ticker]`,
  which reads SEC EDGAR directly. Keys used there never reach the browser.
- **Agent API** (FastAPI) runs the multi-source risk pipeline and answers questions.
- **Data and AI services** are called only from servers, never from the browser.

<details><summary>Mermaid source</summary>

```mermaid
flowchart LR
  U([Customer success manager]) --> FE

  subgraph FE[Frontend - Next.js 16 on Vercel or Vultr]
    P[Dashboard pages<br/>React 19 + Tailwind + framer-motion]
    R["/api/live/:ticker<br/>Next.js route handler"]
  end

  subgraph BE[Agent API - FastAPI on Vultr or DuploCloud]
    S["/scan pipeline"]
    A["/ask"]
  end

  P -- fetch --> R
  P -- "fetch (NEXT_PUBLIC_API_URL)" --> A
  P -. "Run scan (planned)" .-> S

  R --> SEC[(SEC EDGAR<br/>filings + revenue)]
  R -. optional .-> CR

  S --> MG[Merge.dev<br/>CRM + tickets]
  S --> BR[Brave Search<br/>news]
  S --> SW[Similarweb<br/>competitor traffic]
  S --> CR[Crusoe<br/>LLM reasoning]
  S --> OR[OpenRouter to Nebius<br/>critic model]
  S --> NJ[(Neo4j AuraDB<br/>knowledge graph)]
  A --> CR
  A -. planned text-to-Cypher .-> NJ
```
</details>

## 2. Live check with real SEC data (live)

A user checks any U.S. public company. This flow runs today with real data and no API key.

![Live check sequence](diagrams/01-live-check.png)

Key points:

- Filings and revenue are fetched in parallel, and every SEC response is cached for one hour
  (SEC allows up to 10 requests per second and asks for a contact email in the User-Agent).
- The score is rule-based and explainable: each 8-K event type adds a fixed weight, recent events
  count more, and each type counts once. Crusoe only rephrases the facts; it never invents them.
- Unknown tickers return a 404 with a message the page shows as-is.

<details><summary>Mermaid source</summary>

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant UI as Live check page (browser)
  participant Route as /api/live/[ticker] (Next.js server)
  participant Lib as lib/sec.ts
  participant SEC as SEC EDGAR
  participant Crusoe as Crusoe LLM (optional)

  User->>UI: Types NKE or clicks an example
  UI->>UI: Show loading pulse line
  UI->>Route: GET /api/live/NKE
  Route->>Lib: getLiveSignals("NKE")
  Lib->>SEC: GET company_tickers.json (cached 1h)
  SEC-->>Lib: ticker to CIK
  par Filings and revenue in parallel
    Lib->>SEC: GET submissions/CIK.json
    SEC-->>Lib: recent 8-K filings with item codes
  and
    Lib->>SEC: GET companyconcept revenue (XBRL)
    SEC-->>Lib: quarterly revenue
  end
  Lib->>Lib: Score 8-K items (layoffs, bankruptcy, exec change) and revenue trend
  Lib->>Lib: Pick next step from strongest signal
  opt CRUSOE_API_KEY is set
    Lib->>Crusoe: Explain these facts in 2 sentences
    Crusoe-->>Lib: Plain-English explanation
  end
  Lib-->>Route: LiveResult JSON
  Route-->>UI: 200 JSON (or 404 with a helpful message)
  UI-->>User: Risk ring, reasons, revenue bars, filing links
```
</details>

## 3. Daily risk scan (live in mock mode; planned: scheduled + wired to the button)

The core AccountPulse pipeline, one pass per account.

![Risk scan sequence](diagrams/02-risk-scan.png)

Key points:

- Every external call has a mock fallback, so the pipeline always completes.
- The critic model is a separate provider (OpenRouter routed to Nebius). If it vetoes a verdict,
  the score is capped at 50 and the veto reason is shown to the user.
- News text is passed to the model as data with an explicit instruction not to follow it, to
  limit prompt injection from outside content.

<details><summary>Mermaid source</summary>

```mermaid
sequenceDiagram
  autonumber
  actor CSM as User or daily scheduler
  participant UI as Dashboard
  participant API as FastAPI /scan
  participant Merge as Merge.dev
  participant Brave as Brave Search
  participant SW as Similarweb
  participant Crusoe as Crusoe LLM
  participant Critic as OpenRouter to Nebius
  participant Graph as Neo4j

  CSM->>UI: Click Run scan
  UI->>API: GET /scan
  API->>Merge: List accounts and open tickets
  Merge-->>API: Accounts
  loop For each account
    API->>Brave: News about the customer (last month)
    Brave-->>API: Headlines
    API->>SW: Competitor traffic, last 90 days
    SW-->>API: Visits change %
    API->>Crusoe: Score risk from account, news, momentum
    Crusoe-->>API: risk_score, reasons, play (JSON)
    API->>Critic: Is this verdict justified?
    Critic-->>API: approve or veto with note
    alt Critic vetoes
      API->>API: Cap score at 50 and add veto reason
    end
    API->>Graph: MERGE Account, Signal, Competitor
  end
  API->>API: Sort by risk, total revenue at risk
  API-->>UI: Accounts with reasons and next steps
  UI-->>CSM: Overview updates, toast "Scan complete"
```
</details>

## 4. Ask AI (live with demo fallback; planned: text-to-Cypher)

![Ask AI sequence](diagrams/03-ask-ai.png)

Key points:

- The chat never breaks: if the API is unset or fails, `lib/ai.ts` answers from demo data.
- Every answer says what produced it ("Answered by Crusoe" or "demo data").
- Planned: the API turns the question into a Neo4j Cypher query, so answers come from the graph
  rather than from the model's memory.

<details><summary>Mermaid source</summary>

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant Search as Top search bar
  participant Chat as Ask AI page
  participant Client as lib/ai.ts
  participant API as FastAPI /ask
  participant Crusoe as Crusoe LLM
  participant Graph as Neo4j (planned)

  User->>Search: Types "who should I call today"
  Search->>Chat: Open /dashboard/ask?q=...
  Chat->>Client: askAccountPulse(question)
  alt NEXT_PUBLIC_API_URL is set
    Client->>API: POST /ask {question}
    API->>API: Load latest scan results
    opt Planned: text-to-Cypher
      API->>Graph: Generated Cypher query
      Graph-->>API: Matching accounts
    end
    API->>Crusoe: Answer using only this data
    Crusoe-->>API: 2-3 sentence answer
    API-->>Client: {answer, accounts, engine: "crusoe"}
  else API missing or failing
    Client->>Client: Demo answer from lib/data.ts
  end
  Client-->>Chat: AskResult
  Chat-->>User: Answer bubble, account chips, "Answered by ..."
```
</details>

## 5. Rescue email draft (live with a template; planned: Crusoe-written)

![Rescue email sequence](diagrams/04-rescue-email.png)

<details><summary>Mermaid source</summary>

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant Page as Account detail page
  participant AI as Draft generator
  participant Clip as Clipboard
  participant Toast as Toast

  User->>Page: Open Acme Logistics (risk 86)
  Page-->>User: Why this score, evidence, critic badge, next step
  User->>Page: Click Draft email
  Page->>AI: Account facts and recommended step
  Note over AI: Today: template from account data<br/>Next: Crusoe writes it in the owner's voice
  AI-->>Page: Draft email text
  Page-->>User: Types the draft out live
  User->>Page: Click Copy
  Page->>Clip: writeText(draft)
  Page->>Toast: "Email copied"
  User->>Page: Click Mark as contacted
  Page->>Toast: "Marked Acme Logistics as contacted"
```
</details>

## 6. Front-end agent workflow (live)

How new pages get built without breaking approved ones.

![Front-end agent sequence](diagrams/05-frontend-agent.png)

<details><summary>Mermaid source</summary>

```mermaid
sequenceDiagram
  autonumber
  actor Owner
  participant Agent as frontend-agent (Claude Code)
  participant Spec as frontend-agent.md + page-registry.json
  participant Code as Next.js codebase
  participant Check as npm run check

  Owner->>Agent: Page request (PAGE_REQUEST_TEMPLATE.md)
  Agent->>Spec: Read design system, layout contract, locked pages
  Agent->>Code: Add or edit page, register it as draft
  loop Until every check passes
    Agent->>Check: typecheck, build, verify
    Check-->>Agent: Pass or failures
    alt A check fails
      Agent->>Code: Fix the error
    end
  end
  Agent-->>Owner: Added, Changed, Not done yet, Next step, Checks
  Owner->>Owner: Review the page in the browser
  Owner->>Spec: npm run confirm -- /dashboard/page
  Note over Spec,Check: Confirmed pages can be improved,<br/>never deleted. verify fails if one goes missing.
```
</details>

## Data model

Types live in `frontend/lib/data.ts` (web app) and `frontend/lib/sec.ts` (Live check).

| Entity | Key fields |
|---|---|
| Account | id, name, domain, industry, arr, renewalDate, risk (0-100), trend[8 weeks], owner, openTickets, competitor, why, evidence[], play, criticVerified |
| Evidence | label, detail, source (Merge.dev, Brave, Similarweb, Crusoe, Nebius critic, Neo4j, SEC EDGAR), url |
| Signal | id, accountId, title, source, when, severity (high/medium/low) |
| Competitor | name, domain, visitsChange %, accountsExposed, headline |
| RescueAction | id, accountId, type (Email/Call/Offer), title, draft, status (Draft/Sent/Done) |
| LiveResult | company, risk, reasons[], play, why, whyEngine, revenue{quarters, yoyChange}, events[] |

Neo4j graph (written by `/scan`):

```
(:Account {name, arr, risk, play})-[:HAS_SIGNAL]->(:Signal {text})
(:Account)-[:AT_RISK_FROM]->(:Competitor {domain, momentum})
```

## Security notes

- API keys live only in server-side `.env` files; the browser only ever sees
  `NEXT_PUBLIC_API_URL`.
- The agent API only accepts browser calls from origins listed in `ALLOWED_ORIGINS`.
- Not yet built (see [ROADMAP.md](ROADMAP.md)): login, per-customer data separation, encrypted
  storage, audit logs.
