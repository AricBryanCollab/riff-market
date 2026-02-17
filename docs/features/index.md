# Feature Capsules
<!-- concept:def feature_capsules_index -->

Use feature capsules to capture behavior contracts and change context for important product areas.

## Phase 1 policy
- Capsule updates are optional and non-blocking.
- Developers are not required to use an LLM.
- Prefer short, high-signal updates over complete prose.

## Retrieval model
- Stage 1: read `docs/features/features.map` only.
- Stage 2: load only matching capsule docs by tags and touched paths.
- Stage 3: if no capsule exists, continue with code inspection and optionally add a capsule update.

## Files
- Registry: `docs/features/features.map`
- Authoring template: `docs/features/TEMPLATE.md`

## Quality baseline
- One living capsule per feature area.
- Keep a dated change log section in each capsule.
- Update `last_reviewed` when changing capsule behavior notes.
- Keep capsules compact: terse bullets, minimal prose, and only task-relevant paths.
