# AccountPulse MCP server

- **What:** exposes AccountPulse as MCP tools so Claude Desktop, Claude Code or the DuploCloud agent can use it.
- **Tools:** `list_at_risk_accounts`, `run_scan`, `get_account`, `ask_accountpulse`, `check_public_company`.
- **Needs:** the backend running on `:8000` (and the web app on `:3000` for `check_public_company`).
- **Install:** `cd mcp && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
- **Test it:** `python test_client.py` (starts the server itself and calls every tool).
- **Run for Claude (stdio):** `python accountpulse_mcp.py`
- **Run for DuploCloud / remote (HTTP):** `python accountpulse_mcp.py --http` → `http://localhost:8765/mcp`
- **Test HTTP mode:** `python test_client.py http://localhost:8765/mcp`
- **Change addresses:** `ACCOUNTPULSE_API=http://host:8000 ACCOUNTPULSE_WEB=http://host:3000 MCP_PORT=8765`
- **Local use only:** no login and DNS-rebinding protection off, so don't expose port 8765 to the internet.

## Connect a client

- **Claude Code:** `claude mcp add accountpulse -- $(pwd)/.venv/bin/python $(pwd)/accountpulse_mcp.py`
- **Claude Desktop:** add the block below to `~/Library/Application Support/Claude/claude_desktop_config.json`, then restart Claude.

```json
{
  "mcpServers": {
    "accountpulse": {
      "command": "/Users/YOU/Desktop/AccountPulse/mcp/.venv/bin/python",
      "args": ["/Users/YOU/Desktop/AccountPulse/mcp/accountpulse_mcp.py"],
      "env": { "ACCOUNTPULSE_API": "http://localhost:8000", "ACCOUNTPULSE_WEB": "http://localhost:3000" }
    }
  }
}
```

- **DuploCloud agent:** start `python accountpulse_mcp.py --http`, then in the portal:
  - **AI Admin → MCP Servers → + Add Server:** Name `accountpulse`, Config Type `HTTP/SSE`, API Endpoint `http://host.docker.internal:8765/mcp`, Transport `http`.
  - **Providers → Other → Add:** Name `accountpulse`, Account ID `accountpulse`.
  - **Credential:** name `accountpulse`, key `note`, value `local` (the server has no login).
  - **Scope:** Credential `accountpulse` + MCP Server `accountpulse`, then Attach it to your workspace.
  - **Ticket:** select the scope and ask "Who should I call today?". The agent calls `list_at_risk_accounts`.
- **Try asking:** "Which accounts are high risk?", "Run a fresh scan", "Why is Chegg at risk?", "Check NKE".
