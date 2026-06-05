# Auth Session and Route Guards
<!-- feature:def auth_session_route_guards -->

---
feature_id: auth_session_route_guards
owner_scope: shared
tags:
  - auth
  - session
  - rbac
  - routing
  - api
status: active
last_reviewed: 2026-02-17
---

## Purpose
- Define the auth/session and RBAC baseline used by guarded routes and protected API handlers.

## Behavior Contract
- Sign-up and sign-in create a server session and store `userId` + `role`.
- Sign-out clears the session.
- Client route guards use `requireAuthUser` and `requireRole` and redirect unauthorized users to `/unauthorized`.
- `requireAuthUser` checks cached auth user first, then calls `getCurrentUserFn` once with query key `["auth", "user"]`, no retries.
- Server API handlers that need auth use `authMiddleware`; missing session or missing user returns `401`.
- Role-only access can be enforced with `roleMiddleware(allowedRoles)` for server handlers.

## Key Paths
- `src/actions/auth.ts`
- `src/utils/session.ts`
- `src/middleware.ts`
- `src/server/user.functions.ts`
- `src/utils/require-role.ts`
- `src/routes/api/auth.signin.ts`
- `src/routes/api/auth.signup.ts`
- `src/routes/api/auth.signout.ts`
- `src/routes/cart.tsx`
- `src/routes/checkout.tsx`

## Data Flow / Dependencies
- Inputs: credentials to auth API routes + session cookie (`auth`).
- Outputs: auth payloads, `/unauthorized` redirects on guard failures, `401` for protected API without valid session.
- Storage/deps: session via `useAppSession`, user lookup via `src/data/auth-repo.ts`.

## Change Log
- 2026-02-17: Initial capsule created to establish auth/session/RBAC behavior baseline.

## Test Impact / Verification Notes
- Coverage refs: `src/components/user-menu.browser.test.tsx`, `src/utils/can-modify-product.test.ts`.
- Verify: unauthenticated access redirects to `/unauthorized`; protected API returns `401` without session; `CUSTOMER` can access `/cart` + `/checkout`.

## Known Risks / Gotchas
- Redirect target is currently `/unauthorized` rather than `/login` for client route guards.
- `requireRole` depends on `["auth", "user"]` query state; stale client auth data can affect redirect timing.
- Some RBAC checks also exist at action layer; keep route guard and server-side enforcement aligned.
