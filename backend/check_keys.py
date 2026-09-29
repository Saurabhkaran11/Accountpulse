#!/usr/bin/env python3
"""
check_keys.py - verify every AccountPulse sponsor key with one command.

    cd backend
    python check_keys.py                  # check everything in .env
    python check_keys.py crusoe neo4j     # check only some sponsors

Each check makes the smallest read-only call that proves the key works:
listing models, reading account info, or one tiny search. Two checks
(Crusoe and OpenRouter/Nebius) send a 5-token prompt, which costs a fraction
of a cent. Nothing is created, changed or deleted.

Keys are never printed; only their last 4 characters are shown.

Status meanings:
  PASS  the key works
  FAIL  the key is set but rejected or broken - see the "Fix" line
  WARN  the key works but something needs attention (e.g. low credits)
  SKIP  no key in .env yet

Exit code is 1 if any check fails, so it can run in CI.
"""
import os
import sys
import time

import requests

def _load_settings():
    """
    Read keys from backend/.env and the project-wide KEYS.env.
    Priority: real environment variables > non-empty backend/.env > KEYS.env.
    Empty values never hide a key filled in elsewhere.
    """
    from pathlib import Path
    from dotenv import dotenv_values
    here = Path(__file__).resolve().parent
    merged = {k: v for k, v in dotenv_values(here.parent / "KEYS.env").items() if v}
    merged.update({k: v for k, v in dotenv_values(here / ".env").items() if v})
    for k, v in merged.items():
        if not os.environ.get(k):
            os.environ[k] = v


_load_settings()

env = os.getenv
TIMEOUT = 20

# Terminal colours (disabled when output isn't a terminal)
COLOR = sys.stdout.isatty()
C = {"PASS": "\033[32m", "FAIL": "\033[31m", "WARN": "\033[33m", "SKIP": "\033[90m", "END": "\033[0m"}


def mask(v):
    return f"...{v[-4:]}" if v and len(v) > 8 else "(set)"


class Result:
    def __init__(self, status, detail, fix=""):
        self.status, self.detail, self.fix = status, detail, fix


def http_error(r, fix_auth):
    """Turn an HTTP response into a readable FAIL."""
    # Brave reports an invalid key as 422 SUBSCRIPTION_TOKEN_INVALID instead of 401
    if r.status_code in (401, 403) or "TOKEN_INVALID" in r.text:
        return Result("FAIL", f"HTTP {r.status_code}: key rejected", fix_auth)
    if r.status_code == 429:
        return Result("WARN", "HTTP 429: rate limited or out of credits", "Wait a minute or ask the sponsor desk for more credits.")
    return Result("FAIL", f"HTTP {r.status_code}: {r.text[:160].strip()}", "Check the base URL and your plan; ask the sponsor desk.")


# ---------------------------------------------------------------- checks ---

def _openrouter_pinned_chat(key, model, provider):
    """One 5-token prompt through OpenRouter, allowed on a single provider only."""
    return requests.post("https://openrouter.ai/api/v1/chat/completions", timeout=60,
                         headers={"Authorization": f"Bearer {key}"}, json={
                             "model": model, "max_tokens": 5,
                             "provider": {"only": [provider], "allow_fallbacks": False},
                             "messages": [{"role": "user", "content": "Reply with OK"}]})


