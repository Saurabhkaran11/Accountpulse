"use client";
/**
 * Relationship map: signals -> accounts -> competitors.
 * In production this graph lives in Neo4j; here it is drawn from demo
 * data. Hover (or focus) an account to highlight everything linked to it.
 */
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { GlassPanel, PageHeader, SourceChip } from "@/components/ui";
import { accounts, competitors, riskLevel, signals } from "@/lib/data";

const W = 960;
const H = 560;
const colX = { signal: 250, account: 530, competitor: 820 };
const riskColor = { high: "#e5485a", medium: "#d98a1c", low: "#1a9e70" } as const;

function spread(n: number, i: number) {
  const pad = 80; // leaves room for column titles and top labels
  return n === 1 ? H / 2 : pad + (i * (H - pad * 2)) / (n - 1);
}

export default function GraphPage() {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);

  const accPos = Object.fromEntries(accounts.map((a, i) => [a.id, { x: colX.account, y: spread(accounts.length, i) }]));
  const compPos = Object.fromEntries(competitors.map((c, i) => [c.name, { x: colX.competitor, y: spread(competitors.length, i) }]));
  const sigPos = Object.fromEntries(signals.map((s, i) => [s.id, { x: colX.signal, y: spread(signals.length, i) }]));

  const dim = (accountId: string) => hover !== null && hover !== accountId;
  const curve = (x1: number, y1: number, x2: number, y2: number) => {
    const mx = (x1 + x2) / 2;
    return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
  };

  return (
    <>
      <PageHeader
        title="Relationship map"
        subtitle="How news and support signals connect to your accounts, and which rivals are circling them. Hover an account to trace its links."
        actions={<SourceChip source="Neo4j" />}
      />

      <GlassPanel className="p-3 sm:p-5">
        <div className="scroll-quiet overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[720px]" role="img" aria-label="Graph of signals, accounts and competitors">
            {/* Column titles */}
            {[
              ["Signals", colX.signal],
              ["Accounts", colX.account],
              ["Competitors", colX.competitor],
            ].map(([t, x]) => (
              <text key={t} x={x} y={20} textAnchor="middle" className="fill-slate text-[13px] font-semibold">
                {t}
              </text>
            ))}

            {/* Edges: signal -> account */}
            {signals.map((s, i) => {
              const a = accPos[s.accountId];
              const p = sigPos[s.id];
              return (
                <motion.path
                  key={`e-${s.id}`}
                  d={curve(p.x + 10, p.y, a.x - 14, a.y)}
                  fill="none"
                  stroke="#7c7ef2"
                  strokeWidth={1.6}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1, opacity: dim(s.accountId) ? 0.12 : 0.55 }}
                  transition={{ delay: 0.05 * i, duration: 0.8 }}
                />
              );
            })}

            {/* Edges: account -> competitor */}
            {accounts.map((a, i) => {
              const p = accPos[a.id];
              const c = compPos[a.competitor];
              if (!c) return null;
              return (
                <motion.path
                  key={`c-${a.id}`}
                  d={curve(p.x + 14, p.y, c.x - 14, c.y)}
                  fill="none"
                  stroke={riskColor[riskLevel(a.risk)]}
                  strokeWidth={1.8}
                  strokeDasharray="5 5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1, opacity: dim(a.id) ? 0.1 : 0.6 }}
                  transition={{ delay: 0.3 + 0.05 * i, duration: 0.8 }}
                />
              );
            })}

            {/* Signal nodes */}
            {signals.map((s) => {
              const p = sigPos[s.id];
              return (
                <g key={s.id} opacity={dim(s.accountId) ? 0.3 : 1} style={{ transition: "opacity .2s" }}>
                  <circle cx={p.x} cy={p.y} r={7} fill="#fff" stroke="#7c7ef2" strokeWidth={2} />
                  <text x={p.x - 14} y={p.y + 4} textAnchor="end" className="fill-ink text-[11.5px]">
                    {s.title.length > 26 ? `${s.title.slice(0, 25)}…` : s.title}
                  </text>
                </g>
              );
            })}

            {/* Account nodes: clickable, keyboard focusable */}
            {accounts.map((a, i) => {
              const p = accPos[a.id];
              const r = 10 + (a.arr / 210000) * 10; // bigger bubble = more revenue
              return (
                <motion.g
                  key={a.id}
                  tabIndex={0}
                  role="link"
                  aria-label={`${a.name}, risk ${a.risk}`}
                  onMouseEnter={() => setHover(a.id)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(a.id)}
                  onBlur={() => setHover(null)}
                  onClick={() => router.push(`/dashboard/accounts/${a.id}`)}
                  onKeyDown={(e) => e.key === "Enter" && router.push(`/dashboard/accounts/${a.id}`)}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, opacity: dim(a.id) ? 0.35 : 1 }}
                  transition={{ delay: 0.04 * i, type: "spring", stiffness: 260, damping: 18 }}
                  style={{ cursor: "pointer", transformOrigin: `${p.x}px ${p.y}px`, outline: "none" }}
                >
                  <circle cx={p.x} cy={p.y} r={r + 6} fill={riskColor[riskLevel(a.risk)]} opacity={0.14} />
                  <circle cx={p.x} cy={p.y} r={r} fill={riskColor[riskLevel(a.risk)]} />
                  <text x={p.x} y={p.y - r - 8} textAnchor="middle" className="fill-ink text-[12.5px] font-semibold">
                    {a.name}
                  </text>
                </motion.g>
              );
            })}

            {/* Competitor nodes */}
            {competitors.map((c) => {
              const p = compPos[c.name];
              return (
                <g key={c.name}>
                  <rect x={p.x - 14} y={p.y - 14} width={28} height={28} rx={8} fill="#eef1f8" stroke="#1c2340" strokeOpacity={0.2} />
                  <text x={p.x + 24} y={p.y + 4} className="fill-ink text-[12.5px] font-semibold">
                    {c.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-4 px-2 text-xs text-slate">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-coral" /> High risk
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-amber" /> Watch
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-mint" /> Healthy
          </span>
          <span>Bubble size shows annual revenue. Click an account to open it.</span>
        </div>
      </GlassPanel>
    </>
  );
}
