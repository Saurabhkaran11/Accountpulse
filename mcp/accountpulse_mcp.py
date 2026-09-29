"""
AccountPulse MCP server: exposes AccountPulse as tools any MCP client can call
(Claude Desktop, Claude Code, the DuploCloud agent, ...).

Tools
  list_at_risk_accounts   accounts from the latest scan, highest risk first
  run_scan                fresh scan across Brave/Similarweb/Crusoe/Nebius/Neo4j
  get_account             one account's score, reasons, evidence and next step
  ask_accountpulse        plain-English question, answered by Crusoe
  check_public_company    real SEC EDGAR risk check for a U.S. stock ticker

It is a thin wrapper over the running AccountPulse services:
  ACCOUNTPULSE_API  backend  (default http://localhost:8000)
  ACCOUNTPULSE_WEB  web app  (default http://localhost:3000, for check_public_company)

Run
  python accountpulse_mcp.py            # stdio: Claude Desktop / Claude Code
  python accountpulse_mcp.py --http     # HTTP on :8765/mcp: DuploCloud agent, remote clients
"""
import os
import sys

import httpx
from mcp.server.fastmcp import FastMCP
from mcp.server.transport_security import TransportSecuritySettings

API = os.getenv("ACCOUNTPULSE_API", "http://localhost:8000").rstrip("/")
WEB = os.getenv("ACCOUNTPULSE_WEB", "http://localhost:3000").rstrip("/")
PORT = int(os.getenv("MCP_PORT", "8765"))

mcp = FastMCP(
    "accountpulse",
    instructions=(
        "AccountPulse finds customer accounts likely to churn. Use list_at_risk_accounts to see who to call, "
        "get_account for one account's evidence, run_scan to refresh, ask_accountpulse for questions, and "
        "check_public_company for a public company's SEC-based risk. Report only what the tools return."
    ),
    host=os.getenv("MCP_HOST", "0.0.0.0"),
    port=PORT,
    # Local hackathon use: allow calls from Docker containers (host.docker.internal) and LAN.
    transport_security=TransportSecuritySettings(enable_dns_rebinding_protection=False),
)


class ServiceDown(Exception):
    pass


async def _request(method: str, url: str, body: dict | None = None, timeout: float = 180):
    try:
        async with httpx.AsyncClient(timeout=timeout) as c:
            r = await c.request(method, url, json=body)
            r.raise_for_status()
            return r.json()
    except httpx.ConnectError as e:
        where = "web app (npm run dev)" if url.startswith(WEB) else "backend (uvicorn app:app --port 8000)"
        raise ServiceDown(f"AccountPulse {where} isn't reachable at {url.split('/api')[0] if '/api' in url else url.rsplit('/', 1)[0]}. Start it and retry.") from e


async def _get(url: str, timeout: float = 120):
    return await _request("GET", url, timeout=timeout)


async def _post(url: str, body: dict | None = None, timeout: float = 180):
    return await _request("POST", url, body, timeout)


def _summary(a: dict) -> dict:
    """The fields an agent needs, without the long evidence list."""
    return {k: a.get(k) for k in ("id", "name", "risk", "arr", "renewalDate", "openTickets",
                                  "why", "play", "criticVerified", "provider")}


@mcp.tool()
async def list_at_risk_accounts(limit: int = 5, min_risk: int = 0) -> dict:
    """List accounts from the latest AccountPulse scan, highest churn risk first.

    Args:
        limit: maximum number of accounts to return (default 5)
        min_risk: only return accounts scoring at least this (0-100; 70+ is high risk)
    """
    try:
        data = await _get(f"{API}/accounts")
    except ServiceDown as e:
        return {"error": str(e)}
    accts = [a for a in data["accounts"] if a["risk"] >= min_risk][:limit]
    return {"source": data["source"], "scanned_at": data["scannedAt"],
            "revenue_at_risk": data["revenueAtRisk"], "accounts": [_summary(a) for a in accts]}


@mcp.tool()
async def run_scan() -> dict:
    """Run a fresh AccountPulse scan: news (Brave), competitor traffic (Similarweb), scoring (Crusoe),
    fact-check (Nebius) and graph update (Neo4j). Takes 20-60 seconds."""
    try:
        data = await _post(f"{API}/scan")
    except ServiceDown as e:
        return {"error": str(e)}
    return {"source": data["source"], "scanned_at": data["scannedAt"], "revenue_at_risk": data["revenueAtRisk"],
            "accounts": [_summary(a) for a in data["accounts"]]}


@mcp.tool()
async def get_account(account: str) -> dict:
    """Full detail for one account: risk score, reasons, evidence with sources and links, and the next step.

    Args:
        account: account id or name, e.g. "chegg" or "Chegg"
    """
    try:
        data = await _get(f"{API}/accounts")
    except ServiceDown as e:
        return {"error": str(e)}
    key = account.strip().lower()
    for a in data["accounts"]:
        if key in (a["id"], a["name"].lower()):
            return a
    return {"error": f"No account '{account}'. Known: {', '.join(a['name'] for a in data['accounts'])}"}


@mcp.tool()
async def ask_accountpulse(question: str) -> dict:
    """Ask a plain-English question about the accounts (answered by Crusoe from the latest scan).

    Args:
        question: e.g. "Who should I call today, and what should I say?"
    """
    try:
        data = await _post(f"{API}/ask", {"question": question})
    except ServiceDown as e:
        return {"error": str(e)}
    return {"answer": data["answer"], "engine": data["engine"],
            "accounts": [a.get("name") for a in data.get("accounts", [])]}


@mcp.tool()
async def check_public_company(ticker: str) -> dict:
    """Risk check for a U.S. public company from its real SEC EDGAR filings (layoffs, bankruptcy,
    leadership changes, revenue trend).

    Args:
        ticker: U.S. stock ticker, e.g. "NKE" or "CHGG"
    """
    try:
        return await _get(f"{WEB}/api/live/{ticker.strip().upper()}", timeout=60)
    except ServiceDown as e:
        return {"error": str(e)}
    except httpx.HTTPStatusError as e:
        return {"error": e.response.json().get("error", str(e))}


if __name__ == "__main__":
    if "--http" in sys.argv:
        print(f"AccountPulse MCP server on http://localhost:{PORT}/mcp (API {API}, web {WEB})", file=sys.stderr)
        mcp.run(transport="streamable-http")
    else:
        mcp.run()  # stdio
