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

Use classes only when state or identity helps: domain objects with behavior,
stateful infrastructure adapters, long-lived clients, workers, schedulers, or
services.

Avoid one-method use-case classes that only store dependencies and expose
`execute()`. Apply this to new or touched code; do not churn unrelated older
slices only to change shape.
