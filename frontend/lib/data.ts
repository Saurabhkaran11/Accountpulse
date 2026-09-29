/**
 * Demo data for the AccountPulse UI.
 *
 * Every page reads from this file today. In the next step, lib/api.ts
 * swaps these for live results from the agent API (Merge.dev, Brave,
 * Similarweb, Crusoe, OpenRouter/Nebius, Neo4j). Keep the shapes stable
 * so pages do not need to change when the real data arrives.
 */

export type RiskLevel = "high" | "medium" | "low";

/** Which sponsor tool produced a piece of evidence. Shown as a source chip. */
export type SignalSource =
  | "Merge.dev"
  | "Brave"
  | "Google News"
  | "Similarweb"
  | "Crusoe"
  | "Nebius critic"
  | "Neo4j"
  | "SEC EDGAR"
  | "Sample"
  | "Sample CRM";

export interface Evidence {
  label: string;
  detail: string;
  source: SignalSource;
  url?: string;
}

export interface Account {
  id: string;
  name: string;
  domain: string;
  industry: string;
  arr: number; // annual recurring revenue in USD
  renewalDate: string; // ISO date
  risk: number; // 0-100, higher = more likely to churn
  trend: number[]; // last 8 weekly risk scores, oldest first
  owner: string;
  openTickets: number;
  competitor: string;
  why: string; // plain-English explanation written by the AI
  evidence: Evidence[];
  play: string; // recommended next action
  criticVerified: boolean; // second model agreed with the verdict
  // Present on live accounts from the agent API (backend GET /accounts)
  provider?: string; // model that scored it, e.g. "crusoe:openai/gpt-oss-120b"
  criticProvider?: string; // model that fact-checked it, e.g. "nebius-via-openrouter:..."
  criticNote?: string;
}

