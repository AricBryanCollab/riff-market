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
last_reviewed: 2026-06-26
---

## Purpose
- Define the auth/session and RBAC baseline used by guarded routes and protected API handlers.

## Behavior Contract
- Sign-up and sign-in create a server session and store `userId` + `role`.
- Sign-out clears the session.
- The root route loader seeds `["auth", "user"]` with `UserProfile | null` through the optional current-user read before shared UI renders.
- `getOptionalCurrentUserFn()` returns `null` for Guests or stale session user ids; it does not replace required auth checks.
- `useAuthUser()` reads the optional current-user query with key `["auth", "user"]`.
- Client route guards use `requireAuthUser` and `requireRole` and redirect unauthorized users to `/unauthorized`.
- `requireAuthUser` checks cached auth user first, then refreshes the optional current-user query and requires a non-null user.
- Server API handlers that need auth use `authMiddleware`; server functions use `authenticatedServerFunctionMiddleware`.
- Role-only access can be enforced with `roleMiddleware(allowedRoles)` for API handlers or `createServerRoleMiddleware(allowedRoles)` for server functions.

## Key Paths
- `src/lib/tanstack-query/auth-queries.ts`
- `src/server/account-auth-service.ts`
- `src/server/function-middleware.ts`
- `src/server/user.functions.ts`
- `src/hooks/use-auth-user.ts`
- `src/routes/__root.tsx`
- `src/utils/session.ts`
- `src/middleware.ts`
- `src/utils/require-role.ts`
- `src/routes/api/auth.signin.ts`
- `src/routes/api/auth.signup.ts`
- `src/routes/api/auth.signout.ts`
- `src/routes/cart.tsx`
- `src/routes/checkout.tsx`

## Data Flow / Dependencies
- Inputs: credentials to auth API routes + session cookie (`auth`).
- Outputs: auth payloads, `/unauthorized` redirects on guard failures, auth failures for protected handlers/functions without a valid session.
- Storage/deps: session via `useAppSession`, user lookup via `src/data/auth-repo.ts`.

## Change Log
- 2026-06-26: Added root-loader optional current-user seeding while keeping route guards and server-function middleware as required-auth enforcement.
- 2026-06-25: Replaced stale `/api/user` and removed non-existent auth action/user route paths after current-user reads moved to `getCurrentUserFn()`.
- 2026-02-17: Initial capsule created to establish auth/session/RBAC behavior baseline.

## Test Impact / Verification Notes
- Coverage refs: `src/components/user-menu.browser.test.tsx`, `src/utils/can-modify-product.test.ts`.
- Verify: unauthenticated access redirects to `/unauthorized`; protected handlers/functions reject missing sessions; `CUSTOMER` can access `/cart` + `/checkout`.

## Known Risks / Gotchas
- Redirect target is currently `/unauthorized` rather than `/login` for client route guards.
- `requireRole` depends on `["auth", "user"]` query state; stale or null seeded auth data can affect redirect timing.
- Some RBAC checks also exist at action layer; keep route guard and server-side enforcement aligned.
