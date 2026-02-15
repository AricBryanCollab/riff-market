# Theming in RiffMarket
<!-- concept:def theming -->

This project uses shadcn/ui theming conventions with Tailwind CSS v4.

## Sources

- [shadcn/ui Theming Guide](https://ui.shadcn.com/docs/theming)
- [shadcn/ui Manual Installation](https://ui.shadcn.com/docs/installation/manual)

## Color Format

shadcn uses `oklch()` for all color values in their theming system. From the docs:

> "OKLCH provides perceptually uniform color values for better color consistency across themes"

This means lightness values are consistent across hues, making it easier to create balanced palettes.

```css
/* ✗ Avoid */
--primary: #2563eb;

/* ✓ Preferred */
--primary: oklch(0.546 0.245 262.881);
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Tailwind Classes                                   │
│  bg-primary, text-category-electric                 │
└──────────────────────┬──────────────────────────────┘
                       │ references
                       ▼
┌─────────────────────────────────────────────────────┐
│  @theme inline { }                                  │
│  --color-primary: var(--primary)                    │
└──────────────────────┬──────────────────────────────┘
                       │ references
                       ▼
┌─────────────────────────────────────────────────────┐
│  :root { }  /  .dark { }  /  .coffee { }            │
│  --primary: oklch(0.205 0 0)                        │
└─────────────────────────────────────────────────────┘
```

## Rules

1. **Never hardcode color values in TypeScript/TSX**
2. **All colors defined in `src/styles.css`**
3. **Use Tailwind classes, not inline styles for theme colors**

## Adding a New Semantic Color

### Step 1: Define the CSS variable

Add to `:root` in `src/styles.css`:

```css
:root {
  --category-electric: oklch(0.795 0.184 86.047);
}
```

### Step 2: Add theme variants (if needed)

```css
.dark {
  --category-electric: oklch(0.85 0.15 86);
}
```

### Step 3: Map to Tailwind

Add to `@theme inline` in `src/styles.css`:

```css
@theme inline {
  --color-category-electric: var(--category-electric);
}
```

### Step 4: Use in components

```tsx
<div className="bg-category-electric text-category-electric" />
<div className="bg-category-electric/20" />  /* 20% opacity */
```

## Referencing Theme Colors in TypeScript

When you need dynamic color selection, map to class name segments—not color values:

```ts
// ✗ Wrong - hardcoded values
const COLORS = {
  ELECTRIC: "#eab308",
};

// ✓ Correct - class name references
const CATEGORY_STYLES: Record<ProductCategory, string> = {
  ELECTRIC: "category-electric",
  ACOUSTIC: "category-acoustic",
};
```

Usage in components:

```tsx
const colorClass = CATEGORY_STYLES[category];

<div className={`bg-${colorClass}/20`} />
<Card className={`text-${colorClass} hover:border-current`} />
```

## Available Theme Variants

- `(none)`  
  Default light theme.
- `.dark`  
  Dark mode.
- `.coffee`  
  Warm brown tones.
- `.forest`  
  Green nature tones.
- `.ocean`  
  Blue water tones.
- `.sunset`  
  Orange warm tones.
- `.crimson`  
  Red tones.

Apply to a parent element:

```html
<body class="dark">
  <!-- All children use dark theme -->
</body>
```

## File Locations

- `src/styles.css`  
  All CSS variables and theme definitions.

- `src/types/product.ts`  
  TypeScript color/style mappings (class names only).
