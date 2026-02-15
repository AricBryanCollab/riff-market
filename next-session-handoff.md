---
title: Next Session Handoff
owner: agent-workflow
---

# Handoff: CVA Adoption Sprint

## Session Outcome
- Docs framework work is complete and passing (`bun run docs:check`).
- CVA adoption started in core components with 3 atomic commits.
- Canonical pattern doc added: `docs/cva-classname-pattern.md`.
- Current branch includes:
  - `5b33ada` docs compact + CVA rule
  - `9dcccc7` component CVA refactors
  - `c1a4451` biome formatting cleanup

## Current state in repo
- Active CVA-style refactors already done:
  - `src/components/avatar.tsx` (size and clickable variant behavior)
  - `src/components/imageuploader.tsx` (dragActive drop zone state)
  - `src/components/orderlist.tsx` (status badge variants)
  - `src/components/productfilterbadges.tsx` (badge active/inactive variants)
  - `src/components/shopsidebar.tsx` (expanded width variant)
  - `src/components/toast.tsx` (status-based toast variants)
  - `src/components/iconbutton.tsx`
  - `src/components/notificationlist.tsx`
  - `src/components/order/ordersummary.tsx`
  - `src/components/reviewsection.tsx`
  - `src/components/sidebar/sidebarheader.tsx`
- `src/components/ui/checkbox.tsx` is formatting-only.
- `docs/cva-classname-pattern.md` is now the canonical guide for this rule.

## Next goal
Refactor className usage to CVA where it is actually needed.

### Necessary = use CVA
- Variant/state logic (ex: `isOpen`, `isRead`, `isMobile`, `tone`, `size`).
- Repeated conditional class branches.
- Multiple render paths with class-based behavior.

### Keep as direct className
- Static utility strings.
- One-off one-line layout/style decisions.
- Cases where class behavior is not a finite variant set.

## Execution plan
1. Find candidates with conditional class logic (`?`, template branches, branching helpers).
2. If the logic is variant-like, extract `cva` + `VariantProps` and compose via `cn`.
3. If not variant-like, keep as-is and add short rationale in code review notes.
4. Run `bun run check` on touched files.

## PR output requirements
- List files changed and why each one was converted.
- Confirm no behavior regressions for affected UI states.
- Reference `docs/cva-classname-pattern.md` for each exception.
- Keep `next-session-handoff.md` updated with final scope before handing off.

## Constraint
Do not force CVA everywhere. Use CVA only when it improves consistency and maintainability.
