"use client";
/**
 * Integrations: the data sources and AI models behind AccountPulse.
 * "Demo mode" means the UI is using built-in sample data for that source.
 */
import clsx from "clsx";
import { motion } from "framer-motion";
import { GlassPanel, PageHeader, itemVariants, listVariants } from "@/components/ui";
import { useToast } from "@/components/Providers";
import { integrations } from "@/lib/data";

const statusStyle = {
  Connected: "bg-mint/12 text-mint",
  "Demo mode": "bg-amber/14 text-amber",
  "Not connected": "bg-slate/10 text-slate",
} as const;

export default function IntegrationsPage() {
  const toast = useToast();
  return (
    <>
      <PageHeader
        title="Integrations"
        subtitle="Where AccountPulse gets its data and which AI models it uses. Connect a source to replace its demo data."
      />
      <motion.div variants={listVariants} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2">
        {integrations.map((i) => (
          <motion.div key={i.name} variants={itemVariants}>
            <GlassPanel className="flex h-full items-start gap-4">
              <span className="clay font-display grid size-12 shrink-0 place-items-center rounded-2xl text-lg font-bold text-pulse">
                {i.name[0]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{i.name}</h2>
                  <span className={clsx("rounded-full px-2 py-0.5 text-[11px] font-bold", statusStyle[i.status])}>{i.status}</span>
                </div>
                <p className="mt-1 text-sm text-slate">{i.purpose}</p>
                <button
                  onClick={() => toast(`Add the ${i.name} key to the agent's .env to connect it`)}
                  className="clay focus-ring mt-3 h-9 rounded-xl px-3 text-sm font-semibold"
                >
                  {i.status === "Connected" ? "Manage" : "Connect"}
                </button>
              </div>
            </GlassPanel>
          </motion.div>
        ))}
      </motion.div>
    </>
  );
}
