/**
 * Account detail route: /dashboard/accounts/[id]
 * Demo accounts are pre-rendered at build time. Live accounts from the agent API
 * (e.g. /dashboard/accounts/chegg) are looked up in the browser by AccountRoute.
 */
import type { Metadata } from "next";
import { accounts } from "@/lib/data";
import { AccountRoute } from "./AccountRoute";

export function generateStaticParams() {
  return accounts.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const account = accounts.find((a) => a.id === id);
  return { title: account?.name ?? "Account" };
}

export default async function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const demo = accounts.find((a) => a.id === id) ?? null;
  return <AccountRoute id={id} demo={demo} />;
}
