"use client";
/**
 * Live check: real-world data in the app today.
 * Type a U.S. stock ticker; the server route /api/live/:ticker reads the
 * company's real SEC EDGAR filings and quarterly revenue, then scores risk
 * with the same explainable approach as the rest of AccountPulse.
 * No API key needed. Crusoe writes the explanation when CRUSOE_API_KEY is set.
 */
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { ExternalLink, Plus, Search, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import {
  AiBadge,
  ClayButton,
  GlassPanel,
  PageHeader,
  RiskBadge,
  RiskRing,
  SourceChip,
  itemVariants,
  listVariants,
} from "@/components/ui";
import { PulseLine } from "@/components/motion";
import { useToast } from "@/components/Providers";
import type { LiveResult } from "@/lib/sec";

/** Real companies with different risk pictures, so the demo shows the range. */
const examples = [
  { ticker: "CHGG", hint: "Revenue falling" },
  { ticker: "SBUX", hint: "Restructuring" },
  { ticker: "NKE", hint: "Layoffs filed" },
  { ticker: "ZM", hint: "Steady" },
  { ticker: "SNOW", hint: "Growing fast" },
];

const money = (n: number) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(0)}M` : `$${n.toLocaleString()}`;

function RevenueBars({ quarters }: { quarters: LiveResult["revenue"]["quarters"] }) {
  const max = Math.max(...quarters.map((q) => q.value));
  return (
    <div className="flex h-40 items-end gap-2" role="img" aria-label="Quarterly revenue, last 8 quarters">
      {quarters.map((q, i) => (
        <div key={q.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <motion.div
            className={clsx("w-full rounded-t-lg", i === quarters.length - 1 ? "bg-pulse" : "bg-pulse/35")}
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(6, (q.value / max) * 120)}px` }}
            transition={{ delay: i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            title={`${q.label}: ${money(q.value)}`}
          />
          <span className="text-[10px] font-semibold text-slate">{q.label.replace(/^(\d{2})(\d{2})/, "'$2 ")}</span>
        </div>
      ))}
    </div>
  );
}

