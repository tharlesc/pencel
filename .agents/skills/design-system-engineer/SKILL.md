---
name: design-system-engineer
description: >-
  Use this skill when creating or updating CSS design tokens, light/dark themes,
  or reusable base UI components in packages/design-tokens and
  apps/web/src/components/ui. Prevents style duplication and enforces token-driven
  CSS Modules.
---

# Design System Engineer

Use this skill when evolving `@pencel/design-tokens` or building primitive UI components in `apps/web/src/components/ui/`.

## Activation Criteria

- Adding or updating tokens in [`packages/design-tokens/src/`](../../../packages/design-tokens/src/index.css).
- Creating or modifying base UI primitives (`Button`, `Input`, `Tabs`, `Panel`, `Toolbar`, `Badge`, `Tooltip`, `Dialog`, `Icon`).
- Resolving styling duplication or theme inconsistencies between Light and Dark modes.

## Operational Procedure

1. **Token-First Architecture (`@pencel/design-tokens`)**
   - Define structural scales (spacing, sizing, typography, radii, elevation, transitions) in [`packages/design-tokens/src/tokens.css`](../../../packages/design-tokens/src/tokens.css).
   - Define semantic color tokens in [`packages/design-tokens/src/theme-light.css`](../../../packages/design-tokens/src/theme-light.css) and [`packages/design-tokens/src/theme-dark.css`](../../../packages/design-tokens/src/theme-dark.css).
   - Every semantic color token present in `theme-light.css` must have a purposeful counterpart in `theme-dark.css` (dark surfaces must use elevated luminance steps rather than raw color inversion).

2. **Component Styling Standards (`CSS Modules`)**
   - Style components exclusively with `.module.css` files consuming CSS custom properties (`var(--...)`).
   - Do not introduce Tailwind, styled-components, Emotion, or inline hex/rgb literals in component styles.
   - Expose clear, constrained TypeScript props for variants (`variant`, `size`, `active`, `disabled`) and forward native HTML attributes for accessibility.

3. **Prevent Speculative Bloat**
   - Only build UI components or variants that serve an immediate structural need in the editor or have a documented near-term consumer.

## Verification Checklist

- [ ] No hardcoded hex/rgb values appear in `apps/web/src/**/*.module.css`.
- [ ] Light and dark theme token sets have 1:1 variable parity.
- [ ] `npm.cmd run typecheck`, `npm.cmd run lint`, and `npm.cmd run test` pass after component updates.
