import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";

// Every page under /dashboard shares the top bar and sidebar.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
