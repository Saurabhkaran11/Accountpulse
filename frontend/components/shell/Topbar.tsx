"use client";
/**
 * Top bar layout (fixed, 64px tall). Three zones that never overlap:
 *
 *  [ burger | logo ]  [      search bar      ]  [ Run scan | bell | settings | profile ]
 *   left: shrink-0      center: flex-1, min-w-0   right: shrink-0
 *
 * The profile avatar sits in the far top-right corner, settings just left
 * of it. On small screens the logo text, bell, settings icon and "Run scan"
 * label hide so the search bar keeps usable width (settings stays reachable
 * from the menu drawer).
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Bell, Menu, RefreshCw, X } from "lucide-react";
import { ClayIconButton } from "@/components/ui";
import { LogoMark } from "@/components/motion";
import { useToast, useUser } from "@/components/Providers";
import { useLiveData } from "@/components/LiveData";
import { profileNav, settingsNav } from "@/lib/nav";
import { SearchBar } from "./SearchBar";

export function Topbar({ menuOpen, onMenu }: { menuOpen: boolean; onMenu: () => void }) {
  const pathname = usePathname();
  const { user } = useUser();
  const toast = useToast();
  const { rescan, scanning, apiConfigured } = useLiveData();

  // Runs a fresh scan across every sponsor through the agent API (POST /scan).
  const runScan = async () => {
    if (!apiConfigured) {
      toast("Showing demo data: set NEXT_PUBLIC_API_URL to scan live");
      return;
    }
    const d = await rescan();
    if (!d) {
      toast("Scan failed: is the agent API running on port 8000?");
      return;
    }
    const high = d.accounts.filter((a) => a.risk >= 70).length;
    toast(`Scan complete: ${d.accounts.length} accounts, ${high} high risk`);
  };

  const SettingsIcon = settingsNav.icon;

  return (
    <header className="glass-strong fixed inset-x-0 top-0 z-40 h-16 rounded-none border-x-0 border-t-0">
      <div className="flex h-full items-center gap-3 px-3 sm:px-4">
        {/* ---------- Left: menu + brand ---------- */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ClayIconButton label={menuOpen ? "Close menu" : "Open menu"} onClick={onMenu} aria-expanded={menuOpen} aria-controls="app-sidebar">
            {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </ClayIconButton>

          <Link href="/dashboard" className="focus-ring flex items-center gap-2 rounded-xl" aria-label="AccountPulse home">
            <LogoMark />
            <span className="font-display hidden text-[17px] font-bold text-ink lg:inline">AccountPulse</span>
          </Link>

        </div>

        {/* ---------- Center: search ---------- */}
        <div className="flex min-w-0 flex-1 justify-center">
          <SearchBar />
        </div>

        {/* ---------- Right: primary action, alerts, settings, profile ---------- */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={runScan}
            disabled={scanning}
            className="clay-primary focus-ring inline-flex h-10 items-center gap-2 rounded-2xl px-3 text-sm font-semibold sm:px-4"
            aria-label="Run scan"
          >
            <RefreshCw className={clsx("size-4", scanning && "animate-spin")} aria-hidden />
            <span className="hidden md:inline">{scanning ? "Scanning" : "Run scan"}</span>
          </motion.button>
          <Link
            href="/dashboard/signals"
            aria-label="New signals"
            title="New signals"
            className="clay focus-ring relative hidden size-10 place-items-center rounded-2xl text-ink md:grid"
          >
            <Bell className="size-5" aria-hidden />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-coral ring-2 ring-white" />
          </Link>
          <span className="mx-0.5 hidden h-7 w-px bg-slate/20 sm:block" aria-hidden />

          <Link
            href={settingsNav.href}
            aria-label="Settings"
            title="Settings"
            className={clsx(
              "focus-ring hidden size-10 shrink-0 place-items-center rounded-2xl sm:grid",
              pathname === settingsNav.href ? "clay-pressed text-pulse" : "clay text-ink",
            )}
          >
            <SettingsIcon className="size-5" aria-hidden />
          </Link>

          <Link
            href={profileNav.href}
            aria-label={`Profile: ${user.name}`}
            title="Profile"
            className={clsx(
              "focus-ring grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold",
              pathname === profileNav.href ? "clay-pressed text-pulse" : "clay text-pulse",
            )}
          >
            {user.initials}
          </Link>
        </div>
      </div>
    </header>
  );
}
