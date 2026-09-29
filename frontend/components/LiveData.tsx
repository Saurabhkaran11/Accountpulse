"use client";
/**
 * Shared live data for every dashboard page.
 *
 * - On load: shows demo data instantly, then swaps in the latest scan from the
 *   agent API if NEXT_PUBLIC_API_URL is set.
 * - rescan(): the top bar's "Run scan" button. Runs a fresh scan across all sponsors.
 * - If the API is off or fails, pages keep working on demo data and say so.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Account } from "@/lib/data";
import { API, demoPayload, fetchLive, runLiveScan, type LivePayload } from "@/lib/live";

interface LiveState {
  data: LivePayload;
  loading: boolean; // first load from the API in progress
  scanning: boolean; // "Run scan" in progress
  error: string | null;
  isLive: boolean; // data came from the agent API
  apiConfigured: boolean;
  rescan: () => Promise<LivePayload | null>;
  findAccount: (id: string) => Account | undefined;
}

const LiveContext = createContext<LiveState | null>(null);

export function useLiveData() {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error("useLiveData must be used inside <LiveDataProvider>");
  return ctx;
}

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LivePayload>(demoPayload);
  const [loading, setLoading] = useState(Boolean(API));
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!API || started.current) return;
    started.current = true;
    fetchLive()
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Agent API unreachable"))
      .finally(() => setLoading(false));
  }, []);

  const rescan = useCallback(async () => {
    if (!API) {
      setError("Agent API not configured (set NEXT_PUBLIC_API_URL)");
      return null;
    }
    setScanning(true);
    try {
      const d = await runLiveScan();
      setData(d);
      setError(null);
      return d;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Scan failed");
      return null;
    } finally {
      setScanning(false);
    }
  }, []);

  const findAccount = useCallback((id: string) => data.accounts.find((a) => a.id === id), [data]);

  return (
    <LiveContext.Provider
      value={{
        data,
        loading,
        scanning,
        error,
        isLive: data.source !== "demo",
        apiConfigured: Boolean(API),
        rescan,
        findAccount,
      }}
    >
      {children}
    </LiveContext.Provider>
  );
}
