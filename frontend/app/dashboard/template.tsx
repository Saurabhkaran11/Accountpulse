"use client";
/**
 * Page transition: each dashboard page fades and rises in when you
 * navigate. template.tsx re-mounts on every route change, layout.tsx
 * does not, so the sidebar and header stay still while content moves.
 */
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export default function DashboardTemplate({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
