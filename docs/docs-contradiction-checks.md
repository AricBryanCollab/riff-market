# Docs Contradiction Checks
<!-- concept:def docs_contradiction_checks -->

Goal:
- Keep one canonical concept definition per doc concept.
- Prevent drift between `docs/concepts.map` and actual docs.

Mechanism:
- `docs/concepts.map` lists canonical concept ownership.
- Canonical docs include exactly one marker: `<!-- concept:def <id> -->`.
- `bun run docs:check` validates:
  - map entries exist and are tracked markdown files.
  - marker exists for each map concept.
  - each marker appears in the mapped canonical file.
  - no unknown marker appears outside map.

Run:
- `bun run docs:check`

Expected:
- Success logs ` [docs] contradiction check passed`.
- Any mismatch exits non-zero with list of fixes.
