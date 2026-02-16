# TanStack Start Auth Redirection
<!-- concept:def tanstack_auth_redirection -->

## Goal

Standardize auth and RBAC redirects with TanStack Router `beforeLoad`.

## Default pattern

Protect routes before render:

```tsx
export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUserFn()

    if (!user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }

    return { user }
  },
})
```

Role checks live in child routes:

```tsx
export const Route = createFileRoute('/_authed/admin')({
  beforeLoad: async ({ context }) => {
    if (!hasPermission(context.user.role, roles.ADMIN)) {
      throw redirect({ to: '/unauthorized' })
    }
  },
})
```

## Current repo approach

- Query-backed route guards in `src/utils/require-role.ts`.
- Use `requireAuthUser(context.queryClient, redirectTo?)` and `requireRole(context.queryClient, allowedRoles)`.
- Consumer auth hook remains `useAuthUser()`.

## Guarded routes

- `src/routes/settings.tsx`
- `src/routes/notifications.tsx`
- `src/routes/cart.tsx`
- `src/routes/product/new.tsx`
- `src/routes/product/edit.$id.tsx`

## Open policy decisions

- Unauthenticated destination: `/login`, `/unauthorized`, or `/`.
- Whether to keep `search: { redirect: location.href }`.
- Whether to move to a single protected layout boundary.

## Verification

- `bun run docs:check`
- `bun run lint`
- `bun run test:unit`
