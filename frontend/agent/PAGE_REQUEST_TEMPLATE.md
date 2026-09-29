# Page request template

Copy this, fill it in, and give it to the front-end agent
(in Claude Code: "Use the frontend-agent to build this: <paste>").

```
Page name:        e.g. Renewals calendar
Route:            /dashboard/renewals
Who uses it:      e.g. account managers on Monday morning
Job of the page:  one sentence - what the user can do here that they can't elsewhere
Show in sidebar:  yes / no      AI feature: yes / no

Content (top to bottom):
1.
2.
3.

Actions the user can take:
-

Data needed (from lib/data.ts or new):
-

Empty state message:
Motion moment (one): e.g. calendar days fill in as renewals load

Must not change: list any confirmed pages this touches
```

The agent will reply with: Added / Changed / Not done yet / Suggested next step / Checks.
