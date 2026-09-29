"use client";
/**
 * Rescue actions: AI-drafted emails, call notes and offers for at-risk
 * accounts. Review, edit, copy, then mark as sent.
 */
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { Copy, Mail, Phone, Tag, Send } from "lucide-react";
import { useState } from "react";
import { AiBadge, ClayButton, GlassPanel, PageHeader, RiskBadge } from "@/components/ui";
import { useToast } from "@/components/Providers";
import { accounts, rescueActions, type RescueAction } from "@/lib/data";

const typeIcon = { Email: Mail, Call: Phone, Offer: Tag } as const;
const statusStyle = {
  Draft: "bg-pulse-soft text-pulse",
  Sent: "bg-mint/12 text-mint",
  Done: "bg-slate/10 text-slate",
} as const;

export default function ActionsPage() {
  const toast = useToast();
  const [items, setItems] = useState<RescueAction[]>(rescueActions);
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  const update = (id: string, patch: Partial<RescueAction>) =>
    setItems((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied to clipboard");
    } catch {
      toast("Select the text to copy it");
    }
  };

  return (
    <>
      <PageHeader
        title="Rescue actions"
        subtitle="Ready-to-send messages written for each at-risk account. Edit anything before you send."
        actions={<AiBadge />}
      />

      <div className="space-y-3">
        {items.map((item) => {
          const acc = accounts.find((a) => a.id === item.accountId);
          const Icon = typeIcon[item.type];
          const open = openId === item.id;
          return (
            <GlassPanel key={item.id} as="article" className="p-0">
              <button
                onClick={() => setOpenId(open ? null : item.id)}
                aria-expanded={open}
                className="focus-ring flex w-full items-center gap-4 rounded-[22px] p-4 text-left sm:p-5"
              >
                <span className="clay grid size-11 shrink-0 place-items-center rounded-2xl text-pulse">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{item.title}</span>
                  <span className="block truncate text-sm text-slate">
                    {item.type} for {acc?.name}
                  </span>
                </span>
                {acc && (
                  <span className="hidden sm:block">
                    <RiskBadge score={acc.risk} />
                  </span>
                )}
                <span className={clsx("rounded-full px-2.5 py-1 text-xs font-bold", statusStyle[item.status])}>{item.status}</span>
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-5 sm:px-5">
                      <label htmlFor={`draft-${item.id}`} className="sr-only">
                        Edit draft
                      </label>
                      <textarea
                        id={`draft-${item.id}`}
                        value={item.draft}
                        onChange={(e) => update(item.id, { draft: e.target.value })}
                        rows={Math.min(12, item.draft.split("\n").length + 1)}
                        className="clay-inset focus-ring w-full resize-y rounded-2xl p-4 text-sm leading-relaxed outline-none"
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <ClayButton
                          variant="primary"
                          icon={<Send className="size-4" aria-hidden />}
                          disabled={item.status !== "Draft"}
                          onClick={() => {
                            update(item.id, { status: "Sent" });
                            toast(`Marked as sent to ${acc?.name}`);
                          }}
                        >
                          {item.status === "Draft" ? "Mark as sent" : "Sent"}
                        </ClayButton>
                        <ClayButton icon={<Copy className="size-4" aria-hidden />} onClick={() => copy(item.draft)}>
                          Copy
                        </ClayButton>
                        {acc && (
                          <Link href={`/dashboard/accounts/${acc.id}`} className="clay focus-ring inline-flex h-11 items-center rounded-2xl px-4 text-sm font-semibold">
                            Open account
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassPanel>
          );
        })}
      </div>
    </>
  );
}
