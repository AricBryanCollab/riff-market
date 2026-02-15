# Agent Documentation Pattern (AGENTS-first standard)
<!-- concept:def docs_process -->

## Purpose
- Keep agent handoff stable, compact, and discoverable.
- Separate discovery (index), policy (pattern), and details (ADRs/runbooks/gotchas).

## What to include
- setup (behavior + paths)
- adr (decisions + tradeoffs)
- runbook (commands + pass criteria)
- gotchas (known caveats + recovery)

## Where to put docs
- `docs/README.md`: compact load index and process entry.
- `docs/adr/`: one file per important design decision.
- `docs/runbooks/`: verification and smoke instructions.
- `docs/gotchas/`: caveats and mitigation.

## Writing rules
- One concept per file.
- 5-10 bullets, concise language.
- Always include file paths and expected command behavior when relevant.
- Add concept marker: `<!-- concept:def <id> -->`

## Update flow
1. Update concept index in `docs/concepts.map` when adding a new concept.
2. Add/refresh canonical doc for the concept.
3. Run `bun run docs:check`.

## Why this pattern
- Faster context loading in future runs.
- Less drift and fewer conflicting definitions.
- Easy to validate via script checks.
