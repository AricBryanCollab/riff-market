# Docs Gotchas
<!-- concept:def docs_gotchas -->

- Concept marker must be exactly one and in canonical file.
- `docs/concepts.map` parser assumes `id|path|note` format.
- New concept docs are ignored by `docs:check` until map entry exists.
- Feature capsules in `docs/features/*.md` are intentionally exempt from `concepts.map`, except framework files (`index.md`, `TEMPLATE.md`).
- If you add docs in nested folders, verify workflow path glob does not exclude them.
- Keep `AGENTS.md` short; deep details belong in `docs/`.
