# Docs Health Checks
<!-- concept:def docs_health_checks -->

- Required for docs changes:
  - `bun run hooks:install` (once per machine) so pre-commit checks run.
  - `bun run docs:check` for every docs edit.
  - edited concepts must exist in `docs/concepts.map`.
  - canonical docs must include `<!-- concept:def <id> -->`.
  - temporary/session handoff notes belong in `tmp/agent-notes/`, not `docs/` (avoid `*-next-session.md` under `docs/`).
  - pack paths must point to real files.
- PR validation: run `bun run docs:check:strict` (`bun run docs:check` currently).
- Pass: `bun run docs:check` returns `0`, no duplicates, CI docs check passes.
