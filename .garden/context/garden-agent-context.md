---
scope:
  - AGENTS.md
  - .garden/context/**
tags:
  - agents
  - context
---

# Garden Agent Context

Use Garden context cards for durable agent and developer guidance that should be tied to file scopes.

`AGENTS.md` should stay small: repo-wide rules plus Garden's generated context index. Do not hand-edit the generated section between `<!-- garden:agents:start -->` and `<!-- garden:agents:end -->`.

To change the Garden index:

1. Add, edit, or remove `.garden/context/*.md` cards.
2. Run `garden agents sync --apply`.
3. Run `garden lint`.

Cards should be direct and operational: say what to preserve, what to avoid, which layer owns a decision, and which verification matters for the scoped files.
