/**
 * Live data from the AccountPulse agent API (backend/app.py).
 *
 *   GET  {API}/accounts   latest scan, in the Account shape from lib/data.ts
 *   POST {API}/scan       run a fresh scan (Brave, Similarweb, Crusoe, Nebius, Neo4j)
 *
 * When NEXT_PUBLIC_API_URL is empty or the API is unreachable, callers fall back
 * to the demo data in lib/data.ts, so the UI never breaks on stage.
 */
import { accounts as demoAccounts, riskLevel, type Account } from "./data";

export const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

export interface LivePayload {
  source: "live" | "mock" | "demo"; // live = real sponsors, mock = backend sample mode, demo = no backend
  scannedAt: string | null;
  revenueAtRisk: number;
  accounts: Account[];
}

export function demoPayload(): LivePayload {
  return {
    source: "demo",
    scannedAt: null,
    revenueAtRisk: demoAccounts.filter((a) => riskLevel(a.risk) === "high").reduce((s, a) => s + a.arr, 0),
    accounts: [...demoAccounts].sort((a, b) => b.risk - a.risk),
  };
}

async function call(path: string, init?: RequestInit, timeoutMs = 90_000): Promise<LivePayload> {
  const res = await fetch(`${API}${path}`, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`Agent API returned ${res.status}`);
  const data = (await res.json()) as LivePayload;
  data.accounts.sort((a, b) => b.risk - a.risk);
  return data;
}

/** Latest scan. The first call can take ~30s while the backend runs its first scan. */
export const fetchLive = () => call("/accounts");

/** Fresh scan across every sponsor. Takes ~20-40s for three accounts. */
export const runLiveScan = () => call("/scan", { method: "POST" });
