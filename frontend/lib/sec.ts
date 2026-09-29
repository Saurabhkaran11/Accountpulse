/**
 * Real-world data source: SEC EDGAR (U.S. Securities and Exchange Commission).
 *
 * Free, official, no API key. Works for any U.S. public company.
 * Docs: https://www.sec.gov/search-filings/edgar-application-programming-interfaces
 *
 * What we read:
 *   1. company_tickers.json      ticker -> company id (CIK)
 *   2. submissions/CIK##.json    recent filings, including 8-K "current reports"
 *   3. companyconcept (XBRL)     reported quarterly revenue
 *
 * 8-K item codes are the company's own legal disclosure of big events, e.g.
 * 2.05 = restructuring / layoffs, 5.02 = executive departure. Each one becomes
 * an explainable risk signal below.
 *
 * SEC rules: send a User-Agent with a real contact email (set SEC_USER_AGENT)
 * and stay under 10 requests per second. Responses are cached for an hour.
 *
 * SERVER ONLY: imported by app/api/live/[ticker]/route.ts, never by a page.
 */

const UA = process.env.SEC_USER_AGENT || "AccountPulse contact@example.com";
const HEADERS = { "User-Agent": UA, Accept: "application/json" };

/** 8-K items that matter for account risk, with a plain-English label and weight. */
const ITEM_RULES: Record<string, { label: string; weight: number }> = {
  "1.02": { label: "Ended a major contract", weight: 15 },
  "1.03": { label: "Filed for bankruptcy", weight: 45 },
  "2.01": { label: "Completed an acquisition or sale of assets", weight: 12 },
  "2.05": { label: "Announced restructuring or layoffs", weight: 25 },
  "2.06": { label: "Wrote down the value of assets", weight: 10 },
  "3.01": { label: "Received a stock exchange delisting notice", weight: 30 },
  "4.02": { label: "Said earlier financial statements can't be relied on", weight: 20 },
  "5.01": { label: "Change in control of the company", weight: 25 },
  "5.02": { label: "Executive or board member left or joined", weight: 10 },
};

/** Items we show on the timeline but don't score (routine). */
const NEUTRAL_ITEMS: Record<string, string> = {
  "1.01": "Signed a major agreement",
  "2.02": "Reported quarterly results",
  "5.07": "Held a shareholder vote",
  "7.01": "Made a public disclosure",
  "8.01": "Reported another event",
};

export interface LiveEvent {
  date: string;
  form: string;
  items: { code: string; label: string; weight: number }[];
  url: string;
}

export interface LiveResult {
  company: { name: string; ticker: string; cik: string; industry: string };
  risk: number;
  reasons: string[];
  play: string;
  why: string;
  whyEngine: "rules" | "crusoe";
  revenue: { quarters: { label: string; value: number }[]; yoyChange: number | null };
  events: LiveEvent[];
  source: "SEC EDGAR";
  fetchedAt: string;
}

export class LiveError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

async function secJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: HEADERS, next: { revalidate: 3600 } });
  if (res.status === 404) throw new LiveError("SEC has no data for this company.", 404);
  if (!res.ok) throw new LiveError(`SEC EDGAR returned ${res.status}. Try again in a minute.`, 502);
  return res.json() as Promise<T>;
}

async function lookupCik(ticker: string) {
  const all = await secJson<Record<string, { cik_str: number; ticker: string; title: string }>>(
    "https://www.sec.gov/files/company_tickers.json",
  );
  const hit = Object.values(all).find((c) => c.ticker.toUpperCase() === ticker.toUpperCase());
  if (!hit) throw new LiveError(`No U.S. public company found for "${ticker}". Check the stock ticker.`, 404);
  return { cik: String(hit.cik_str).padStart(10, "0"), name: hit.title };
}

interface Submissions {
  name: string;
  tickers: string[];
  sicDescription: string;
  filings: {
    recent: {
      form: string[];
      filingDate: string[];
      items: string[];
      accessionNumber: string[];
      primaryDocument: string[];
    };
  };
}

interface Concept {
  units: { USD: { val: number; frame?: string; form: string }[] };
}

/** Quarterly revenue. Companies use different XBRL tags, so try the common ones. */
async function getRevenue(cik: string) {
  for (const tag of ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "SalesRevenueNet"]) {
    try {
      const c = await secJson<Concept>(`https://data.sec.gov/api/xbrl/companyconcept/CIK${cik}/us-gaap/${tag}.json`);
      const quarters = (c.units.USD ?? [])
        .filter((x) => /^CY\d{4}Q[1-4]$/.test(x.frame ?? ""))
        .map((x) => ({ label: x.frame!.slice(2), value: x.val }))
        .sort((a, b) => a.label.localeCompare(b.label));
      if (quarters.length) {
        const last = quarters[quarters.length - 1];
        const lastYear = quarters.find((q) => q.label === `${Number(last.label.slice(0, 4)) - 1}${last.label.slice(4)}`);
        const yoyChange = lastYear ? Math.round(((last.value - lastYear.value) / lastYear.value) * 1000) / 10 : null;
        return { quarters: quarters.slice(-8), yoyChange };
      }
    } catch {
      // try the next tag
    }
  }
  return { quarters: [], yoyChange: null };
}

const daysAgo = (iso: string) => (Date.now() - new Date(iso).getTime()) / 86_400_000;

