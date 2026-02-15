# Docs Health Checks
<!-- concept:def docs_health_checks -->

## Required checks
1. Run `bun run hooks:install` once per machine (if not already installed) so docs checks run pre-commit.
2. For every docs change, run `bun run docs:check`.
3. Confirm every edited doc concept has a canonical file in `docs/concepts.map`.
4. Confirm new docs use `<!-- concept:def <id> -->`.
5. Confirm each pack references only existing doc paths.
6. In PR validation, run `bun run docs:check:strict` (alias for the same integrity check).

## Pass criteria
- `bun run docs:check` returns exit code `0`.
- No unresolved concepts or duplicates in output.
- CI passes docs check.
