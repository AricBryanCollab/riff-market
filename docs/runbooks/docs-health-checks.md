# Docs Health Checks
<!-- concept:def docs_health_checks -->

## Required checks
1. Run `bun run docs:check`.
2. Confirm every edited doc concept has a canonical file in `docs/concepts.map`.
3. Confirm new docs use `<!-- concept:def <id> -->`.
4. Confirm each pack references only existing doc paths.

## Pass criteria
- `bun run docs:check` returns exit code `0`.
- No unresolved concepts or duplicates in output.
- CI passes docs check.
