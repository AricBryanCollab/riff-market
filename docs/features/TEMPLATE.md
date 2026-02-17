# Feature Capsule Template
<!-- concept:def feature_capsules_template -->

Copy this template into a feature capsule file under `docs/features/` and update the registry entry in `docs/features/features.map`.

Compactness rules (default):
- Keep total length under 120 lines.
- Keep each section to 3-6 bullets.
- Prefer terse statements over narrative paragraphs.
- Link file paths instead of re-explaining implementation details.

```md
# <Feature Name>
<!-- feature:def <feature_id> -->

---
feature_id: <feature_id>
owner_scope: <domain_or_team>
tags:
  - <tag_a>
  - <tag_b>
status: active
last_reviewed: 2026-02-17
---

## Purpose
- 1-2 bullets describing why this feature exists.

## Behavior Contract
- User-visible behavior guarantees.
- Critical invariants and business rules.

## Key Paths
- `src/...`
- `src/...`

## Data Flow / Dependencies
- Inputs:
- Outputs:
- Services/storage:

## Change Log
- 2026-02-17: Initial capsule.

## Test Impact / Verification Notes
- Relevant tests and manual verification summary.

## Known Risks / Gotchas
- Sharp edges and follow-up risks.
```
