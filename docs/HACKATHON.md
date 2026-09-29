# Hackathon guide: The AI Conference Hack Day 2026

*Event details below come from another team's public planning notes
([erikdj/ai-hackday-2026](https://github.com/erikdj/ai-hackday-2026/blob/main/docs/hackday/event-brief.md)).
Confirm them in the official rules and the Builder Terminal.*

## Rules that decide the winner

- **Crusoe is required** for the overall prizes (1st $5,000 + main-stage pitch, 2nd $3,000,
  3rd $2,000).
- **Live and end to end beats ambitious and broken.** DuploCloud's "Best Agent" is judged on
  what the agent does live; a pitch alone doesn't count.
- **Integrations only count if they do real work.** Connected-but-unused tools don't count for
  "Most Sponsor Tools".
- **Sponsor feedback earns leaderboard points.** Submit feedback on every tool you touch.

## How AccountPulse uses each sponsor

| Sponsor | Job in AccountPulse | Where in code |
|---|---|---|
| **Crusoe** | Main AI: risk score, reasons, next step, answers, Live check explanation | `backend/app.py` `analyze()`, `ask()`; `frontend/lib/sec.ts` `crusoeWhy()` |
| Merge.dev | Accounts and tickets from any CRM / help desk | `get_accounts()` |
| Brave | Customer news | `brave_news()` |
| Similarweb | Competitor traffic momentum | `competitor_momentum()` |
| OpenRouter → Nebius | Second model that can veto a verdict | `critic()` |
| Neo4j | Account → Signal → Competitor graph; relationship map page | `save_graph()`; `/dashboard/graph` |
| DuploCloud | DevKit agent that answers "who should I call?" tickets using the AccountPulse API, running on Crusoe | [DUPLOCLOUD.md](DUPLOCLOUD.md), `duplocloud/accountpulse-triage/SKILL.md` |
| Vultr | Hosting the live demo; the DuploCloud agent can manage it | [SETUP.md](SETUP.md#5-deploy) |
| UserTesting | One real user reaction to quote in the pitch | Pitch |

## Before judging (checklist)

- [ ] `cd backend && python check_keys.py` shows PASS for Crusoe and every sponsor you'll demo
- [ ] `MOCK=false` with a real `CRUSOE_API_KEY`; terminal shows `[LLM] provider=crusoe model=...`
- [ ] Each other key tested once; anything failing stays on mock (never demo a broken call)
- [ ] `cd frontend && npm run check` shows every check passing
- [ ] Deployed URL opens on a phone
- [ ] Rehearsed 3 times from a cold start
- [ ] Feedback submitted for every sponsor tool used

## Two-minute demo script

| Time | Show | Say |
|---|---|---|
| 0:00 | Landing page | "Companies lose customers they could have seen coming. The signs are scattered across CRM, news and competitors." |
| 0:15 | Overview | "$214K at risk. AccountPulse tells me who to call first, and why." |
| 0:35 | Acme account → Draft email | "Every reason has a source. A second AI double-checked it. One click writes the email." |
| 0:55 | Terminal log | "The reasoning runs on Crusoe. Here's the model ID." |
| 1:05 | Live check → CHGG | "This is real SEC data right now: delisting notice, layoffs, revenue down 50%. Score 85." |
| 1:25 | Relationship map | "Neo4j shows which rival is circling which accounts." |
| 1:40 | Ask AI: "Who should I call today?" | "Plain-English answers from your own data." |
| 1:50 | Close | "Revenue at risk found in seconds. We charge per seat. We're looking for design partners." |

## If something breaks on stage

- Any sponsor API fails → that step falls back to sample data automatically; keep going.
- Wi-Fi fails → the dashboard, Ask AI (demo mode) and every page except Live check work offline
  from a local build.
- Live check SEC call is slow → it's cached for an hour; open CHGG once before judging.
