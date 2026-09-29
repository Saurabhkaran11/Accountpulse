"""
MCP client that checks the AccountPulse MCP server end to end.

    python test_client.py                           # starts the server over stdio
    python test_client.py http://localhost:8765/mcp # connects to a running HTTP server
"""
import asyncio
import json
import os
import sys

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp.client.streamable_http import streamablehttp_client


def show(name, result):
    text = result.content[0].text if result.content else ""
    print(f"\n== {name} ==\n{json.dumps(json.loads(text), indent=1)[:700] if text.startswith('{') else text[:700]}")


async def exercise(session: ClientSession):
    await session.initialize()
    tools = await session.list_tools()
    print("Tools:", ", ".join(t.name for t in tools.tools))
    show("list_at_risk_accounts", await session.call_tool("list_at_risk_accounts", {"limit": 3}))
    show("get_account", await session.call_tool("get_account", {"account": "chegg"}))
    show("ask_accountpulse", await session.call_tool("ask_accountpulse", {"question": "Who should I call first?"}))
    show("check_public_company", await session.call_tool("check_public_company", {"ticker": "NKE"}))


async def main():
    if len(sys.argv) > 1 and sys.argv[1].startswith("http"):
        async with streamablehttp_client(sys.argv[1]) as (read, write, _):
            async with ClientSession(read, write) as s:
                await exercise(s)
    else:
        # Pass our environment through so ACCOUNTPULSE_API / ACCOUNTPULSE_WEB reach the server.
        params = StdioServerParameters(command=sys.executable, args=["accountpulse_mcp.py"], env=dict(os.environ))
        async with stdio_client(params) as (read, write):
            async with ClientSession(read, write) as s:
                await exercise(s)
    print("\nAll tools answered.")


asyncio.run(main())
