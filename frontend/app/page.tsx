"use client";
/**
 * Landing page (/). One job: explain AccountPulse in five seconds and get
 * the visitor into the dashboard. The live-looking account card and the
 * beating pulse line are the one memorable moment; everything else stays quiet.
 */
import Link from "next/link";
import { motion } from "framer-motion";
import { AmbientBackground, LogoMark, PulseLine } from "@/components/motion";
import { CriticBadge, RiskRing, SourceChip } from "@/components/ui";
import { accounts, formatMoney } from "@/lib/data";

const steps = [
  { title: "Connect", body: "Link your CRM and help desk in one step. AccountPulse reads accounts, tickets and usage." },
  { title: "Detect", body: "AI watches news, competitor traffic and support trends, and scores every account daily." },
  { title: "Act", body: "Get a plain-English reason and a ready-to-send email for each account at risk." },
];

export default function Landing() {
  const top = accounts[0];
  return (
    <div className="min-h-dvh">
      <AmbientBackground />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark />
          <span className="font-display text-lg font-bold">AccountPulse</span>
        </Link>
        <Link href="/dashboard" className="clay focus-ring inline-flex h-10 items-center rounded-2xl px-4 text-sm font-semibold">
          Sign in
        </Link>
      </header>

      <main className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-8 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
        {/* ---------- Message ---------- */}
        <section>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-[58px]"
          >
            Know which customers are about to leave, while there&apos;s still time to keep them.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="mt-5 max-w-xl text-lg text-slate"
          >
            AccountPulse reads your CRM, the news and your competitors&apos; momentum, then tells you who is at risk, why,
            and exactly what to send them.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link href="/dashboard" className="clay-primary focus-ring inline-flex h-12 items-center rounded-2xl px-6 font-semibold">
              Open dashboard
            </Link>
            <Link href="/dashboard/ask" className="clay focus-ring inline-flex h-12 items-center rounded-2xl px-6 font-semibold">
              Ask a question
            </Link>
          </motion.div>
        </section>

        {/* ---------- Signature moment: a live account card on a heartbeat ---------- */}
        <section aria-label="Example account alert" className="relative">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 overflow-hidden opacity-70">
            <PulseLine width={560} height={120} beat strokeWidth={3} />
          </div>
          <motion.article
            initial={{ opacity: 0, y: 24, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 120, damping: 16 }}
            className="glass-strong relative mx-auto max-w-md rounded-[26px] bg-white/90 p-6"
          >
            <div className="flex items-start gap-4">
              <RiskRing score={top.risk} />
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold">{top.name}</p>
                <p className="text-sm text-slate">
                  {formatMoney(top.arr)} a year · renews in 47 days
                </p>
                <div className="mt-2">
                  <CriticBadge verified={top.criticVerified} />
                </div>
              </div>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed">{top.why}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {top.evidence.map((e) => (
                <SourceChip key={e.label} source={e.source} />
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-pulse-soft/70 p-3 text-sm">
              <span className="font-semibold text-pulse">Next step: </span>
              {top.play}
            </div>
          </motion.article>
        </section>
      </main>

      {/* ---------- How it works (a real sequence, so it is numbered) ---------- */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="glass rounded-[22px] p-6">
              <span className="clay grid size-10 place-items-center rounded-xl font-display font-bold text-pulse">{i + 1}</span>
              <h2 className="mt-4 text-lg font-semibold">{s.title}</h2>
              <p className="mt-1 text-sm text-slate">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