export function riskLevel(score: number): RiskLevel {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export const accounts: Account[] = [
  {
    id: "acme-logistics",
    name: "Acme Logistics",
    domain: "acmelogistics.com",
    industry: "Logistics",
    arr: 120000,
    renewalDate: "2026-11-15",
    risk: 86,
    trend: [34, 38, 41, 47, 55, 63, 74, 86],
    owner: "Priya Shah",
    openTickets: 7,
    competitor: "Routewise",
    why: "Acme announced layoffs two weeks ago, Routewise traffic is up 38% this quarter, and Acme has 7 unresolved support tickets. Renewal is in 47 days.",
    evidence: [
      { label: "Layoffs announced", detail: "15% workforce cut and a vendor consolidation review", source: "Brave" },
      { label: "Competitor surging", detail: "Routewise visits +38% over 90 days", source: "Similarweb" },
      { label: "Support backlog", detail: "7 open tickets, 3 older than 14 days", source: "Merge.dev" },
    ],
    play: "Book an exec sponsor call this week and close the 3 oldest tickets before it.",
    criticVerified: true,
  },
  {
    id: "globex-health",
    name: "Globex Health",
    domain: "globexhealth.com",
    industry: "Healthcare",
    arr: 94000,
    renewalDate: "2026-12-02",
    risk: 74,
    trend: [52, 50, 55, 58, 61, 66, 70, 74],
    owner: "Marcus Lee",
    openTickets: 4,
    competitor: "CareStack",
    why: "Globex hired a new CIO who led a CareStack rollout at her last company, and product usage dropped 22% last month.",
    evidence: [
      { label: "New decision-maker", detail: "New CIO previously deployed CareStack", source: "Brave" },
      { label: "Usage drop", detail: "Weekly active users down 22%", source: "Merge.dev" },
      { label: "Competitor momentum", detail: "CareStack visits +19% over 90 days", source: "Similarweb" },
    ],
    play: "Send the new CIO a 1-page ROI summary and offer an onboarding session for her team.",
    criticVerified: true,
  },
  {
    id: "initech",
    name: "Initech",
    domain: "initech.io",
    industry: "Software",
    arr: 68000,
    renewalDate: "2027-01-20",
    risk: 58,
    trend: [40, 42, 44, 43, 49, 52, 55, 58],
    owner: "Priya Shah",
    openTickets: 2,
    competitor: "Routewise",
    why: "Initech's champion changed roles and the account has had no meetings in 41 days.",
    evidence: [
      { label: "Champion moved", detail: "Main contact moved to a different team", source: "Merge.dev" },
      { label: "Gone quiet", detail: "No meetings logged in 41 days", source: "Merge.dev" },
    ],
    play: "Ask the old champion for an intro to their replacement.",
    criticVerified: false,
  },
  {
    id: "umbrella-retail",
    name: "Umbrella Retail",
    domain: "umbrellaretail.com",
    industry: "Retail",
    arr: 152000,
    renewalDate: "2027-03-01",
    risk: 44,
    trend: [48, 47, 45, 46, 44, 45, 43, 44],
    owner: "Dana Cruz",
    openTickets: 3,
    competitor: "ShelfIQ",
    why: "Stable usage, but ShelfIQ is running targeted ads to retail buyers in Umbrella's region.",
    evidence: [
      { label: "Competitor campaign", detail: "ShelfIQ launched a retail-focused campaign", source: "Brave" },
      { label: "Usage steady", detail: "Active users flat over 8 weeks", source: "Merge.dev" },
    ],
    play: "Share the Q3 product roadmap in the next check-in.",
    criticVerified: true,
  },
  {
    id: "stark-energy",
    name: "Stark Energy",
    domain: "starkenergy.com",
    industry: "Energy",
    arr: 210000,
    renewalDate: "2027-05-10",
    risk: 22,
    trend: [30, 28, 27, 25, 24, 23, 22, 22],
    owner: "Marcus Lee",
    openTickets: 0,
    competitor: "GridOps",
    why: "Healthy: usage is growing, no open tickets, and Stark raised a funding round last month.",
    evidence: [
      { label: "Funding raised", detail: "Series C announced", source: "Brave" },
      { label: "Usage growing", detail: "Active users +14%", source: "Merge.dev" },
    ],
    play: "Good moment to propose an upgrade to the Enterprise plan.",
    criticVerified: true,
  },
  {
    id: "wayne-media",
    name: "Wayne Media",
    domain: "waynemedia.co",
    industry: "Media",
    arr: 57000,
    renewalDate: "2026-12-18",
    risk: 67,
    trend: [45, 47, 52, 55, 59, 61, 64, 67],
    owner: "Dana Cruz",
    openTickets: 5,
    competitor: "ShelfIQ",
    why: "Wayne Media opened 5 tickets about slow reports and asked about contract terms twice this month.",
    evidence: [
      { label: "Performance complaints", detail: "5 tickets mention slow reports", source: "Merge.dev" },
      { label: "Contract questions", detail: "Asked about cancellation terms twice", source: "Merge.dev" },
    ],
    play: "Have an engineer join the next call to walk through the report speed fix.",
    criticVerified: true,
  },
  {
    id: "hooli",
    name: "Hooli",
    domain: "hooli.xyz",
    industry: "Software",
    arr: 88000,
    renewalDate: "2027-02-14",
    risk: 31,
    trend: [36, 35, 33, 34, 32, 31, 31, 31],
    owner: "Priya Shah",
    openTickets: 1,
    competitor: "GridOps",
    why: "Low risk: steady usage and a renewal conversation already scheduled.",
    evidence: [{ label: "Renewal scheduled", detail: "Renewal call booked for Jan 10", source: "Merge.dev" }],
    play: "Prepare a usage recap for the renewal call.",
    criticVerified: true,
  },
];

export interface Competitor {
  name: string;
  domain: string;
  visitsChange: number; // % change over 90 days
  accountsExposed: number;
  headline: string;
}

export const competitors: Competitor[] = [
  { name: "Routewise", domain: "routewise.com", visitsChange: 38, accountsExposed: 2, headline: "Launched a free migration offer for logistics teams" },
  { name: "CareStack", domain: "carestack.com", visitsChange: 19, accountsExposed: 1, headline: "Hired a new VP of Sales from a direct rival" },
  { name: "ShelfIQ", domain: "shelfiq.com", visitsChange: 12, accountsExposed: 2, headline: "Running paid ads to retail and media buyers" },
  { name: "GridOps", domain: "gridops.io", visitsChange: -6, accountsExposed: 2, headline: "Traffic declining after a pricing change" },
];

export interface Signal {
  id: string;
  accountId: string;
  title: string;
  source: SignalSource;
  when: string; // relative time shown in the UI
  severity: RiskLevel;
}

export const signals: Signal[] = [
  { id: "s1", accountId: "acme-logistics", title: "Acme Logistics announces 15% layoffs", source: "Brave", when: "2h ago", severity: "high" },
  { id: "s2", accountId: "acme-logistics", title: "Routewise traffic up 38% in 90 days", source: "Similarweb", when: "5h ago", severity: "high" },
  { id: "s3", accountId: "globex-health", title: "Globex hires CIO with CareStack background", source: "Brave", when: "Yesterday", severity: "high" },
  { id: "s4", accountId: "wayne-media", title: "Wayne Media asks about cancellation terms", source: "Merge.dev", when: "Yesterday", severity: "medium" },
  { id: "s5", accountId: "initech", title: "Initech champion changed roles", source: "Merge.dev", when: "2 days ago", severity: "medium" },
  { id: "s6", accountId: "umbrella-retail", title: "ShelfIQ launches retail ad campaign", source: "Brave", when: "3 days ago", severity: "low" },
  { id: "s7", accountId: "stark-energy", title: "Stark Energy raises Series C", source: "Brave", when: "4 days ago", severity: "low" },
];

export interface RescueAction {
  id: string;
  accountId: string;
  type: "Email" | "Call" | "Offer";
  title: string;
  draft: string;
  status: "Draft" | "Sent" | "Done";
}

export const rescueActions: RescueAction[] = [
  {
    id: "a1",
    accountId: "acme-logistics",
    type: "Email",
    title: "Exec sponsor check-in",
    draft:
      "Hi Jordan,\n\nI know the last few weeks have been busy at Acme. I'd like to set up 20 minutes with you and our VP of Customer Success to make sure we're supporting your team through the changes, and to walk through the fixes for your open tickets.\n\nDoes Thursday or Friday work?\n\nBest,\nPriya",
    status: "Draft",
  },
  {
    id: "a2",
    accountId: "globex-health",
    type: "Email",
    title: "Welcome note to the new CIO",
    draft:
      "Hi Dr. Patel,\n\nCongratulations on the new role. Globex's team saved about 1,200 hours last year using our platform; I've attached a one-page summary. I'd be glad to run a 30-minute session for your team whenever it suits.\n\nBest,\nMarcus",
    status: "Draft",
  },
  {
    id: "a3",
    accountId: "wayne-media",
    type: "Call",
    title: "Report speed walkthrough",
    draft: "Talking points:\n- Acknowledge the 5 tickets about slow reports\n- Show the caching fix shipped last week\n- Offer a 2-week check-in to confirm it's resolved",
    status: "Sent",
  },
];

export interface Briefing {
  id: string;
  date: string;
  headline: string;
  bullets: string[];
}

export const briefings: Briefing[] = [
  {
    id: "b1",
    date: "Tue, Sep 29",
    headline: "3 accounts changed overnight. Start with Acme Logistics.",
    bullets: [
      "Acme Logistics jumped to 86 after layoff news. $120K renews in 47 days.",
      "Globex Health's new CIO has a CareStack background.",
      "Stark Energy raised a Series C: a good moment to propose an upgrade.",
    ],
  },
  {
    id: "b2",
    date: "Mon, Sep 28",
    headline: "Quiet day. One new competitor signal.",
    bullets: ["ShelfIQ started a retail ad campaign that reaches Umbrella Retail's buyers."],
  },
];

export interface Integration {
  name: string;
  purpose: string;
  status: "Connected" | "Demo mode" | "Not connected";
}

export const integrations: Integration[] = [
  { name: "Crusoe", purpose: "Runs the AI that scores risk and writes explanations", status: "Demo mode" },
  { name: "Merge.dev", purpose: "Reads accounts and tickets from your CRM and help desk", status: "Demo mode" },
  { name: "Brave Search", purpose: "Finds recent news about your customers", status: "Demo mode" },
  { name: "Similarweb", purpose: "Tracks competitor website traffic", status: "Demo mode" },
  { name: "OpenRouter + Nebius", purpose: "Second AI model that double-checks each verdict", status: "Demo mode" },
  { name: "Neo4j", purpose: "Stores the map of accounts, signals and competitors", status: "Demo mode" },
  { name: "Vultr / DuploCloud", purpose: "Hosts the live app", status: "Not connected" },
  { name: "UserTesting", purpose: "Collects real user feedback on the dashboard", status: "Not connected" },
];

/** The signed-in user. Edited on the Profile page. */
export const currentUser = {
  name: "Alex Rivera",
  email: "alex@yourcompany.com",
  role: "Head of Customer Success",
  company: "Your Company",
  timezone: "America/Los_Angeles",
  initials: "AR",
};

export const formatMoney = (n: number) =>
  n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n.toLocaleString()}`;

// Fixed reference date so pages pre-rendered at build time match the browser (no hydration
// mismatch). Replace with a server-provided "today" once data is fully live.
export const daysUntil = (iso: string, from = new Date("2026-09-29")) =>
  Math.round((new Date(iso).getTime() - from.getTime()) / 86_400_000);
