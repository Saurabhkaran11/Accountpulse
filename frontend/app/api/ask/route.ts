/**
 * POST /api/ask -> answers a question about the demo accounts with the visitor's own OpenRouter key.
 * The key arrives in a header, is used for this request only, and is never stored or logged.
 */
import { NextResponse } from "next/server";
import { accounts } from "@/lib/data";

export const runtime = "nodejs";
const MODEL = process.env.ASK_MODEL || "z-ai/glm-5.3";

export async function POST(req: Request) {
  const key = (req.headers.get("x-openrouter-key") || "").trim();
  if (!/^sk-or-[A-Za-z0-9_-]{20,300}$/.test(key)) {
    return NextResponse.json({ error: "That does not look like an OpenRouter key. Keys start with sk-or-." }, { status: 400 });
  }
  const body = (await req.json().catch(() => null)) as { question?: unknown } | null;
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question || question.length > 1000) {
    return NextResponse.json({ error: "Ask a question of up to 1,000 characters." }, { status: 400 });
  }
  const compact = accounts.map(({ name, risk, arr, renewalDate, openTickets, competitor, why, play }) => ({ name, risk, arr, renewalDate, openTickets, competitor, why, play }));
  const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1200,
      messages: [
        { role: "system", content: "You help a customer-success manager. Answer in 2-3 plain sentences using only the account data given. Name the accounts you mean. These are sample accounts." },
        { role: "user", content: `Accounts: ${JSON.stringify(compact)}\nQuestion: ${question}` },
      ],
    }),
  }).catch(() => null);
  if (!upstream) return NextResponse.json({ error: "Could not reach OpenRouter. Try again." }, { status: 502 });
  if (upstream.status === 401 || upstream.status === 403) return NextResponse.json({ error: "OpenRouter rejected that key. Check it and try again." }, { status: 401 });
  if (upstream.status === 402) return NextResponse.json({ error: "Your OpenRouter account is out of credit." }, { status: 402 });
  if (upstream.status === 429) return NextResponse.json({ error: "Your OpenRouter account is over its rate limit. Try again shortly." }, { status: 429 });
  if (!upstream.ok) return NextResponse.json({ error: `The AI model could not answer (error ${upstream.status}). Try again.` }, { status: 502 });
  const data = (await upstream.json()) as { choices?: { message?: { content?: string } }[] };
  const answer = (data.choices?.[0]?.message?.content || "").trim();
  if (!answer) return NextResponse.json({ error: "The AI model returned an empty answer. Try again." }, { status: 502 });
  const mentioned = accounts.filter((a) => answer.toLowerCase().includes(a.name.toLowerCase()));
  return NextResponse.json({ answer, accounts: mentioned, engine: "your-key" });
}
