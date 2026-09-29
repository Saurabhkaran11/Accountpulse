# AccountPulse - rules for AI coding agents

- Front-end work: follow `frontend/.claude/agents/frontend-agent.md` (design system, layout,
  motion, page-lock rules). Run Claude Code from `frontend/` so the agent is picked up.
- Pages marked `"confirmed"` in `frontend/agent/page-registry.json` must never be deleted,
  moved or renamed.
- Before reporting front-end work as done: `cd frontend && npm run check`.
- Backend keeps a mock fallback for every external call; never remove one.
- Keep docs in `docs/` current when behaviour changes; diagrams live in `docs/diagrams/*.mmd`.
