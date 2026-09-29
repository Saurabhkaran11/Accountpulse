"use client";
/**
 * Dashboard frame: top bar + sidebar + scrollable content area.
 * The content area's left padding follows the sidebar width so nothing
 * ever sits underneath the sidebar.
 */
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";
import { AmbientBackground } from "@/components/motion";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer whenever the page changes.
  useEffect(() => setMobileOpen(false), [pathname]);

  // One burger, two behaviours: collapse on desktop, drawer on mobile.
  const onMenu = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) setCollapsed((c) => !c);
    else setMobileOpen((o) => !o);
  };

  return (
    <div className="min-h-dvh">
      <AmbientBackground />
      <Topbar menuOpen={mobileOpen} onMenu={onMenu} />
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main
        className={clsx(
          "px-4 pb-10 pt-[88px] transition-[padding] duration-300 sm:px-6",
          collapsed ? "lg:pl-[112px]" : "lg:pl-[292px]",
        )}
      >
        <div className="mx-auto max-w-[1280px]">{children}</div>
      </main>
    </div>
  );
}
