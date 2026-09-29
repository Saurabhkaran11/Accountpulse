"use client";
/**
 * Left sidebar with every product feature, opened/closed by the burger
 * button in the top bar.
 *
 * Desktop (lg and up): always visible. Burger toggles between expanded
 *   (icons + labels, 264px) and collapsed (icons only, 84px).
 * Mobile/tablet: hidden. Burger slides it in as a drawer over a dimmed
 *   backdrop; tapping a link or the backdrop closes it.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { featureNav, profileNav, settingsNav, type NavItem } from "@/lib/nav";
import { AiBadge } from "@/components/ui";
import { useLiveData } from "@/components/LiveData";

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

function NavLink({
  item,
  collapsed,
  onNavigate,
  layoutGroup,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
  layoutGroup: string;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "focus-ring relative flex h-12 items-center rounded-2xl text-sm font-semibold transition-colors",
        collapsed ? "justify-center px-0" : "gap-3 px-2.5",
        active ? "text-pulse" : "text-slate hover:text-ink",
      )}
    >
      {/* Animated highlight that glides between items */}
      {active && (
        <motion.span
          layoutId={`nav-active-${layoutGroup}`}
          className="absolute inset-0 rounded-2xl bg-white/80 shadow-[0_6px_18px_rgba(40,50,110,0.10)]"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}
      <span
        className={clsx(
          "relative grid size-9 shrink-0 place-items-center rounded-xl",
          active ? "clay-pressed bg-[#eef1f8]" : "clay",
        )}
      >
        <Icon className="size-[18px]" aria-hidden />
      </span>
      {!collapsed && (
        <span className="relative flex min-w-0 flex-1 items-center justify-between gap-2">
          <span className="truncate">{item.label}</span>
          {item.ai && <AiBadge />}
        </span>
      )}
      {collapsed && <span className="sr-only">{item.label}</span>}
    </Link>
  );
}

function NavList({
  collapsed,
  onNavigate,
  layoutGroup,
  showAccountLinks,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  layoutGroup: string;
  showAccountLinks?: boolean;
}) {
  return (
    <nav aria-label="Product features" className="scroll-quiet flex h-full flex-col gap-1.5 overflow-y-auto p-3">
      {featureNav.map((item) => (
        <NavLink key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} layoutGroup={layoutGroup} />
      ))}

      {/* On mobile the header hides the settings icon, so offer both here */}
      {showAccountLinks && (
        <>
          <div className="my-2 h-px bg-slate/15" />
          <NavLink item={settingsNav} collapsed={false} onNavigate={onNavigate} layoutGroup={layoutGroup} />
          <NavLink item={profileNav} collapsed={false} onNavigate={onNavigate} layoutGroup={layoutGroup} />
        </>
      )}

      {!collapsed && <DataStatus onNavigate={onNavigate} />}
    </nav>
  );
}

/** Bottom-of-sidebar card: says whether the dashboard is showing live or demo data. */
function DataStatus({ onNavigate }: { onNavigate?: () => void }) {
  const { isLive, data, loading, error } = useLiveData();
  if (isLive && data.source === "live") {
    return (
      <div className="mt-auto rounded-2xl bg-mint/10 p-3 text-xs text-slate ring-1 ring-white">
        <p className="flex items-center gap-1.5 font-semibold text-mint">
          <span className="size-2 animate-pulse rounded-full bg-mint" /> Live data
        </p>
        <p className="mt-1">{data.accounts.length} accounts scored by Crusoe, fact-checked by Nebius.</p>
      </div>
    );
  }
  return (
        <div className="mt-auto rounded-2xl bg-white/55 p-3 text-xs text-slate ring-1 ring-white">
          <p className="font-semibold text-ink">{loading ? "Connecting to live data" : data.source === "mock" ? "Backend sample mode" : "Demo data"}</p>
          <p className="mt-1">{error ? `Agent API: ${error}.` : "Connect the agent API to see your real accounts."}</p>
          <Link href="/dashboard/integrations" onClick={onNavigate} className="mt-2 inline-block font-semibold text-pulse">
            Connect data
          </Link>
        </div>
  );
}

export function Sidebar({
  collapsed,
  mobileOpen,
  onClose,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* ---------- Desktop sidebar ---------- */}
      <motion.aside
        id="app-sidebar"
        animate={{ width: collapsed ? 84 : 264 }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        className="glass fixed bottom-3 left-3 top-[76px] z-30 hidden overflow-hidden rounded-[22px] lg:block"
      >
        <NavList collapsed={collapsed} layoutGroup="desktop" />
      </motion.aside>

      {/* ---------- Mobile drawer ---------- */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 top-16 z-30 bg-ink/20 backdrop-blur-[2px] lg:hidden"
              aria-hidden
            />
            <motion.aside
              key="drawer"
              id="app-sidebar-mobile"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="glass-strong fixed bottom-3 left-3 top-[76px] z-40 w-[272px] overflow-hidden rounded-[22px] lg:hidden"
            >
              <NavList collapsed={false} onNavigate={onClose} layoutGroup="mobile" showAccountLinks />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