def check_crusoe():
    key = env("CRUSOE_API_KEY")
    if not key:
        # No direct key yet: Crusoe GPUs can still be reached through OpenRouter pinned to Crusoe.
        or_key = env("OPENROUTER_API_KEY")
        if not or_key:
            return Result("SKIP", "CRUSOE_API_KEY not set (and no OpenRouter key to reach Crusoe through)",
                          "REQUIRED for the overall prize. Crusoe console > Intelligence Foundry > Get API key.")
        model = env("CRUSOE_VIA_OPENROUTER_MODEL", "z-ai/glm-5.3")
        r = _openrouter_pinned_chat(or_key, model, "crusoe")
        if r.status_code in (401, 403):
            return Result("FAIL", "No Crusoe key, and your OpenRouter key was rejected (see the OpenRouter line)",
                          "Fix the OpenRouter key, or get a direct Crusoe key from the Crusoe desk.")
        if not r.ok:
            return Result("FAIL", f"No Crusoe key, and OpenRouter couldn't run {model} on Crusoe: HTTP {r.status_code} {r.text[:100]}",
                          "Get a direct key from the Crusoe desk, or set CRUSOE_VIA_OPENROUTER_MODEL to moonshotai/kimi-k2.6.")
        return Result("PASS", f"via OpenRouter: {model} served by {r.json().get('provider', 'Crusoe')} "
                              "(add CRUSOE_API_KEY later for the direct route)")
    base = env("CRUSOE_BASE_URL", "https://api.inference.crusoecloud.com/v1").rstrip("/")
    model = env("CRUSOE_MODEL", "meta-llama/Llama-3.3-70B-Instruct")
    h = {"Authorization": f"Bearer {key}"}
    r = requests.get(f"{base}/models", headers=h, timeout=TIMEOUT)
    if not r.ok:
        return http_error(r, "Create a new Inference API key in the Crusoe console and paste it into CRUSOE_API_KEY.")
    ids = [m.get("id") for m in r.json().get("data", [])]
    if model not in ids:
        return Result("FAIL", f"Key works, but model '{model}' isn't available ({len(ids)} models found)",
                      f"Set CRUSOE_MODEL to one of: {', '.join(ids[:5])}")
    t = time.time()
    r = requests.post(f"{base}/chat/completions", headers=h, timeout=60,
                      json={"model": model, "max_tokens": 5, "messages": [{"role": "user", "content": "Reply with OK"}]})
    if not r.ok:
        return http_error(r, "Key can list models but not run them: ask the Crusoe desk to enable inference.")
    return Result("PASS", f"{model} answered in {time.time() - t:.1f}s (key {mask(key)})")


def check_openrouter_nebius():
    key = env("OPENROUTER_API_KEY")
    if not key:
        return Result("SKIP", "OPENROUTER_API_KEY not set", "Create one at https://openrouter.ai/keys")
    h = {"Authorization": f"Bearer {key}"}
    r = requests.get("https://openrouter.ai/api/v1/key", headers=h, timeout=TIMEOUT)
    if not r.ok:
        return http_error(r, "Create a new key at https://openrouter.ai/keys")
    info = r.json().get("data", {})
    remaining = info.get("limit_remaining")
    # Prove the Nebius route works: force the Nebius provider, no fallbacks.
    model = env("CRITIC_MODEL", "z-ai/glm-5.1")
    r = _openrouter_pinned_chat(key, model, "nebius")
    if not r.ok:
        return Result("FAIL", f"Key works, but routing '{model}' to Nebius failed: HTTP {r.status_code} {r.text[:120]}",
                      "Set CRITIC_MODEL=z-ai/glm-5.1 or qwen/qwen3-235b-a22b-2507 (both verified on Nebius).")
    provider = r.json().get("provider", "unknown")
    detail = f"{model} served by {provider}"
    if remaining is not None and remaining < 1:
        return Result("WARN", f"{detail}; credits remaining: {remaining}", "Add credits or ask the sponsor desk.")
    return Result("PASS", f"{detail} (key {mask(key)})")


def check_nebius_direct():
    key = env("NEBIUS_API_KEY")
    if not key:
        return Result("SKIP", "NEBIUS_API_KEY not set (optional: Nebius already runs via OpenRouter)",
                      "Only needed to call Nebius directly: https://tokenfactory.nebius.com")
    base = env("NEBIUS_BASE_URL", "https://api.tokenfactory.nebius.com/v1").rstrip("/")
    r = requests.get(f"{base}/models", headers={"Authorization": f"Bearer {key}"}, timeout=TIMEOUT)
    if not r.ok:
        return http_error(r, "Create a key in Nebius Token Factory and paste it into NEBIUS_API_KEY.")
    return Result("PASS", f"{len(r.json().get('data', []))} models available (key {mask(key)})")


def check_brave():
    key = env("BRAVE_API_KEY")
    if not key:
        return Result("SKIP", "BRAVE_API_KEY not set: free Google News RSS is used instead (no key needed)", "Optional. For Brave: https://api-dashboard.search.brave.com")
    r = requests.get("https://api.search.brave.com/res/v1/web/search",
                     headers={"X-Subscription-Token": key, "Accept": "application/json"},
                     params={"q": "customer churn", "count": 1}, timeout=TIMEOUT)
    if not r.ok:
        return http_error(r, "Check the key in the Brave API dashboard and that a plan is active.")
    left = r.headers.get("X-RateLimit-Remaining", "?")
    return Result("PASS", f"search returned results; quota remaining: {left} (key {mask(key)})")


