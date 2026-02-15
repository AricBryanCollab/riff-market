# Commit Message System
<!-- concept:def commit_conventions -->

| Type | Usage Description | Example Commit |
| ----------- | ------------------- | ---------------- |
| init | Initial project setup / first commit | init: repo layer & types |
| feat | New feature implementation (usually fullstack) | feat: user sign up |
| component | New reusable UI component | component: ProductBadges |
| hooks | Custom hooks or hook-related logic | hooks: useUpdateProduct |
| api | API routes, services, controllers, backend logic | api: getOrderById service |
| style | Styling, UI adjustments, design changes | style: improve navbar spacing and colors |
| layout | Layout structure, page scaffolding, layout system | layout: order page |
| structure | Folder structure, architecture, reorganization | structure: move tanstack-query to /lib |
| chore | Maintenance, adjustments cleanup, config, tooling | chore: update dependencies |
| docs | Documentation updates | docs: update commit system |
| fix | Syntax, bug, or format fix | fix: allow disabled on accept product button |

---

## Commit Format Rules

- Always use lowercase titles
- Always use `:` after the type
- Keep messages concise and action-based  
