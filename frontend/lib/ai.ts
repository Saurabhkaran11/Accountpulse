/**
 * AI helpers used by the "Ask AccountPulse" chat and the rescue-action
 * drafts.
 *
 * TODAY: answers come from a small rule-based demo over lib/data.ts so the
 * UI works offline and on stage.
 * NEXT STEP: set NEXT_PUBLIC_API_URL and implement POST /ask on the agent
 * API. That endpoint should turn the question into a Neo4j Cypher query,
 * run it, and ask Crusoe to phrase the answer. The response shape below
 * (AskResult) is the contract, so the chat page does not need to change.
 */
import { accounts, competitors, formatMoney, riskLevel, type Account } from "./data";

export interface AskResult {
  answer: string;
  accounts: Account[];
  engine: "demo" | "crusoe"; // shown under each answer so judges can see the model
}

export const suggestedQuestions = [
  "Who should I call today, and what do I say?",
  "Which accounts over $80K are high risk?",
  "Which accounts are exposed to Routewise?",
  "How much revenue is at risk this quarter?",
];

const API = process.env.NEXT_PUBLIC_API_URL;

export async function askAccountPulse(question: string): Promise<AskResult> {
  if (API) {
    try {
      const res = await fetch(`${API}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (res.ok) return (await res.json()) as AskResult;
    } catch {
      // Fall through to the demo answer so the chat never breaks mid-demo.
    }
  }
  // Small delay so the "thinking" animation is visible in demo mode.
  await new Promise((r) => setTimeout(r, 700));
  return demoAnswer(question);
}

function demoAnswer(q: string): AskResult {
  const text = q.toLowerCase();
  const byRisk = [...accounts].sort((a, b) => b.risk - a.risk);

  // "Who should I call" -> top account + its recommended play
  if (text.includes("call") || text.includes("today") || text.includes("first")) {
    const top = byRisk[0];
    return {
      answer: `Call ${top.name} first. ${top.why} Suggested next step: ${top.play}`,
      accounts: [top],
      engine: "demo",
    };
  }

  // Competitor exposure: "exposed to Routewise"
  const rival = competitors.find((c) => text.includes(c.name.toLowerCase()));
  if (rival) {
    const hit = accounts.filter((a) => a.competitor === rival.name);
    return {
      answer: `${hit.length} account${hit.length === 1 ? "" : "s"} are exposed to ${rival.name} (${formatMoney(
        hit.reduce((s, a) => s + a.arr, 0),
      )} in revenue). ${rival.name}'s traffic is ${rival.visitsChange > 0 ? "up" : "down"} ${Math.abs(
        rival.visitsChange,
      )}% over 90 days.`,
      accounts: hit,
      engine: "demo",
    };
  }

  // Dollar threshold: "over $80K"
  const money = text.match(/\$?(\d+)\s*k/);
  if (money) {
    const min = Number(money[1]) * 1000;
    const hit = byRisk.filter((a) => a.arr >= min && riskLevel(a.risk) === "high");
    return {
      answer: hit.length
        ? `${hit.length} high-risk account${hit.length === 1 ? "" : "s"} above ${formatMoney(min)}: ${hit
            .map((a) => `${a.name} (${a.risk})`)
            .join(", ")}.`
        : `No high-risk accounts above ${formatMoney(min)} right now.`,
      accounts: hit,
      engine: "demo",
    };
  }

  // Revenue at risk
  if (text.includes("revenue") || text.includes("risk") || text.includes("how much")) {
    const high = accounts.filter((a) => riskLevel(a.risk) === "high");
    const total = high.reduce((s, a) => s + a.arr, 0);
    return {
      answer: `${formatMoney(total)} is at high risk across ${high.length} accounts. The biggest is ${high[0]?.name ?? "none"}.`,
      accounts: high,
      engine: "demo",
    };
  }

  return {
    answer:
      "I can answer questions about your accounts, their risk, competitors and next steps. Try one of the suggestions below.",
    accounts: [],
    engine: "demo",
  };
}
