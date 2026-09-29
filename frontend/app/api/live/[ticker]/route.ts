/**
 * GET /api/live/:ticker  ->  real risk signals for a U.S. public company.
 *
 * Runs on the server so the SEC User-Agent (and the optional Crusoe key)
 * never reach the browser, and so SEC's CORS rules don't block us.
 * Example: curl http://localhost:3000/api/live/ZM
 */
import { NextResponse } from "next/server";
import { getLiveSignals, LiveError } from "@/lib/sec";

export async function GET(_req: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  try {
    const data = await getLiveSignals(ticker);
    return NextResponse.json(data, { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } });
  } catch (e) {
    const status = e instanceof LiveError ? e.status : 500;
    const message = e instanceof LiveError ? e.message : "Couldn't reach SEC EDGAR. Try again in a minute.";
    return NextResponse.json({ error: message }, { status });
  }
}