def check_similarweb():
    key = env("SIMILARWEB_API_KEY")
    if not key:
        return Result("SKIP", "SIMILARWEB_API_KEY not set", "Ask the Similarweb sponsor desk for a hackathon key.")
    # /capabilities costs no data credits.
    r = requests.get("https://api.similarweb.com/capabilities", params={"api_key": key}, timeout=TIMEOUT)
    if not r.ok:
        return http_error(r, "Ask the Similarweb desk to confirm the key and that API access is enabled.")
    data = r.json()
    credits = data.get("remaining_hits") or data.get("remaining_credits") or data.get("credits")
    if credits is not None and credits < 10:
        return Result("WARN", f"key works, only {credits} credits left", "Cache results; each traffic lookup costs credits.")
    return Result("PASS", f"key works; credits: {credits if credits is not None else 'see dashboard'} (key {mask(key)})")


def check_merge():
    key = env("MERGE_API_KEY")
    if not key:
        return Result("SKIP", "MERGE_API_KEY not set", "Get it at https://app.merge.dev > API keys (use the test key).")
    h = {"Authorization": f"Bearer {key}"}
    r = requests.get("https://api.merge.dev/api/crm/v1/linked-accounts", headers=h, timeout=TIMEOUT)
    if not r.ok:
        return http_error(r, "Copy the API key from app.merge.dev > Configuration > API keys.")
    linked = len(r.json().get("results", []))
    tok = env("MERGE_ACCOUNT_TOKEN")
    if not tok:
        return Result("WARN", f"API key works; {linked} linked CRM account(s); MERGE_ACCOUNT_TOKEN not set",
                      "Link a sandbox CRM in app.merge.dev (Linked accounts > Add test account) and copy its account token.")
    r = requests.get("https://api.merge.dev/api/crm/v1/accounts", headers={**h, "X-Account-Token": tok},
                     params={"page_size": 1}, timeout=TIMEOUT)
    if not r.ok:
        return http_error(r, "The account token is wrong or the linked account was deleted; copy it again from app.merge.dev.")
    return Result("PASS", f"read CRM accounts through the linked account (key {mask(key)})")


def check_neo4j():
    uri = env("NEO4J_URI")
    user = env("NEO4J_USER") or env("NEO4J_USERNAME") or "neo4j"
    pw = env("NEO4J_PASSWORD")
    if not uri or "xxxx" in uri or not pw:
        return Result("SKIP", "NEO4J_URI / NEO4J_PASSWORD not set",
                      "Create a free AuraDB instance at https://console.neo4j.io and download its credentials file.")
    try:
        from neo4j import GraphDatabase
        with GraphDatabase.driver(uri, auth=(user, pw)) as drv:
            drv.verify_connectivity()
            n = drv.execute_query("MATCH (n) RETURN count(n) AS n").records[0]["n"]
        return Result("PASS", f"connected to {uri.split('//')[-1]}; {n} nodes in the graph")
    except Exception as e:  # auth errors, DNS, paused instance
        msg = str(e).split("\n")[0][:160]
        fix = ("Wrong password: reset it in the Aura console." if "auth" in msg.lower()
               else "Check NEO4J_URI (neo4j+s://...) and that the instance isn't paused in the Aura console.")
        return Result("FAIL", msg, fix)


def check_vultr():
    key = env("VULTR_API_KEY")
    if not key:
        return Result("SKIP", "VULTR_API_KEY not set",
                      "Vultr: add a payment method first, then account name > Manage User > Access > API Access > Enable.")
    r = requests.get("https://api.vultr.com/v2/account", headers={"Authorization": f"Bearer {key}"}, timeout=TIMEOUT)
    if r.status_code in (401, 403):
        return Result("FAIL", f"HTTP {r.status_code}: key rejected or your IP isn't allowed",
                      "In Vultr > Account > API, add your current IP to Access Control (or allow all IPv4 for the hackathon).")
    if not r.ok:
        return http_error(r, "Regenerate the key in Vultr > Account > API.")
    acct = r.json().get("account", {})
    return Result("PASS", f"account '{acct.get('name', '?')}', balance {acct.get('balance', '?')} (key {mask(key)})")


