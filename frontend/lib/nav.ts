/**
 * Single source of truth for navigation.
 * The sidebar (product features), the top-bar icons and the search bar
 * all read from here, so adding a page means adding one entry below
 * AND registering it in agent/page-registry.json.
 */
import {
  LayoutDashboard,
  Building2,
  Radio,
  Swords,
  Share2,
  MessageSquareText,
  Send,
  Newspaper,
  Plug,
  Globe,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  description: string; // used by search results and tooltips
  icon: LucideIcon;
  ai?: boolean; // marks AI-powered features with a small sparkle badge
}

/** Product features: shown in the left sidebar under the burger menu. */
export const featureNav: NavItem[] = [
  { href: "/dashboard", label: "Overview", description: "Revenue at risk and today's priorities", icon: LayoutDashboard },
  { href: "/dashboard/accounts", label: "Accounts", description: "Every customer with a risk score", icon: Building2 },
  { href: "/dashboard/signals", label: "Signals", description: "News, tickets and usage changes", icon: Radio },
  { href: "/dashboard/competitors", label: "Competitors", description: "Who is gaining on you", icon: Swords },
  { href: "/dashboard/live", label: "Live check", description: "Check any public company using real SEC filings", icon: Globe },
  { href: "/dashboard/graph", label: "Relationship map", description: "How accounts, signals and rivals connect", icon: Share2 },
  { href: "/dashboard/ask", label: "Ask AI", description: "Ask questions about your customers in plain English", icon: MessageSquareText, ai: true },
  { href: "/dashboard/actions", label: "Rescue actions", description: "AI-drafted emails, calls and offers", icon: Send, ai: true },
  { href: "/dashboard/briefings", label: "Daily briefing", description: "What changed overnight", icon: Newspaper, ai: true },
  { href: "/dashboard/integrations", label: "Integrations", description: "Connected data sources", icon: Plug },
];

/** Account-level pages: shown as icons at the top right of the header. */
export const settingsNav: NavItem = {
  href: "/dashboard/settings",
  label: "Settings",
  description: "Alerts, risk threshold and preferences",
  icon: Settings,
};

export const profileNav: NavItem = {
  href: "/dashboard/profile",
  label: "Profile",
  description: "Your name, email, role and time zone",
  icon: UserRound,
};

export const allNav: NavItem[] = [...featureNav, settingsNav, profileNav];
