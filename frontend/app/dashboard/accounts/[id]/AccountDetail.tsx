"use client";
/**
 * Account detail: the "why" behind a score and one-click next steps.
 * AI features on this page:
 *  - Plain-English explanation with the evidence and its source.
 *  - Critic badge (second model agreed or not).
 *  - "Draft email" writes a rescue email and types it out live.
 */
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Copy, Mail, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import {
  AiBadge,
  ClayButton,
  CriticBadge,
  GlassPanel,
  RiskBadge,
  RiskRing,
  SourceChip,
  itemVariants,
  listVariants,
} from "@/components/ui";
import { useToast } from "@/components/Providers";
import { daysUntil, formatMoney, riskLevel, type Account } from "@/lib/data";

/** Demo draft. Next step: replace with a Crusoe call via the agent API. */
function draftFor(a: Account) {
  return `Hi team at ${a.name},

I wanted to reach out personally ahead of your renewal. ${a.evidence[0]?.detail ?? "We've noticed some changes"}, and I'd like to make sure we're supporting you well.

Could we set up 20 minutes this week? I'll bring a short plan for ${a.openTickets > 0 ? `your ${a.openTickets} open tickets and ` : ""}how we can help your team get more value before ${new Date(a.renewalDate).toLocaleDateString("en-US", { month: "long", day: "numeric" })}.

Best,
${a.owner}`;
}

/** Types text out character by character. */
function useTypewriter(text: string, run: number) {
  const [out, setOut] = useState("");
  useEffect(() => {
    if (run === 0) return; // run increments on every click, so Rewrite replays it
    setOut("");
    let i = 0;
    const t = setInterval(() => {
      i += 4;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [text, run]);
  return out;
}

function TrendChart({ data }: { data: number[] }) {
  const w = 560;
  const h = 160;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i * step, h - (v / 100) * h] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const color = riskLevel(data[data.length - 1]) === "high" ? "#e5485a" : riskLevel(data[data.length - 1]) === "medium" ? "#d98a1c" : "#1a9e70";
  return (
    <svg viewBox={`0 0 ${w} ${h + 24}`} className="h-auto w-full" role="img" aria-label={`Risk over 8 weeks, from ${data[0]} to ${data[data.length - 1]}`}>
      {[25, 50, 75].map((g) => (
        <line key={g} x1={0} x2={w} y1={h - (g / 100) * h} y2={h - (g / 100) * h} stroke="rgba(91,100,133,0.15)" strokeDasharray="4 6" />
      ))}
      <motion.path d={area} fill={color} initial={{ opacity: 0 }} animate={{ opacity: 0.12 }} transition={{ delay: 0.5, duration: 0.6 }} />
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      {pts.map(([x, y], i) => (
        <motion.circle key={i} cx={x} cy={y} r={4} fill="white" stroke={color} strokeWidth={2} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15 * i }} />
      ))}
      {data.map((_, i) => (
        <text key={i} x={i * step} y={h + 18} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"} className="fill-slate text-[11px]">
          {i === data.length - 1 ? "This week" : `W${i + 1}`}
        </text>
      ))}
    </svg>
  );
}

export function AccountDetail({ account: a }: { account: Account }) {
  const toast = useToast();
  const [runs, setRuns] = useState(0);
  const drafting = runs > 0;
  const [copied, setCopied] = useState(false);
  const draft = draftFor(a);
  const typed = useTypewriter(draft, runs);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      toast("Email copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast("Select the text to copy it");
    }
  };

  return (
    <>
      <Link href="/dashboard/accounts" className="focus-ring mb-4 inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-slate hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> All accounts
      </Link>

      {/* ---------- Header ---------- */}
      <GlassPanel className="mb-5 flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <RiskRing score={a.risk} size={96} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold sm:text-3xl">{a.name}</h1>
            <RiskBadge score={a.risk} />
          </div>
          <p className="mt-1 text-sm text-slate">
            {a.domain} · {a.industry} · Owner: {a.owner}
          </p>
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <dt className="text-slate">Annual revenue</dt>
              <dd className="font-display text-lg font-bold">{formatMoney(a.arr)}</dd>
            </div>
            <div>
              <dt className="text-slate">Renews in</dt>
              <dd className="font-display text-lg font-bold">{daysUntil(a.renewalDate)} days</dd>
            </div>
            <div>
              <dt className="text-slate">Open tickets</dt>
              <dd className="font-display text-lg font-bold">{a.openTickets}</dd>
            </div>
            <div>
              <dt className="text-slate">Main competitor</dt>
              <dd className="font-display text-lg font-bold">{a.competitor}</dd>
            </div>
          </dl>
        </div>
      </GlassPanel>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        {/* ---------- Why (AI explanation) ---------- */}
        <GlassPanel className="p-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Why this score</h2>
            <AiBadge />
          </div>
          <p className="mt-3 text-[15px] leading-relaxed">{a.why}</p>
          <div className="mt-3">
            <CriticBadge verified={a.criticVerified} />
          </div>
          {a.provider && !a.provider.startsWith("mock") && (
            <p className="mt-2 text-xs text-slate">
              Scored by <span className="font-semibold text-ink">{a.provider}</span>
              {a.criticProvider ? (
                <>
                  {" "}· checked by <span className="font-semibold text-ink">{a.criticProvider}</span>
                </>
              ) : null}
            </p>
          )}
          {!a.criticVerified && a.criticNote && <p className="mt-2 text-xs text-amber">Second AI: {a.criticNote}</p>}

          <h3 className="mt-6 text-sm font-semibold text-slate">Evidence</h3>
          <motion.ul variants={listVariants} initial="hidden" animate="show" className="mt-2 space-y-2">
            {a.evidence.map((e, i) => (
              <motion.li key={`${e.label}-${i}`} variants={itemVariants} className="flex items-start gap-3 rounded-2xl bg-white/55 p-3 ring-1 ring-white">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-pulse" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{e.label}</p>
                  {e.url ? (
                    <a href={e.url} target="_blank" rel="noopener noreferrer" className="focus-ring rounded text-sm text-slate underline decoration-slate/30 underline-offset-2 hover:text-pulse">
                      {e.detail}
                    </a>
                  ) : (
                    <p className="text-sm text-slate">{e.detail}</p>
                  )}
                </div>
                <SourceChip source={e.source} />
              </motion.li>
            ))}
          </motion.ul>

          <h3 className="mt-6 text-sm font-semibold text-slate">Risk over the last 8 weeks</h3>
          <div className="mt-2">
            <TrendChart data={a.trend} />
          </div>
        </GlassPanel>

        {/* ---------- Next step + AI draft ---------- */}
        <GlassPanel className="flex flex-col p-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Recommended next step</h2>
            <AiBadge />
          </div>
          <p className="mt-3 rounded-2xl bg-pulse-soft/70 p-4 text-[15px] font-medium">{a.play}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            <ClayButton variant="primary" icon={<Sparkles className="size-4" aria-hidden />} onClick={() => setRuns((r) => r + 1)}>
              {drafting ? "Rewrite email" : "Draft email"}
            </ClayButton>
            <ClayButton icon={<Check className="size-4" aria-hidden />} onClick={() => toast(`Marked ${a.name} as contacted`)}>
              Mark as contacted
            </ClayButton>
          </div>

          <AnimatePresence>
            {drafting && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-5 overflow-hidden"
              >
                <div className="clay-inset rounded-2xl p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate">
                      <Mail className="size-3.5" aria-hidden /> Draft email
                    </span>
                    <button onClick={copy} className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-pulse">
                      {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">{typed}</pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassPanel>
      </div>
    </>
  );
}
