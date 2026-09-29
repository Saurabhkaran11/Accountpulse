"use client";
/**
 * App-wide client state:
 *  - MotionConfig: honours the visitor's "reduce motion" OS setting.
 *  - UserContext: the signed-in user; the Profile page edits it and the
 *    header avatar updates immediately.
 *  - Toasts: small confirmation messages ("Profile saved").
 *  - LiveDataProvider: live accounts from the agent API (demo data as fallback).
 */
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { currentUser } from "@/lib/data";
import { LiveDataProvider } from "@/components/LiveData";

type User = typeof currentUser;

const UserContext = createContext<{ user: User; setUser: (u: User) => void } | null>(null);
const ToastContext = createContext<(message: string) => void>(() => {});

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside <Providers>");
  return ctx;
}

export const useToast = () => useContext(ToastContext);

export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(currentUser);
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);

  const toast = useCallback((message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <UserContext.Provider value={{ user, setUser }}>
        <ToastContext.Provider value={toast}>
          <LiveDataProvider>{children}</LiveDataProvider>
          {/* Toast stack: bottom-right, above everything, never covers the header */}
          <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col gap-2" aria-live="polite">
            <AnimatePresence>
              {toasts.map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 16, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="glass-strong flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-ink"
                >
                  <CheckCircle2 className="size-4 text-mint" aria-hidden /> {t.message}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ToastContext.Provider>
      </UserContext.Provider>
    </MotionConfig>
  );
}
