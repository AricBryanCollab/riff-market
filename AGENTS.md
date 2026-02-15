Load order:
1) AGENTS.md
2) docs/README.md
3) docs/agent-context-packs.md

local-docs: `docs/README.md` | `docs/agent-context-packs.md`

Instruction rules:
- Do not rely on `CLAUDE.md` for agent guidance.
- For docs work, start with `docs/README.md`, then task pack, then optional docs.
- Keep command behavior and conventions in docs files as the source of truth.
- For docs changes, run `bun run docs:check`.
- Install local hooks with `bun run hooks:install` and commit doc-related changes with pre-commit docs checks enforced by `.githooks/pre-commit`.
