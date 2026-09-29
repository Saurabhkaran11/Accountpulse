"use client";
/**
 * Overview: answers "who needs me today?" in one screen.
 * Reads live accounts from the agent API (via LiveDataProvider); falls back to demo data.
 * Layout (desktop):
 *   [ Revenue at risk hero ................ ] [ Call first card ]
 *   [ Accounts at risk list ............... ] [ Latest signals  ]
 */
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, CalendarClock, ExternalLink, Mail, Radio, TriangleAlert } from "lucide-react";
import {
  AnimatedNumber,
  CriticBadge,
  DataBadge,
  GlassPanel,
  PageHeader,
  RiskBadge,
  RiskRing,
  SourceChip,
  Sparkline,
  itemVariants,
  listVariants,
} from "@/components/ui";
import { PulseLine } from "@/components/motion";
import { useUser } from "@/components/Providers";
import { useLiveData } from "@/components/LiveData";
import { daysUntil, formatMoney, riskLevel, signals as demoSignals, type SignalSource } from "@/lib/data";

/** Short model name for display: "crusoe:openai/gpt-oss-120b" -> "gpt-oss-120b on Crusoe". */
function modelLabel(provider?: string) {
  if (!provider || provider.startsWith("mock")) return null;
  const model = provider.split(":").pop()?.split(" ")[0]?.split("/").pop();
  return `${model} on Crusoe`;
}

export default function OverviewPage() {
  const { user } = useUser();
  const { data, loading } = useLiveData();
  const list = data.accounts; // already sorted, highest risk first
  const high = list.filter((a) => riskLevel(a.risk) === "high");
  const renewingSoon = list.filter((a) => daysUntil(a.renewalDate) <= 90).length;
  const top = list[0];
  const live = data.source === "live";

  // Latest signals: live evidence from the scan (news, competitor traffic), else demo signals.
  const liveSignals = list.flatMap((a) =>
    a.evidence
      .filter((e) => e.source !== "Sample CRM")
      .map((e) => ({ id: `${a.id}-${e.detail}`, title: e.detail, source: e.source, when: a.name, url: e.url })),
  );
  const feed: { id: string; title: string; source: SignalSource; when: string; url?: string }[] =
    data.source === "demo" ? demoSignals : liveSignals;

  const kpis = [
    { label: "High-risk accounts", value: high.length, icon: TriangleAlert, tone: "text-coral" },
    { label: "Renewals in 90 days", value: renewingSoon, icon: CalendarClock, tone: "text-amber" },
    { label: data.source === "demo" ? "New signals today" : "Signals in this scan", value: data.source === "demo" ? 2 : feed.length, icon: Radio, tone: "text-pulse" },
  ];
  const scoredBy = modelLabel(top?.provider);

  return (
    <>
      <PageHeader
        title={`Good morning, ${user.name.split(" ")[0]}`}
        subtitle="Here's who needs you today, and why."
        actions={<DataBadge source={data.source} scannedAt={data.scannedAt} loading={loading} />}
      />

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        {/* ---------- Revenue at risk ---------- */}
        <GlassPanel className="relative overflow-hidden p-6">
          <p className="text-sm font-semibold text-slate">Revenue at high risk</p>
          <p className="font-display mt-1 text-5xl font-bold text-ink sm:text-6xl">
            <AnimatedNumber value={data.revenueAtRisk} format={(n) => `$${Math.round(n / 1000)}K`} />
          </p>
          <p className="mt-2 text-sm text-slate">
            Across {high.length} of {list.length} accounts.
            {live && scoredBy ? ` Scored live by ${scoredBy}, fact-checked by Nebius.` : ""}
          </p>
          <div className="pointer-events-none absolute -right-6 top-6 hidden opacity-80 sm:block">
            <PulseLine width={260} height={70} beat color="var(--color-coral)" strokeWidth={3} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {kpis.map((k) => (
              <div key={k.label} className="clay flex items-center gap-3 rounded-2xl p-3.5">
                <span className={`grid size-10 place-items-center rounded-xl bg-white/80 ${k.tone}`}>
                  <k.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-display text-2xl font-bold leading-none">
                    <AnimatedNumber value={k.value} />
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate">{k.label}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* ---------- Who to call first (AI recommendation) ---------- */}
        {top && (
          <GlassPanel className="p-6">
            <p className="text-sm font-semibold text-slate">Call first</p>
            <div className="mt-3 flex items-center gap-4">
              <RiskRing key={`${top.id}-${top.risk}`} score={top.risk} size={76} />
              <div className="min-w-0">
                <p className="font-display truncate text-lg font-semibold">{top.name}</p>
                <p className="text-sm text-slate">
                  {formatMoney(top.arr)} · renews in {daysUntil(top.renewalDate)} days
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed">{top.why}</p>
            <div className="mt-3">
              <CriticBadge verified={top.criticVerified} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={`/dashboard/accounts/${top.id}`} className="clay-primary focus-ring inline-flex h-10 items-center gap-2 rounded-2xl px-4 text-sm font-semibold">
                <Mail className="size-4" aria-hidden /> Draft email
              </Link>
              <Link href={`/dashboard/accounts/${top.id}`} className="clay focus-ring inline-flex h-10 items-center rounded-2xl px-4 text-sm font-semibold">
                View account
              </Link>
            </div>
          </GlassPanel>
        )}

        {/* ---------- Accounts at risk ---------- */}
        <GlassPanel>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Accounts to watch</h2>
            <Link href="/dashboard/accounts" className="text-sm font-semibold text-pulse">
              See all
            </Link>
          </div>
          <motion.ul key={data.scannedAt ?? data.source} variants={listVariants} initial="hidden" animate="show" className="divide-y divide-white/70">
            {list.slice(0, 5).map((a) => (
              <motion.li key={a.id} variants={itemVariants}>
                <Link
                  href={`/dashboard/accounts/${a.id}`}
                  className="focus-ring group flex items-center gap-4 rounded-xl px-2 py-3 hover:bg-white/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{a.name}</p>
                    <p className="truncate text-xs text-slate">
                      {formatMoney(a.arr)} · {a.owner}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <Sparkline data={a.trend} />
                  </div>
                  <RiskBadge score={a.risk} />
                  <ArrowUpRight className="size-4 shrink-0 text-slate opacity-0 transition group-hover:opacity-100" aria-hidden />
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        </GlassPanel>

        {/* ---------- Latest signals ---------- */}
        <GlassPanel>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Latest signals</h2>
            <Link href="/dashboard/signals" className="text-sm font-semibold text-pulse">
              See all
            </Link>
          </div>
          {feed.length === 0 ? (
            <p className="rounded-2xl bg-white/55 p-4 text-sm text-slate ring-1 ring-white">
              No new signals in the last scan. Run a scan to check again.
            </p>
          ) : (
            <ul className="space-y-3">
              {feed.slice(0, 4).map((s) => (
                <li key={s.id} className="rounded-2xl bg-white/55 p-3 ring-1 ring-white">
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex items-start gap-1 rounded text-sm font-semibold hover:text-pulse">
                      <span className="line-clamp-2">{s.title}</span>
                      <ExternalLink className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    </a>
                  ) : (
                    <p className="text-sm font-semibold">{s.title}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-slate">
                    <SourceChip source={s.source} />
                    <span>{s.when}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>
      </div>
    </>
  );
}
