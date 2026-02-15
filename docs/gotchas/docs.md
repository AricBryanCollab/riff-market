# Docs Gotchas

- Concept marker must be exactly one and in canonical file.
- `docs/concepts.map` parser assumes `id|path|note` format.
- New concept docs are ignored by `docs:check` until map entry exists.
- If you add docs in nested folders, verify workflow path glob does not exclude them.
- Keep `AGENTS.md` short; deep details belong in `docs/`.
