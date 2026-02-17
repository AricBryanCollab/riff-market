# Agent Documentation Pattern
<!-- concept:def docs_process -->

- Keep handoff docs compact, discoverable, and low-friction.
- Context is scarce: load and inject only what the current task needs.
- Prefer enforceable guidance over ad-hoc guidance (rules/checks/tests over memory).
- Structure docs as:
  - index (`docs/README.md`)
  - process (`docs/agent-documentation-pattern.md`)
  - ADRs (`docs/adr/*`)
  - runbooks (`docs/runbooks/*`)
  - gotchas (`docs/gotchas/*`)
- Writing rules:
  - one concept per file
  - include file paths and command behavior where relevant
  - include `<!-- concept:def <id> -->` in canonical files
  - exception: runtime feature capsules in `docs/features/*.md` do not require `concept:def` markers (framework files like `docs/features/index.md` and `docs/features/TEMPLATE.md` still do)
  - temporary/session handoff notes must live in `tmp/agent-notes/` and never in `docs/` (for example, avoid `*-next-session.md` under `docs/`)
- Update flow:
  - add/update `docs/concepts.map`
  - add/refine canonical file
  - run `bun run docs:check`
