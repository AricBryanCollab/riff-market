# Theming in RiffMarket

<!-- concept:def theming -->

This project uses `shadcn/ui` style theming with Tailwind CSS v4.

## Sources

- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming)
- [shadcn/ui Manual Install](https://ui.shadcn.com/docs/installation/manual)

## Core model (compact)

- Theme tokens are CSS variables in `src/styles.css`.
- `@theme inline` maps those variables to Tailwind color tokens.
- Tailwind utility classes consume tokens.

```css
:root {
  --category-electric: oklch(0.795 0.184 86.047);
}
.dark {
  --category-electric: oklch(0.85 0.15 86);
}

@theme inline {
  --color-category-electric: var(--category-electric);
}
```

```tsx
<div className="bg-category-electric text-category-electric" />
```

## Mandatory rules

1. Use `oklch()` for theme color values.
2. Keep all color definitions in `src/styles.css`.
3. Never hardcode hex/RGB in TSX/TS.
4. Use Tailwind classes, not inline style color values.

## Add a semantic color (copy this)

1. Add variable in `:root` (and optional variant blocks).
2. Add/adjust variant blocks for `.dark`, `.coffee`, etc.
3. Map variable in `@theme inline`.
4. Use class names in components (`bg-...`, `text-...`, `.../20`, etc.).

```ts
const CATEGORY_STYLES: Record<ProductCategory, string> = {
  ELECTRIC: "category-electric",
  ACOUSTIC: "category-acoustic",
};

const colorClass = CATEGORY_STYLES[category];
<div className={`bg-${colorClass}/20`} />
```

## Theme variants

- `(none)` default
- `.dark`
- `.coffee`
- `.forest`
- `.ocean`
- `.sunset`
- `.crimson`

Apply by adding one class to a root container:

```html
<body class="dark">
  ...
</body>
```

## File map

- `src/styles.css`: all CSS variables, themes, and token mapping.
- `src/types/product.ts`: category/token mappings (class names only).
