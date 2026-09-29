"use client";
/**
 * Picks the account to show: the live one from the agent API if it exists,
 * otherwise the demo account with this id. Shows loading and not-found states.
 */
import Link from "next/link";
import { GlassPanel } from "@/components/ui";
import { PulseLine } from "@/components/motion";
import { useLiveData } from "@/components/LiveData";
import type { Account } from "@/lib/data";
import { AccountDetail } from "./AccountDetail";

export function AccountRoute({ id, demo }: { id: string; demo: Account | null }) {
  const { findAccount, loading } = useLiveData();
  const account = findAccount(id) ?? demo;

  if (!account && loading) {
    return (
      <GlassPanel className="grid place-items-center gap-3 py-16 text-center">
        <PulseLine width={220} height={60} beat />
        <p className="text-sm font-semibold text-slate">Loading the latest scan</p>
      </GlassPanel>
    );
  }
  if (!account) {
    return (
      <GlassPanel className="py-12 text-center">
        <p className="font-display text-lg font-semibold">This account isn&apos;t in the latest scan</p>
        <p className="mt-1 text-sm text-slate">It may have been removed from your CRM. Pick one from the list.</p>
        <Link href="/dashboard/accounts" className="clay-primary focus-ring mt-5 inline-flex h-10 items-center rounded-2xl px-4 text-sm font-semibold">
          All accounts
        </Link>
      </GlassPanel>
    );
  }
  return <AccountDetail account={account} />;
}
