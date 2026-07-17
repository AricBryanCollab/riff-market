# RiffMarket

RiffMarket is a modern e-commerce web application for buying and selling music gear. Built with React, TanStack Router, TanStack Query, Zustand, and Tailwind CSS, it provides a seamless experience for customers, sellers, and admins.

---

## Features

- **User Authentication:** Sign up, sign in, and role-based access (Customer, Seller, Admin).
- **Product Listings:** Browse, search, and filter music gear.
- **Shopping Cart:** Add, remove, and manage cart items.
- **Order Management:** Sellers can manage orders; admins can approve products.
- **Notifications:** Real-time notifications for orders and approvals.
- **Responsive UI:** Built with Tailwind CSS and shadcn/ui components.

---

## Folder Structure

```
.env.example            # Environment variable template (copy to .env at project root)
src/
├── components/         # Reusable UI components (Navbar, UserMenu, CartList, etc.)
├── data/               # Repository layer (Prisma query/mutation methods, database connection)
├── domains/            # Domain logic and application services
├── server/             # Server functions and API handlers
├── routes/             # Application routes (file-based routing)
├── hooks/              # Custom React hooks (auth, cart, sign-in/up, etc.)
├── store/              # Zustand stores for global state (user, dialog, toast, etc.)
├── lib/                # Shared utilities and library helpers
└── test/               # Test helpers and fixtures
```

---

## Getting Started

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in real values for the required keys.

3. **Generate the Prisma client:**
   ```bash
   bun db:generate
   ```

4. **Run database migrations:**
   ```bash
   bun prisma migrate dev
   ```

5. **Run the development server:**
   ```bash
   bun dev
   ```

6. **Build for production:**
   ```bash
   bun build
   ```

7. **Format and lint:**
   ```bash
   bun format
   bun lint
   bun validate
   ```

For DB-backed Vitest tests and Playwright, set `TEST_DATABASE_URL` in `.env` (see `.env.example`). The database name must contain `test`, `testing`, `vitest`, or `integration`.

---

## Testing

- **Unit & Component Tests:**  
  Uses [Vitest](https://vitest.dev/) and Playwright for browser tests.
  ```bash
  bun run test
  bun run test:browser
  ```

---

## Styling

- **Tailwind CSS** for utility-first styling.
- **shadcn/ui** for accessible, customizable UI components.

## Garden Context

- This repo uses Garden context cards in `.garden/context/*.md`.
- Garden owns the generated context section in `AGENTS.md`; update context cards, then run `bun run garden:sync`.
- Required context check: `bun run garden:lint`.
- To inspect context for changed files, run `bun run garden:check -- <paths...>`.
- The pre-commit hook skips Garden checks when the `garden` CLI is not installed.

---

## State Management

- **Zustand** for global state (user, cart, dialogs, toasts).
- **TanStack Query** for server state and API data fetching.

---

## Routing

- **TanStack Router** for file-based routing in `src/routes`.

---
