"use client";
/**
 * Accounts: every customer with its risk score, filterable and sortable.
 */
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { DataBadge, GlassPanel, PageHeader, RiskBadge, Sparkline } from "@/components/ui";
import { useLiveData } from "@/components/LiveData";
import { daysUntil, formatMoney, riskLevel, type Account, type RiskLevel } from "@/lib/data";

const filters: { key: "all" | RiskLevel; label: string }[] = [
  { key: "all", label: "All" },
  { key: "high", label: "High risk" },
  { key: "medium", label: "Watch" },
  { key: "low", label: "Healthy" },
];

const sorts = {
  risk: { label: "Highest risk", fn: (a: Account, b: Account) => b.risk - a.risk },
  arr: { label: "Biggest revenue", fn: (a: Account, b: Account) => b.arr - a.arr },
  renewal: {
    label: "Renewing soonest",
    fn: (a: Account, b: Account) => daysUntil(a.renewalDate) - daysUntil(b.renewalDate),
  },
} as const;

export default function AccountsPage() {
  const { data, loading } = useLiveData();
  const accounts = data.accounts;
  const [filter, setFilter] = useState<"all" | RiskLevel>("all");
  const [sort, setSort] = useState<keyof typeof sorts>("risk");

  const rows = useMemo(
    () => [...accounts].filter((a) => filter === "all" || riskLevel(a.risk) === filter).sort(sorts[sort].fn),
    [accounts, filter, sort],
  );

  return (
    <>
      <PageHeader
        title="Accounts"
        subtitle="Every customer, scored daily. Click one to see why and what to do."
        actions={<DataBadge source={data.source} scannedAt={data.scannedAt} loading={loading} />}
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Segmented filter: the active pill glides between options */}
        <div role="tablist" aria-label="Filter by risk" className="clay-inset inline-flex w-fit gap-1 rounded-2xl p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={clsx(
                "focus-ring relative h-9 rounded-xl px-3.5 text-sm font-semibold",
                filter === f.key ? "text-pulse" : "text-slate",
              )}
            >
              {filter === f.key && (
                <motion.span layoutId="acc-filter" className="clay absolute inset-0 rounded-xl" transition={{ type: "spring", stiffness: 500, damping: 36 }} />
              )}
              <span className="relative">{f.label}</span>
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate">
          Sort by
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as keyof typeof sorts)}
            className="clay focus-ring h-10 rounded-xl px-3 text-sm font-semibold text-ink outline-none"
          >
            {Object.entries(sorts).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <GlassPanel className="p-2 sm:p-3">
        {/* Column headings, desktop only */}
        <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_130px] gap-4 px-4 py-2 text-xs font-semibold text-slate md:grid">
          <span>Account</span>
          <span>Revenue</span>
          <span>Renews in</span>
          <span>8-week trend</span>
          <span>Risk</span>
        </div>
        <motion.ul layout className="space-y-1.5">
          <AnimatePresence initial={false}>
            {rows.map((a) => (
              <motion.li
                key={a.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  href={`/dashboard/accounts/${a.id}`}
                  className="focus-ring grid grid-cols-[1fr_auto] items-center gap-4 rounded-2xl bg-white/45 px-4 py-3.5 ring-1 ring-white/80 transition hover:bg-white/75 md:grid-cols-[2fr_1fr_1fr_1fr_130px]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{a.name}</p>
                    <p className="truncate text-xs text-slate">
                      {a.industry} · {a.owner}
                      <span className="md:hidden"> · {formatMoney(a.arr)}</span>
                    </p>
                  </div>
                  <span className="hidden text-sm font-semibold md:block">{formatMoney(a.arr)}</span>
                  <span className="hidden text-sm md:block">{daysUntil(a.renewalDate)} days</span>
                  <span className="hidden md:block">
                    <Sparkline data={a.trend} />
                  </span>
                  <RiskBadge score={a.risk} />
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
        {rows.length === 0 && (
          <p className="p-6 text-center text-sm text-slate">No accounts in this group. Try another filter.</p>
        )}
      </GlassPanel>
    </>
  );
}
