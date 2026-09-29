# DuploCloud: set up the DevKit and build the AccountPulse agent

Based on DuploCloud's official hackday guide:
[github.com/duplocloud/devkit/tree/main/hackday](https://github.com/duplocloud/devkit/tree/main/hackday).

## What DuploCloud is here (read this first)

DuploCloud is **not an API key**. For the hackday it's the **DevKit**: the whole DuploCloud platform
running on your laptop in Docker. You build an **agent** inside it, and people file **tickets** that the
agent works on.

It's worth it because it has two prizes of its own:

- **Best Agent Overall** is judged on what the agent does live, end to end.
- **Most Sponsor Tools Meaningfully Integrated** counts only tools that actually do something.

The plan: a DuploCloud agent that uses the AccountPulse API (through a skill) and runs its own model
on **Crusoe** through OpenRouter. One ticket like "Who should I call today?" then exercises Crusoe,
Nebius, Merge.dev, Brave, Similarweb and Neo4j.

## 0. Requirements (check before starting)

| Need | Notes |
|---|---|
| Docker Desktop with Compose v2 | `docker compose version` must work (the old `docker-compose` v1 does not) |
| Python 3 | `python3 --version` |
| Claude Code | Optional; used to build custom extensions with `/duplo-extension` |
| Your OpenRouter key | You have it; it becomes the DevKit's model gateway |
| **A work email address** | Gmail, Outlook and other personal domains are **rejected** |
| Free ports | 4210, 60031, 8010, 27018, 6061, 6333 |

Install takes **20-40 minutes**, mostly Docker image downloads. Start it now and do other setup while it
downloads.

## 1. Create an OpenRouter preset pinned to Crusoe (5 minutes)

Without a preset, OpenRouter may send "Crusoe" requests to another provider.

1. [openrouter.ai](https://openrouter.ai) → left sidebar → **Presets** → **New Preset**.
2. **Name:** `duplo-crusoe-glm`. The slug becomes your model string: `@preset/duplo-crusoe-glm`.
3. **Models → Add model:** `z-ai/glm-5.3`.
4. **Provider Routing:** tick **Include Provider Preferences**, then in the list titled **`only`**
   (not `order` or `ignore`) tick **crusoe**, and set **Allow fallbacks → No**.
5. **Save Preset.** The page must show `{ "only": ["crusoe"], "allow_fallbacks": false }`.
6. Touch nothing else in the preset; any other setting overrides every agent request.

Verified pairings from DuploCloud's guide:

| Preset | Model | Provider | Context |
|---|---|---|---|
| `duplo-crusoe-glm` | `z-ai/glm-5.3` | crusoe | 1310720 |
| `duplo-crusoe-kimi` | `moonshotai/kimi-k2.6` | crusoe | 262144 |
| `duplo-nebius-glm` | `z-ai/glm-5.1` | nebius | 204800 |
| `duplo-nebius-qwen` | `qwen/qwen3-235b-a22b-2507` | nebius | 262144 |

Check the pin (replace the key):

```bash
curl -s https://openrouter.ai/api/v1/messages \
  -H "content-type: application/json" \
  -H "authorization: Bearer sk-or-v1-YOUR-KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"@preset/duplo-crusoe-glm","max_tokens":50,"messages":[{"role":"user","content":"Say only OK"}]}'
```

The response's `"provider"` must say Crusoe.

## 2. Install and start the DevKit, running on Crusoe (20-40 minutes)

```bash
cd ~/Desktop
git clone https://github.com/duplocloud/devkit duplo-devkit
cd duplo-devkit
./run.sh --model gateway \
  --gateway-url https://openrouter.ai/api \
  --gateway-token sk-or-v1-YOUR-KEY \
  --gateway-model @preset/duplo-crusoe-glm \
  --gateway-max-context-tokens 1310720 \
  --gateway-compact-window 1000000
```

- It asks for **Admin email** (use your work email) and **Admin password**.
- It then **emails you a verification link and waits up to 2 minutes**. Click it (check spam). If it
  times out, click the link anyway and re-run `./run.sh`; it resumes.
- Wait for `✔ Platform ready`, then sign in at **http://localhost:4210**. You should land in the
  **`extension-dev`** workspace.

Check it worked:

```bash
docker compose ps                                   # every service Up
cd ~/Desktop/AccountPulse/backend && python check_keys.py duplocloud   # PASS
```

Already started it with an Anthropic key? Switch to Crusoe without reinstalling:

```bash
./scripts/switch-llm.sh gateway --gateway-url https://openrouter.ai/api \
  --gateway-token sk-or-v1-YOUR-KEY --gateway-model @preset/duplo-crusoe-glm \
  --gateway-max-context-tokens 1310720 --gateway-compact-window 1000000
./scripts/switch-llm.sh status        # should print: Active provider: gateway
```

## 3. Give the agent AccountPulse (10 minutes)

Start the AccountPulse backend and web app on your laptop first (see [SETUP.md](SETUP.md)).
The agent runs inside Docker and reaches them at `host.docker.internal`.

**a. Add the skill**

1. **AI Admin → Skills → + Add**
2. Name: `accountpulse-triage`, Type: **Custom**
3. Paste the contents of `duplocloud/accountpulse-triage/SKILL.md` from this project. **Create.**

**b. Add AccountPulse as a provider (the "any other sponsor" pattern)**

1. **Administration → Providers → IT → Other → Add**
2. Provider: Name `accountpulse`, Type `Other`, Account ID `http://host.docker.internal:8000`.
   In **Description**, paste: `GET /scan scores all accounts; POST /ask {"question": "..."} answers questions.`
   (The description goes into the agent's system prompt.)
3. Credential: the local API has no login. If the wizard insists on one, add name `accountpulse`,
   key `note`, value `no-auth-local`.
4. Scope: name `accountpulse`, leave MCP Server empty. Save, then **Attach** it to your workspace.

## 4. Wire more sponsors into the agent (optional, counts for "Most Sponsor Tools")

Follow DuploCloud's guide, `Sponsor Integrations.md`, for each:

- **Neo4j:** an MCP server (`mcp-neo4j-cypher`) + provider + credential (`uri`, `username`,
  `password`, `database`) + scope. The agent can then query the same graph AccountPulse writes.
- **Vultr:** provider `Other`, Account ID `https://api.vultr.com/v2`, credential key `apikey`.
  The agent can list or create your Vultr servers, for example to deploy AccountPulse.

## 5. Demo it

1. Top navigation → **AI DevOps** → new ticket.
2. **Select Scopes:** `accountpulse` (and `neo4j-mcp-scope`, `vultr` if added). Attaching to a
   workspace makes a scope *available*; you still pick it per ticket.
3. **Advanced Options → Additional Skills:** `accountpulse-triage`.
4. Ticket text: **"Who should I call today, and what should I say?"**
5. The agent calls `/scan`, and its answer lists accounts, reasons, next steps and the model that
   scored them. Its own reasoning runs on Crusoe via your preset.

## Troubleshooting

| Problem | Fix |
|---|---|
| `./run.sh` exits naming something missing | Install what it names (Docker Compose v2 or Python 3) and re-run |
| `port is already allocated` | `lsof -nP -iTCP:4210 -sTCP:LISTEN` to find it; or change that `*_PORT` in the devkit `.env` (don't delete the line) |
| Email rejected | Use a work or school address, not Gmail/Outlook |
| Scope doesn't appear on a ticket | Attach it to the workspace, then select it on the ticket |
| Agent can't reach AccountPulse | Is the backend running on port 8000? On Linux, `host.docker.internal` may need `--add-host`; ask the desk |
| Wrong provider in OpenRouter response | Model must be `@preset/<slug>`, and Allow fallbacks must be **No** |

Help: DuploCloud sponsor desk (fastest), [Hack Day Slack](https://join.slack.com/t/hackday-brv1895/shared_invite/zt-4ar74ve28-YSK96VM1ERprQXoTIbTGBA),
or hackday@duplocloud.net.
