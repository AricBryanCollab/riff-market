# Class vs Function Shape

Use the simplest shape that explains the code.

## Conclusion

- Use plain functions for application workflows.
- Use types or interfaces for dependency shapes.
- Use classes only when state or identity helps.

## Plain Terms

- Entity: domain object with rules or identity.
- Use case: app workflow, usually a function.
- Port: dependency shape the workflow needs.
- Adapter: real implementation of that dependency shape.

## Ports And Adapters

- A port should be a type or interface.
- A stateless adapter should usually be a plain object or function.
- An adapter should be a class only when it owns shared setup or state, such as
  a Prisma client, Cloudinary client, config, queue client, cache, or worker
  state.

## Rule For This Repo

This is the preferred shape for new simple use cases and for touched code that is
already being refactored. Older application modules may still use one-method
classes; do not churn unrelated slices only to change shape.

Prefer this for simple use cases:

```ts
deleteAccount(command, accounts);
```

Instead of this:

```ts
new DeleteAccount(accounts).execute(command);
```

Keep classes for:

- domain entities or value objects with real behavior
- infrastructure adapters with shared setup or client state
- long-lived workers, clients, schedulers, or services with real state

Avoid classes for use cases that only store dependencies and expose one
`execute()` method. Also avoid classes for adapters that only forward one or two
calls without holding shared setup or state.
