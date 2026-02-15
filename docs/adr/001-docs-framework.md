# ADR-001: AGENTS-first documentation framework

## Decision
Use `AGENTS.md` as the root instruction map and enforce docs consistency with a registry + marker validator.

## Why
- Faster task kickoff with minimal context.
- Prevents repeated manual context drift.
- Fails fast on docs ambiguity before merge.

## Alternatives
- Keep ad-hoc notes and no checks.
- Use one giant docs file.

## Tradeoffs
- Requires lightweight maintenance of `concepts.map`.
- More upfront edits when adding new doc topics.

## Outcome
- Agent startup is deterministic.
- Documentation quality is mechanically verifiable.
