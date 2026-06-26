---
scope:
  - src/domains/**
  - src/server/**
tags:
  - architecture
  - ddd
---

# Class Vs Functions

Prefer plain functions for simple application workflows and use types or
interfaces for dependency shapes.

For application use cases, prefer direct function signatures shaped like
`useCase(actor, commandOrQuery, dependency)` for one dependency, or
`useCase(actor, commandOrQuery, dependencies)` when multiple ports are needed.
Bundle multiple ports into a named dependency object instead of growing a
positional parameter list.

Use classes only when state or identity helps: domain objects with behavior,
stateful infrastructure adapters, long-lived clients, workers, schedulers, or
services.

Avoid one-method use-case classes that only store dependencies and expose
`execute()`. Apply this to new or touched code; do not churn unrelated older
slices only to change shape.
