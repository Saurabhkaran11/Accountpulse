"use client";
/**
 * Global search in the top bar.
 * - Searches pages (features) and accounts as you type.
 * - Last result always offers "Ask AccountPulse" so any question can go
 *   straight to the AI chat.
 * - Keyboard: Ctrl/Cmd+K to focus, arrows to move, Enter to open, Esc to close.
 */
import { AnimatePresence, motion } from "framer-motion";
import { Search, Sparkles, Building2, CornerDownLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { accounts } from "@/lib/data";
import { allNav } from "@/lib/nav";

interface Result {
  key: string;
  label: string;
  hint: string;
  href: string;
  kind: "page" | "account" | "ask";
}

export function SearchBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  // Ctrl/Cmd + K focuses the search from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const pages: Result[] = allNav
      .filter((n) => n.label.toLowerCase().includes(q) || n.description.toLowerCase().includes(q))
      .slice(0, 4)
      .map((n) => ({ key: n.href, label: n.label, hint: n.description, href: n.href, kind: "page" }));
    const accs: Result[] = accounts
      .filter((a) => a.name.toLowerCase().includes(q) || a.industry.toLowerCase().includes(q))
      .slice(0, 4)
      .map((a) => ({
        key: a.id,
        label: a.name,
        hint: `Risk ${a.risk} · ${a.industry}`,
        href: `/dashboard/accounts/${a.id}`,
        kind: "account",
      }));
    const ask: Result = {
      key: "ask",
      label: `Ask AccountPulse: "${query.trim()}"`,
      hint: "Get an AI answer about your customers",
      href: `/dashboard/ask?q=${encodeURIComponent(query.trim())}`,
      kind: "ask",
    };
    return [...accs, ...pages, ask];
  }, [query]);

  const go = (r: Result) => {
    router.push(r.href);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative w-full max-w-xl">
      <label htmlFor="global-search" className="sr-only">
        Search accounts, pages or ask a question
      </label>
      <div className="clay-inset flex h-11 items-center gap-2 rounded-2xl px-3.5">
        <Search className="size-4 shrink-0 text-slate" aria-hidden />
        <input
          id="global-search"
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          placeholder="Search or ask AI"
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-slate/70"
          autoComplete="off"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls="search-results"
        />
        <kbd className="hidden shrink-0 rounded-md bg-white/70 px-1.5 py-0.5 text-[11px] font-semibold text-slate md:inline">
          Ctrl K
        </kbd>
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.ul
            id="search-results"
            role="listbox"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="glass-strong absolute inset-x-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl p-1.5"
          >
            {results.map((r, i) => (
              <li key={r.key} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(r)}
                  onMouseEnter={() => setActive(i)}
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left",
                    i === active && "bg-white/80",
                  )}
                >
                  <span
                    className={clsx(
                      "grid size-8 shrink-0 place-items-center rounded-lg",
                      r.kind === "ask" ? "bg-pulse-soft text-pulse" : "bg-white text-slate",
                    )}
                  >
                    {r.kind === "ask" ? (
                      <Sparkles className="size-4" aria-hidden />
                    ) : r.kind === "account" ? (
                      <Building2 className="size-4" aria-hidden />
                    ) : (
                      <Search className="size-4" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{r.label}</span>
                    <span className="block truncate text-xs text-slate">{r.hint}</span>
                  </span>
                  {i === active && <CornerDownLeft className="size-4 shrink-0 text-slate" aria-hidden />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
