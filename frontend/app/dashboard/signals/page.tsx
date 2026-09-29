"use client";
/**
 * Signals: everything that changed across your accounts, newest first.
 * Filter by the source that produced the signal.
 */
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { useState } from "react";
import { GlassPanel, PageHeader, SourceChip } from "@/components/ui";
import { accounts, signals, type SignalSource } from "@/lib/data";

const severityDot = { high: "bg-coral", medium: "bg-amber", low: "bg-mint" } as const;
const sources: ("All" | SignalSource)[] = ["All", "Brave", "Similarweb", "Merge.dev"];

export default function SignalsPage() {
  const [source, setSource] = useState<"All" | SignalSource>("All");
  const rows = signals.filter((s) => source === "All" || s.source === source);

  return (
    <>
      <PageHeader title="Signals" subtitle="News, competitor moves and support trends that changed a risk score." />

      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter by source">
        {sources.map((s) => (
          <button
            key={s}
            onClick={() => setSource(s)}
            aria-pressed={source === s}
            className={clsx(
              "focus-ring h-9 rounded-full px-4 text-sm font-semibold",
              source === s ? "clay-pressed bg-[#eef1f8] text-pulse" : "clay text-slate",
            )}
          >
            {s === "Brave" ? "News" : s === "Similarweb" ? "Competitor traffic" : s === "Merge.dev" ? "CRM and tickets" : "All"}
          </button>
        ))}
      </div>

      <GlassPanel className="p-4 sm:p-6">
        {/* Timeline: a vertical line with one dot per signal */}
        <ol className="relative space-y-4 border-l-2 border-white/80 pl-6">
          <AnimatePresence initial={false}>
            {rows.map((s, i) => {
              const acc = accounts.find((a) => a.id === s.accountId);
              return (
                <motion.li
                  key={s.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative"
                >
                  <span className={clsx("absolute -left-[31px] top-4 size-3 rounded-full ring-4 ring-white", severityDot[s.severity])} aria-hidden />
                  <div className="rounded-2xl bg-white/55 p-4 ring-1 ring-white">
                    <p className="font-semibold">{s.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate">
                      <SourceChip source={s.source} />
                      <span>{s.when}</span>
                      {acc && (
                        <Link href={`/dashboard/accounts/${acc.id}`} className="font-semibold text-pulse">
                          Open {acc.name}
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
        {rows.length === 0 && <p className="text-center text-sm text-slate">No signals from this source yet.</p>}
      </GlassPanel>
    </>
  );
}
