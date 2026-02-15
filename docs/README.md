# docs index (compact)

load-order: `AGENTS.md` -> `docs/README.md` -> `docs/agent-context-packs.md`

packs: `docs/agent-context-packs.md`

process: `docs/agent-documentation-pattern.md`

integrity: `docs/docs-contradiction-checks.md` | `docs/concepts.map` | `bun run docs:check`

runbook: `docs/runbooks/docs-health-checks.md`

governance:
- Keep this index small and update it when new doc categories appear.
- One-concept-per-file by default.
- Use `concepts.map` to avoid duplicate/ambiguous definitions.
