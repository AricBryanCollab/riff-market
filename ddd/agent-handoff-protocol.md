# DDD Migration Agent Handoff Protocol

Use this folder as the handoff source of truth for the DDD migration.

## Required Read Order

At the start of every new implementation/planning session, read:

1. `ddd/agent-handoff-protocol.md`
2. `ddd/next-session.md`
3. `ddd/migration-plan.md`
4. `ddd/grill-me-summary.md`
5. `ddd/progress.md`

Then inspect the actual repo state with git and code reads. Do not rely on a manually maintained current-state file.

## Session Rules

- Treat `ddd/migration-plan.md` as the current approved plan.
- Treat `ddd/grill-me-summary.md` as the canonical approved decision summary.
- Treat `ddd/progress.md` as the fresh implementation progress log and todo list.
- Do not reopen approved architecture decisions unless implementation reveals a concrete contradiction or the user asks to revisit them.
- If a decision changes, update all affected files in `ddd/`.
- Keep changes slice-based. Do not mix unrelated slices.
- Prefer small, verifiable implementation steps.
- Preserve the distinction between:
  - domain behavior
  - application use cases
  - infrastructure adapters
  - DTOs/server function delivery

## End-Of-Session Requirements

Before ending a session, update:

1. `ddd/next-session.md`
2. `ddd/progress.md`

Each update must include:

- work completed
- files changed
- tests/checks run and results
- decisions made
- blockers or risks
- exact next recommended task

Actual implementation state must be inferred from git status, git diff, tests, and the codebase, not duplicated in a hand-maintained state file.

For an agent-to-agent handoff, invoke the local `handoff` skill at
`/Users/aricjiang/.agents/skills/handoff/SKILL.md` after updating the files
above. Pass the next-session focus as the skill argument, for example
`$handoff "Continue the DDD migration from ddd/next-session.md"`.

The generated handoff document must stay in the user's OS temporary directory,
not this workspace. It should point to `ddd/next-session.md`, `ddd/progress.md`,
and any relevant plans instead of duplicating their content, and it must include
the skill's required suggested-skills section.

## Implementation Guardrails

- Domain code must not import React, TanStack, Prisma, Zod, Request, Response, FormData, or Cloudinary.
- Server functions are delivery adapters only.
- Use cases receive an explicit `Actor`.
- Repositories persist and map data; they do not orchestrate workflows.
- `PlacePurchase` must use a concrete unit-of-work/transaction boundary.
- Listing stock reservation must be guarded atomically in the database.
- Money uses integer cents in the target model.
- Existing fake order schema/tests are not compatibility requirements.

## Current Approved Model

- `Listing` replaces `Product` in domain and eventually persistence vocabulary.
- `Purchase` is the buyer-facing checkout aggregate.
- `SellerOrder` is an independent seller-facing aggregate.
- `Purchase` and `SellerOrder` can be created in one application transaction but are not one aggregate.
- Buyer order history is a read model joining `Purchase` and `SellerOrder`.
- Seller dashboard queries `SellerOrder` directly.
- Cart remains client-side draft state for this migration.
