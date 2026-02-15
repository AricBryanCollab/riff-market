# Agent Context Packs (Task-First Load)
<!-- concept:def two_stage_load -->

## Why this exists
- Load tiny, relevant context first.
- Then fetch deeper docs only if needed.

## Starter packs

- `docs-process`: `docs/agent-documentation-pattern.md`, `docs/README.md`
- `theming`: `docs/theming.md`
- `conventions`: `docs/commits.md`
- `architecture`: `docs/agent-documentation-pattern.md`, `docs/adr/001-docs-framework.md`
- `runbooks`: `docs/runbooks/docs-health-checks.md`, `docs/docs-contradiction-checks.md`

## Load rules
- Start with this file, then the selected pack.
- Keep per-task retrieval tight: only open additional files when evidence is missing.
