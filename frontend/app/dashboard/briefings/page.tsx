"use client";
/**
 * Daily briefing: a short AI summary of what changed overnight.
 * Next step: deliver the same summary to Slack or email every morning.
 */
import { motion } from "framer-motion";
import { AiBadge, GlassPanel, PageHeader, itemVariants, listVariants } from "@/components/ui";
import { briefings } from "@/lib/data";

export default function BriefingsPage() {
  const [today, ...earlier] = briefings;
  return (
    <>
      <PageHeader title="Daily briefing" subtitle="A two-minute read on what changed since yesterday." actions={<AiBadge />} />

      {/* Today's briefing gets the spotlight */}
      <GlassPanel className="p-6 sm:p-8">
        <p className="text-sm font-semibold text-slate">{today.date}</p>
        <h2 className="font-display mt-2 max-w-3xl text-2xl font-semibold sm:text-3xl">{today.headline}</h2>
        <motion.ul variants={listVariants} initial="hidden" animate="show" className="mt-6 space-y-3">
          {today.bullets.map((b) => (
            <motion.li key={b} variants={itemVariants} className="flex gap-3 rounded-2xl bg-white/55 p-4 ring-1 ring-white">
              <span className="mt-2 size-2 shrink-0 rounded-full bg-pulse" aria-hidden />
              <span className="text-[15px] leading-relaxed">{b}</span>
            </motion.li>
          ))}
        </motion.ul>
      </GlassPanel>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Earlier</h2>
      <div className="space-y-3">
        {earlier.map((b) => (
          <GlassPanel key={b.id} as="article">
            <p className="text-xs font-semibold text-slate">{b.date}</p>
            <p className="mt-1 font-semibold">{b.headline}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate">
              {b.bullets.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </GlassPanel>
        ))}
      </div>
    </>
  );
}
