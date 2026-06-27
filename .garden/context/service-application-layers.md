---
scope:
  - src/server/**
  - src/domains/**
tags:
  - architecture
  - ddd
---

# Service And Application Layers

In this repo, `src/server/*-service.ts` is the server/request adapter layer. It owns incoming request concerns: Zod/FormData validation, `ServerUserContext` to `Actor` mapping, command/response DTO shaping, wiring real infrastructure, and translating application `Result` errors into request errors and statuses.

Server functions should execute service-owned validators at the untrusted input boundary. After that, server services should accept typed, validated input and should not repeat the same transport/schema validation; application use cases still enforce business validation and invariants.

`src/domains/*/application/*` is the use-case layer. It owns application workflows: authorization in domain language, command validation that is not transport-specific, port definitions, transaction orchestration, domain object coordination, domain event handling, and application error codes.

`src/domains/*/domain/*` owns pure business invariants, value objects, entity lifecycle behavior, and domain events. Keep framework, Prisma, request, and session concerns out of domain code.

`src/domains/*/infrastructure/*` implements application ports with Prisma, assets, external systems, and other IO details.

When adding behavior, put transport shape and HTTP-ish error mapping in the server service, use-case decisions in the application layer, pure invariants in the domain layer, and persistence details in infrastructure. If a server service only forwards arguments without validation, mapping, response shaping, or boundary translation, consider whether that function can stay thinner or be removed.