def check_duplocloud():
    """
    DuploCloud for the hackday is the DevKit: the platform running on your laptop in
    Docker (github.com/duplocloud/devkit/tree/main/hackday). There is no API key to test;
    this checks that the portal and platform API are up.
    """
    ui = env("DUPLO_UI_URL", "http://localhost:4210").rstrip("/")
    studio = env("DUPLO_STUDIO_URL", "http://localhost:60031").rstrip("/")
    try:
        health = requests.get(f"{studio}/healthz", timeout=5)
    except requests.RequestException:
        return Result("SKIP", f"DevKit not running (nothing answering at {studio})",
                      "Install and start it (20-40 min): follow docs/DUPLOCLOUD.md, steps 1-2.")
    try:
        portal = requests.get(ui, timeout=5)
        portal_ok = portal.ok
    except requests.RequestException:
        portal_ok = False
    if not health.ok:
        return Result("FAIL", f"platform API answered HTTP {health.status_code}",
                      "Run `docker compose ps` in your devkit folder; every service should be Up. Then re-run ./run.sh.")
    if not portal_ok:
        return Result("WARN", f"platform API is up but the portal at {ui} isn't answering",
                      "Check `docker compose ps`; the duplo-ui service should be Up.")
    return Result("PASS", f"DevKit running: portal {ui}, platform API healthy")


def check_usertesting():
    tok = env("USERTESTING_TOKEN")
    if not tok:
        return Result("SKIP", "USERTESTING_TOKEN not set", "Ask the UserTesting desk for API access (Results API).")
    test_id = env("USERTESTING_TEST_ID", "")
    r = requests.get("https://api.use2.usertesting.com/api/v2/sessionResults",
                     headers={"Authorization": f"Bearer {tok}"}, params={"testId": test_id}, timeout=TIMEOUT)
    if r.status_code in (401, 403):
        return Result("FAIL", f"HTTP {r.status_code}: token rejected", "Tokens expire; generate a new one with the UserTesting desk.")
    if r.ok:
        return Result("PASS", f"read session results for test {test_id}")
    if not test_id:
        return Result("WARN", f"token accepted (HTTP {r.status_code} without a test id)",
                      "Set USERTESTING_TEST_ID to a test you created to fully verify.")
    return http_error(r, "Check USERTESTING_TEST_ID belongs to your account.")


# Order = recommended setup order (most important first).
CHECKS = [
    ("crusoe", "Crusoe (required)", check_crusoe),
    ("neo4j", "Neo4j AuraDB", check_neo4j),
    ("openrouter", "OpenRouter -> Nebius", check_openrouter_nebius),
    ("nebius", "Nebius direct (optional)", check_nebius_direct),
    ("brave", "Brave Search", check_brave),
    ("merge", "Merge.dev", check_merge),
    ("similarweb", "Similarweb", check_similarweb),
    ("vultr", "Vultr", check_vultr),
    ("duplocloud", "DuploCloud", check_duplocloud),
    ("usertesting", "UserTesting", check_usertesting),
]


def main():
    wanted = {a.lower() for a in sys.argv[1:]}
    rows = []
    print("\nAccountPulse sponsor key check\n")
    for slug, name, fn in CHECKS:
        if wanted and slug not in wanted:
            continue
        try:
            res = fn()
        except requests.RequestException as e:
            host = getattr(getattr(e, "request", None), "url", "") or ""
            host = host.split("/")[2] if host.count("/") >= 2 else "the service"
            res = Result("FAIL", f"couldn't reach {host} ({type(e).__name__})",
                         "Check the URL in .env, your internet connection or VPN, then rerun.")
        except Exception as e:  # never let one sponsor crash the whole report
            res = Result("FAIL", f"{type(e).__name__}: {str(e)[:140]}", "Rerun; if it repeats, share this line.")
        rows.append((name, res))
        tag = f"{C[res.status]}{res.status}{C['END']}" if COLOR else res.status
        print(f"  {tag:<4}  {name:<26} {res.detail}")
        if res.fix and res.status != "PASS":
            print(f"        {'':<26} Fix: {res.fix}")

    counts = {s: sum(1 for _, r in rows if r.status == s) for s in ("PASS", "WARN", "FAIL", "SKIP")}
    print(f"\n  {counts['PASS']} pass, {counts['WARN']} warn, {counts['FAIL']} fail, {counts['SKIP']} not set")
    crusoe = next((r for n, r in rows if n.startswith("Crusoe")), None)
    if crusoe and crusoe.status != "PASS":
        print("  Crusoe is required for the overall prize: fix it first.")
    print("  Keys that pass: set MOCK=false in .env to use them.\n")
    sys.exit(1 if counts["FAIL"] else 0)


if __name__ == "__main__":
    main()
