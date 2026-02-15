# Agent Documentation Pattern
<!-- concept:def docs_process -->

- Keep handoff docs compact, discoverable, and low-friction.
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
- Update flow:
  - add/update `docs/concepts.map`
  - add/refine canonical file
  - run `bun run docs:check`