/** Optional: let Crusoe phrase the explanation. Falls back to rules if unset or failing. */
async function crusoeWhy(company: string, reasons: string[]): Promise<string | null> {
  const key = process.env.CRUSOE_API_KEY;
  if (!key || reasons.length === 0) return null;
  try {
    const res = await fetch(`${process.env.CRUSOE_BASE_URL || "https://api.inference.crusoecloud.com/v1"}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.CRUSOE_MODEL || "openai/gpt-oss-120b",
        temperature: 0.2,
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content:
              "You explain customer churn risk to account managers in 2 plain sentences. Use only the facts given. No speculation.",
          },
          { role: "user", content: `Customer: ${company}\nFacts from SEC filings:\n- ${reasons.join("\n- ")}` },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

export async function getLiveSignals(rawTicker: string): Promise<LiveResult> {
  const ticker = rawTicker.trim().toUpperCase();
  if (!/^[A-Z.\-]{1,6}$/.test(ticker)) throw new LiveError("Enter a stock ticker like ZM or INTC.");

  const { cik, name } = await lookupCik(ticker);
  const [subs, revenue] = await Promise.all([
    secJson<Submissions>(`https://data.sec.gov/submissions/CIK${cik}.json`),
    getRevenue(cik),
  ]);

  // ---- 8-K events from the last 12 months ----
  const r = subs.filings.recent;
  const events: LiveEvent[] = [];
  for (let i = 0; i < r.form.length; i++) {
    if (!r.form[i].startsWith("8-K") || daysAgo(r.filingDate[i]) > 365) continue;
    const codes = (r.items[i] || "").split(",").map((s) => s.trim()).filter((c) => c && c !== "9.01");
    if (codes.length === 0) continue; // exhibits-only filings carry no signal
    events.push({
      date: r.filingDate[i],
      form: r.form[i],
      items: codes.map((code) => ({
        code,
        label: ITEM_RULES[code]?.label ?? NEUTRAL_ITEMS[code] ?? `Item ${code}`,
        weight: ITEM_RULES[code]?.weight ?? 0,
      })),
      url: `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${r.accessionNumber[i].replace(/-/g, "")}/${r.primaryDocument[i]}`,
    });
  }

  // ---- Explainable score: start at 20, add weighted signals ----
  // Each type of event counts once, at its most recent (strongest) weight,
  // plus a small bump for repeats, so routine repeat filings don't pile up.
  let risk = 20;
  const scored: { text: string; weight: number }[] = [];
  const seen = new Set<string>();
  for (const e of events) {
    const age = daysAgo(e.date);
    const decay = age <= 90 ? 1 : age <= 180 ? 0.5 : 0.25; // recent events count more
    for (const it of e.items) {
      if (!it.weight) continue;
      if (seen.has(it.code)) {
        risk += 2; // repeat of an event type we already counted
        continue;
      }
      seen.add(it.code);
      risk += it.weight * decay;
      scored.push({ text: `${it.label} (SEC filing, ${e.date})`, weight: it.weight });
    }
  }
  if (revenue.yoyChange !== null) {
    if (revenue.yoyChange < -5) {
      risk += 20;
      scored.push({ text: `Revenue down ${Math.abs(revenue.yoyChange)}% from the same quarter last year`, weight: 20 });
    } else if (revenue.yoyChange < 0) {
      risk += 10;
      scored.push({ text: `Revenue slightly down (${revenue.yoyChange}%) year over year`, weight: 10 });
    } else if (revenue.yoyChange > 10) {
      risk -= 10;
      scored.push({ text: `Revenue growing ${revenue.yoyChange}% year over year`, weight: -10 });
    }
  }
  // Strongest warning first; good news last.
  const reasons = scored.sort((a, b) => b.weight - a.weight).map((x) => x.text);
  risk = Math.max(0, Math.min(100, Math.round(risk)));

  // ---- Recommended next step, based on the strongest signal ----
  const play = seen.has("1.03") || seen.has("3.01")
    ? "Protect your revenue: confirm payment terms and talk to their finance team this week."
    : seen.has("2.05")
      ? "Budgets are being cut. Book a value review showing the savings you deliver before renewal."
      : seen.has("5.01") || seen.has("2.01")
        ? "Ownership is changing. Find the new decision-makers and introduce yourself early."
        : seen.has("5.02")
          ? "Leadership changed. Brief the new executive on the results your product delivers."
          : "No major warning signs. A good moment to ask for a referral or propose an upgrade.";

  const ruleWhy = reasons.length
    ? `${subs.name} has ${reasons.length} signal${reasons.length === 1 ? "" : "s"} in its SEC filings: ${reasons
        .slice(0, 3)
        .map((x) => x.replace(/ \(SEC filing.*\)$/, "").toLowerCase())
        .join("; ")}.`
    : `${subs.name} has filed no warning signs with the SEC in the last 12 months.`;
  const aiWhy = await crusoeWhy(subs.name, reasons);

  return {
    company: { name: subs.name || name, ticker, cik, industry: subs.sicDescription || "Unknown industry" },
    risk,
    reasons,
    play,
    why: aiWhy ?? ruleWhy,
    whyEngine: aiWhy ? "crusoe" : "rules",
    revenue,
    events: events.slice(0, 25), // every 8-K from the last 12 months (capped)
    source: "SEC EDGAR",
    fetchedAt: new Date().toISOString(),
  };
}