export default function LiveCheckPage() {
  const toast = useToast();
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LiveResult | null>(null);

  const check = async (t: string) => {
    const value = t.trim().toUpperCase();
    if (!value) return;
    setTicker(value);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/live/${encodeURIComponent(value)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setData(json as LiveResult);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Couldn't load this company.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Live check"
        subtitle="Check any U.S. public company with its real SEC filings: layoffs, leadership changes, bankruptcy and revenue trends."
        actions={<SourceChip source="SEC EDGAR" />}
      />

      {/* ---------- Ticker search ---------- */}
      <GlassPanel className="mb-5 p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void check(ticker);
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="ticker" className="sr-only">
            Stock ticker
          </label>
          <div className="clay-inset flex h-12 flex-1 items-center gap-2 rounded-2xl px-4">
            <Search className="size-4 text-slate" aria-hidden />
            <input
              id="ticker"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="Stock ticker, e.g. NKE"
              maxLength={6}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-base font-semibold uppercase tracking-wide outline-none placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-slate/70"
            />
          </div>
          <ClayButton type="submit" variant="primary" className="h-12 px-6" disabled={loading || !ticker.trim()}>
            {loading ? "Checking" : "Check company"}
          </ClayButton>
        </form>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate">Try a real company:</span>
          {examples.map((x) => (
            <button
              key={x.ticker}
              onClick={() => check(x.ticker)}
              disabled={loading}
              className="clay focus-ring inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-sm"
            >
              <span className="font-bold">{x.ticker}</span>
              <span className="text-slate">{x.hint}</span>
            </button>
          ))}
        </div>
      </GlassPanel>

      <AnimatePresence mode="wait">
        {/* ---------- Loading ---------- */}
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GlassPanel className="grid place-items-center gap-3 py-14 text-center">
              <PulseLine width={220} height={60} beat />
              <p className="text-sm font-semibold text-slate">Reading {ticker}&apos;s SEC filings</p>
            </GlassPanel>
          </motion.div>
        )}

        {/* ---------- Error ---------- */}
        {!loading && error && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GlassPanel className="py-10 text-center">
              <p className="font-semibold text-coral">{error}</p>
              <p className="mt-1 text-sm text-slate">Use the company&apos;s U.S. stock ticker, or pick one of the examples above.</p>
            </GlassPanel>
          </motion.div>
        )}

        {/* ---------- Empty state ---------- */}
        {!loading && !error && !data && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GlassPanel className="py-12 text-center">
              <p className="font-display text-lg font-semibold">Pick a company to see real signals</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate">
                Works for 10,000+ U.S. public companies. Data comes straight from SEC EDGAR, the government&apos;s
                official filing system, and refreshes hourly.
              </p>
            </GlassPanel>
          </motion.div>
        )}

        {/* ---------- Result ---------- */}
        {!loading && data && (
          <motion.div
            key={data.company.ticker}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid gap-5 xl:grid-cols-[1.3fr_1fr]"
          >
            {/* Company + why */}
            <GlassPanel className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <RiskRing score={data.risk} size={92} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-semibold">{data.company.name}</h2>
                    <RiskBadge score={data.risk} />
                  </div>
                  <p className="mt-1 text-sm text-slate">
                    {data.company.ticker} · {data.company.industry}
                  </p>
                  <p className="mt-1 text-xs text-slate">
                    Checked {new Date(data.fetchedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <h3 className="font-semibold">Why this score</h3>
                {data.whyEngine === "crusoe" ? <AiBadge /> : <span className="text-xs font-semibold text-slate">Rule-based summary</span>}
              </div>
              <p className="mt-2 text-[15px] leading-relaxed">{data.why}</p>

              {data.reasons.length > 0 && (
                <motion.ul variants={listVariants} initial="hidden" animate="show" className="mt-4 space-y-2">
                  {data.reasons.map((r) => (
                    <motion.li key={r} variants={itemVariants} className="flex items-start gap-3 rounded-2xl bg-white/55 p-3 text-sm ring-1 ring-white">
                      <span className={clsx("mt-1.5 size-2 shrink-0 rounded-full", /growing/.test(r) ? "bg-mint" : "bg-coral")} aria-hidden />
                      {r}
                    </motion.li>
                  ))}
                </motion.ul>
              )}

              <div className="mt-5 rounded-2xl bg-pulse-soft/70 p-4 text-[15px]">
                <span className="font-semibold text-pulse">Next step: </span>
                {data.play}
              </div>
              <div className="mt-4">
                <ClayButton
                  icon={<Plus className="size-4" aria-hidden />}
                  onClick={() => toast(`${data.company.name} will be saved once the database is connected`)}
                >
                  Add to my accounts
                </ClayButton>
              </div>
            </GlassPanel>

            <div className="flex flex-col gap-5">
              {/* Revenue */}
              <GlassPanel className="p-6">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="font-semibold">Quarterly revenue</h3>
                  {data.revenue.yoyChange !== null && (
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
                        data.revenue.yoyChange < 0 ? "bg-coral/12 text-coral" : "bg-mint/12 text-mint",
                      )}
                    >
                      {data.revenue.yoyChange < 0 ? <TrendingDown className="size-3.5" aria-hidden /> : <TrendingUp className="size-3.5" aria-hidden />}
                      {data.revenue.yoyChange > 0 ? "+" : ""}
                      {data.revenue.yoyChange}% vs last year
                    </span>
                  )}
                </div>
                {data.revenue.quarters.length ? (
                  <>
                    <RevenueBars quarters={data.revenue.quarters} />
                    <p className="mt-3 text-sm text-slate">
                      Latest: <span className="font-semibold text-ink">{money(data.revenue.quarters.at(-1)!.value)}</span>
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate">This company doesn&apos;t report quarterly revenue in a standard format.</p>
                )}
              </GlassPanel>

              {/* Filings timeline */}
              <GlassPanel className="p-6">
                <h3 className="font-semibold">Major event filings, last 12 months</h3>
                {data.events.length === 0 ? (
                  <p className="mt-2 text-sm text-slate">No major event filings in the last year.</p>
                ) : (
                  <ul className="scroll-quiet mt-3 max-h-[340px] space-y-2 overflow-y-auto pr-1">
                    {data.events.map((e) => (
                      <li key={e.url} className="rounded-2xl bg-white/55 p-3 ring-1 ring-white">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate">{e.date}</span>
                          <a
                            href={e.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="focus-ring inline-flex items-center gap-1 rounded text-xs font-semibold text-pulse"
                          >
                            Read filing <ExternalLink className="size-3" aria-hidden />
                          </a>
                        </div>
                        <ul className="mt-1 space-y-0.5">
                          {e.items.map((it) => (
                            <li key={it.code} className={clsx("text-sm", it.weight ? "font-semibold text-ink" : "text-slate")}>
                              {it.label}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                )}
              </GlassPanel>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
