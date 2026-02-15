# CVA Classname Rule
<!-- concept:def classnames_cva -->

- Use `cva` (and `VariantProps` when needed) for variant/state class logic.
- Build final class with `cn(variantFn(...), extraClassName)`.
- Avoid `className={condition ? "...": "..."}` for styling states.
- Keep variant names semantic (`filled`, `empty`, `expanded`, etc.).
- Use raw class strings only for non-variant, one-off cases.
- Acceptance: variants are centralized, JSX has no style-condition branches.
