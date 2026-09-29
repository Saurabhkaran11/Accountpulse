"use client";
/**
 * Ask AccountPulse: plain-English questions about your customers.
 * - Suggested questions for first-time users (empty state teaches usage).
 * - Answers show matching accounts as clickable chips.
 * - Each answer says which engine produced it (demo or Crusoe).
 */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AiBadge, GlassPanel, PageHeader, RiskBadge } from "@/components/ui";
import { useUser } from "@/components/Providers";
import { askAccountPulse, suggestedQuestions, type AskResult } from "@/lib/ai";

interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
  result?: AskResult;
}

export function AskChat() {
  const params = useSearchParams();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const askedFromUrl = useRef(false);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || thinking) return;
    setInput("");
    setMessages((m) => [...m, { id: Date.now(), role: "user", text: q }]);
    setThinking(true);
    const result = await askAccountPulse(q);
    setMessages((m) => [...m, { id: Date.now() + 1, role: "ai", text: result.answer, result }]);
    setThinking(false);
  };

  // If the user arrived from the search bar, ask their question right away.
  useEffect(() => {
    const q = params.get("q");
    if (q && !askedFromUrl.current) {
      askedFromUrl.current = true;
      void ask(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  return (
    <>
      <PageHeader
        title="Ask AccountPulse"
        subtitle="Ask about your customers in plain English. Answers come from your accounts, signals and competitor data."
        actions={<AiBadge />}
      />

      <GlassPanel className="flex min-h-[60vh] flex-col p-4 sm:p-6">
        <div className="scroll-quiet flex-1 space-y-4 overflow-y-auto pb-4">
          {/* Empty state: teaches what to ask */}
          {messages.length === 0 && (
            <div className="grid place-items-center py-10 text-center">
              <span className="clay-primary grid size-14 place-items-center rounded-2xl">
                <Sparkles className="size-6" aria-hidden />
              </span>
              <p className="font-display mt-4 text-lg font-semibold">What would you like to know?</p>
              <p className="mt-1 text-sm text-slate">Pick a question to start, or type your own below.</p>
              <div className="mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
                {suggestedQuestions.map((q) => (
                  <button key={q} onClick={() => ask(q)} className="clay focus-ring rounded-2xl px-4 py-2 text-sm font-semibold text-ink">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                {m.role === "user" ? (
                  <div className="clay-primary max-w-[85%] rounded-3xl rounded-br-lg px-4 py-3 text-sm sm:max-w-[70%]">
                    <span className="sr-only">{user.name}: </span>
                    {m.text}
                  </div>
                ) : (
                  <div className="glass-strong max-w-[92%] rounded-3xl rounded-bl-lg px-4 py-3 sm:max-w-[75%]">
                    <p className="text-[15px] leading-relaxed">{m.text}</p>
                    {m.result && m.result.accounts.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {m.result.accounts.map((a) => (
                          <Link
                            key={a.id}
                            href={`/dashboard/accounts/${a.id}`}
                            className="focus-ring inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-sm font-semibold ring-1 ring-white hover:bg-white"
                          >
                            {a.name} <RiskBadge score={a.risk} />
                          </Link>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 text-[11px] font-semibold text-slate">
                      Answered by {m.result?.engine === "crusoe" ? "Crusoe" : "demo data"}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Thinking indicator: three bouncing dots */}
          {thinking && (
            <div className="glass-strong inline-flex gap-1.5 rounded-3xl rounded-bl-lg px-4 py-4" aria-label="Thinking">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="size-2 rounded-full bg-pulse"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
                />
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void ask(input);
          }}
          className="clay-inset flex items-center gap-2 rounded-2xl p-1.5 pl-4"
        >
          <label htmlFor="ask-input" className="sr-only">
            Your question
          </label>
          <input
            id="ask-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Which accounts renew in the next 60 days?"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate/70"
            autoComplete="off"
          />
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="submit"
            disabled={!input.trim() || thinking}
            aria-label="Send question"
            className="clay-primary focus-ring grid size-10 shrink-0 place-items-center rounded-xl disabled:opacity-50"
          >
            <ArrowUp className="size-5" aria-hidden />
          </motion.button>
        </form>
      </GlassPanel>
    </>
  );
}
