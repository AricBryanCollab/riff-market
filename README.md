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
src/
├── actions/            # Service layer (API Business logic)
├── data/               # Repository layer (Prisma query/mutation methods, database connection)
├── components/         # Reusable UI components (Navbar, UserMenu, CartList, etc.)
├── constants/          # Static values and configuration (e.g., navbar items)
├── hooks/              # Custom React hooks (auth, cart, sign-in/up, etc.)
├── lib/                # Library-based functions
│   └── tanstack-query/ # Query functions for TanStack Query
    └── zod/            # Service layer validation
├── routes/             # Application routes (file-based routing)
├── store/              # Zustand stores for global state (user, dialog, toast, etc.)
├── types/              # TypeScript types and enums
└── .env        # Environment variable definitions
```

---

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run start
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

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

---

## State Management

- **Zustand** for global state (user, cart, dialogs, toasts).
- **TanStack Query** for server state and API data fetching.

---

## Routing

- **TanStack Router** for file-based routing in `src/routes`.

---