# UseAgent Engineering Backlog

## AGENT-ROUTING-01: Prefer native Runtime subagents for internal decomposition

- **Priority:** P1
- **Status:** Implemented; validation partially blocked
- **Problem:** The turn prompt currently mandates `child_session_create_many` whenever a request contains at least two substantial independent workstreams. Product child sessions create separately persisted UseAgent Threads/Runs and can allocate additional Cube sandboxes, so routine internal decomposition can multiply sandbox consumption for a single user request.
- **Decision:** Native Runtime subagents/task mechanisms are the default for internal decomposition and ordinary parallel work when the active Runtime supports them. UseAgent product child sessions are reserved for explicit user-visible, independently messageable sessions or genuine separate execution boundaries such as a different engine, workspace, or security authority.
- **Fallback:** If native subagents are unsupported, the agent should coordinate or execute within the current Runtime rather than silently creating more product child sessions/sandboxes. Cross-runtime bot handoff and tasks requiring independent workspace/security isolation remain product-level delegation cases.
- **Scope:** Update prompt routing guidance and regression tests. Keep product child-session APIs available for explicit use cases. Do not change sandbox lifecycle, capacity limits, Cube configuration, or deployment as part of this item.
- **Acceptance criteria:**
  1. A request with multiple independent workstreams no longer automatically requires product child sessions.
  2. Prompt guidance prefers native Runtime subagents for internal work and makes the product-session boundary explicit.
  3. Explicit requests for independently visible child sessions still route through the product child-session tools.
  4. Tests cover the default policy and the product-child-disabled configuration.
  5. Existing unrelated worktree changes are preserved; no deployment/restart occurs without a separate request.

- **Validation:** Direct prompt-routing smoke check passed, and `cd backend && bunx -p typescript@5.9.3 tsc --noEmit` passed. The focused Bun test could not start because the configured test PostgreSQL endpoint refused the connection (`ECONNREFUSED`). Root `bun run typecheck` is blocked by generated frontend errors in `.next/dev/types/validator.ts` (TS1128 at lines 182 and 495), outside this change.
