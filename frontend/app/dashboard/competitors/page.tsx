"use client";
/**
 * Competitors: who is gaining momentum and which of your accounts they
 * could pull away. Traffic change comes from Similarweb.
 */
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import clsx from "clsx";
import { GlassPanel, PageHeader, SourceChip } from "@/components/ui";
import { accounts, competitors, formatMoney } from "@/lib/data";

export default function CompetitorsPage() {
  const maxChange = Math.max(...competitors.map((c) => Math.abs(c.visitsChange)));

  return (
    <>
      <PageHeader title="Competitors" subtitle="Rivals gaining traffic are the ones most likely to win your customers next." />

      <div className="grid gap-5 md:grid-cols-2">
        {competitors.map((c, i) => {
          const exposed = accounts.filter((a) => a.competitor === c.name);
          const revenue = exposed.reduce((s, a) => s + a.arr, 0);
          const up = c.visitsChange > 0;
          return (
            <GlassPanel key={c.name} className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{c.name}</h2>
                  <p className="text-sm text-slate">{c.domain}</p>
                </div>
                <span
                  className={clsx(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold",
                    up ? "bg-coral/12 text-coral" : "bg-mint/12 text-mint",
                  )}
                >
                  {up ? <TrendingUp className="size-4" aria-hidden /> : <TrendingDown className="size-4" aria-hidden />}
                  {up ? "+" : ""}
                  {c.visitsChange}%
                </span>
              </div>

              {/* Momentum bar: grows to the size of the traffic change */}
              <div className="clay-inset mt-4 h-3 overflow-hidden rounded-full" aria-hidden>
                <motion.div
                  className={clsx("h-full rounded-full", up ? "bg-coral" : "bg-mint")}
                  initial={{ width: 0 }}
                  animate={{ width: `${(Math.abs(c.visitsChange) / maxChange) * 100}%` }}
                  transition={{ delay: 0.1 * i, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <p className="mt-2 flex items-center gap-2 text-xs text-slate">
                Website visits, last 90 days <SourceChip source="Similarweb" />
              </p>

              <p className="mt-4 text-sm">{c.headline}</p>

              <div className="mt-4 rounded-2xl bg-white/55 p-3 text-sm ring-1 ring-white">
                <span className="font-semibold">
                  {exposed.length} of your accounts · {formatMoney(revenue)}
                </span>
                <span className="text-slate"> {exposed.map((a) => a.name).join(", ")}</span>
              </div>
            </GlassPanel>
          );
        })}
      </div>
    </>
  );
}
