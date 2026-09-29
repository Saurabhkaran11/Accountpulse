# Business plan

*Not legal or financial advice. Validate pricing and vendor costs before committing.*

## Positioning

**One line:** AccountPulse tells customer-success teams which accounts are about to leave, why,
and what to send them, using signals from outside the CRM that other tools miss.

**Why now:** customer-success platforms such as [Gainsight](https://www.gainsight.com),
[ChurnZero](https://churnzero.com), [Vitally](https://www.vitally.io) and
[Planhat](https://www.planhat.com) are built mainly around a customer's internal data (usage,
tickets, surveys). AccountPulse adds the outside world: layoffs, acquisitions, executive changes,
competitor momentum and official filings, and turns them into a plain-English next step.

## Target industries

Launch in SaaS; the same engine fits six more fields with different data sources and wording.

| Industry | Buyer | "Losing a customer" looks like | Key signals | Existing players | Compliance |
|---|---|---|---|---|---|
| **B2B SaaS (launch)** | Head of Customer Success | Non-renewal | Usage drop, tickets, layoffs, rival traffic | Gainsight, ChurnZero | Low |
| Commercial real estate | Asset / leasing managers | Tenant downsizes or leaves | Tenant layoffs, sublease listings, badge-ins | [VTS](https://www.vts.com) | Medium |
| Wealth management | Advisory team leads | Client moves assets | Withdrawals, logins, business sale, retirement | [Salesforce FSC](https://www.salesforce.com/financial-services/) | High |
| Insurance brokerage | Account managers | Policy not renewed | Premium jumps, claim disputes, acquisitions | [Applied Systems](https://www1.appliedsystems.com) | Medium |
| Logistics / 3PL | Account managers | Shipper moves volume | Volume drop, late deliveries, new warehouses | Transport management systems | Low |
| Marketing agencies | Agency owners | Retainer ends | New CMO, in-house hiring, slow replies | [AgencyAnalytics](https://agencyanalytics.com) | Low |
| Medical devices | Hospital account teams | Hospital switches supplier | Order drops, mergers, new procurement head | [Veeva](https://www.veeva.com) | High |

**Order:** SaaS first → commercial real estate or logistics next (high-value accounts, heavy
reliance on outside signals) → wealth and healthcare after security certifications.

## Pricing (starting hypothesis; test with design partners)

| Plan | For | Price idea | Includes |
|---|---|---|---|
| Free scan | Trying it out | $0 | One scan of up to 10 accounts; Live check |
| Team | CS teams | ~$79 per seat per month | Unlimited accounts, daily scans, AI drafts, briefing |
| Enterprise | Larger companies | Custom / share of revenue saved | SSO, Salesforce write-back, security review, SLA |

Before publishing prices, add up the per-customer cost of Merge.dev, Similarweb, Brave and AI
usage.

## Go-to-market

1. **Validate (weeks 1-4):** interview 15-20 heads of customer success. Ask: "How did you find
   out about the last customer you lost?" If most say "too late," the pain is real.
2. **Design partners:** 3-5 companies use it free on real data in exchange for feedback and a
   case study.
3. **Launch channels:** landing page with waitlist, [Product Hunt](https://www.producthunt.com),
   LinkedIn posts for CS leaders, communities like
   [Gain Grow Retain](https://www.gaingrowretain.com), and the hackathon result as early
   credibility.
4. **Content:** "We predicted which public companies would cut vendors" posts using the free
   Live check data.

## Related business ideas from the same engine

| Idea | Customer | Link to explore |
|---|---|---|
| Vendor risk radar (which of *my* suppliers is failing?) | Procurement, security teams | [SEC EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces) |
| Sales trigger alerts (layoffs/funding = time to pitch) | Sales teams | [Crunchbase API](https://data.crunchbase.com/docs) |
| Competitor weekly brief for small businesses | E-commerce / local owners | [Similarweb](https://www.similarweb.com) |

## Learning resources

**Free first:**

- [Y Combinator Startup School](https://www.startupschool.org): pricing, first customers.
- [SEC EDGAR API documentation](https://www.sec.gov/search-filings/edgar-application-programming-interfaces)
- [Neo4j GraphAcademy](https://graphacademy.neo4j.com)
- [Next.js Learn](https://nextjs.org/learn)

**Paid:**

- [Frontend Masters](https://frontendmasters.com): deeper Next.js and TypeScript.
- [Reforge](https://www.reforge.com): retention and growth programs.

**YouTube:**

- [Customer churn and retention strategy](https://www.youtube.com/results?search_query=b2b+saas+customer+churn+retention+strategy)
- [Finding design partners](https://www.youtube.com/results?search_query=b2b+saas+design+partners+first+customers)
- [Vertical SaaS strategy](https://www.youtube.com/results?search_query=vertical+saas+strategy)
- [Next.js SaaS with Stripe and auth](https://www.youtube.com/results?search_query=nextjs+saas+stripe+auth+tutorial)
- **Channel idea to earn from:** a build-in-public series ("I built an AI that predicts which
  customers will quit"), monetised through the YouTube Partner Program, affiliate links to the
  tools above, and consulting leads.
