---
name: apple-inspired-web-design
description: >-
  Use this skill when designing or styling UI layouts, toolbars, sidebars,
  inspectors, dialogs, or interactive surfaces in the Pencel web app. Applies
  macOS Human Interface Guidelines principles (clarity, deference, depth, optical
  alignment, and restrained glass materials) without copying proprietary interfaces.
---

# Apple-Inspired Web Design

Apply this workflow when creating or refining layout and visual styling in `apps/web/`.

## Activation Criteria

- Creating or updating layout regions (`TopToolbar`, `SidebarNav`, `CanvasWorkspace`, `InspectorPanel`).
- Styling interactive controls, floating toolbars, popovers, or dialogs.
- Reviewing visual hierarchy, spacing rhythm, or light/dark appearance balance.

## Operational Procedure

1. **Apply the Three Core Pillars**
   - **Deference to Content (_Agency_):** Keep chrome surfaces (`--color-surface-primary`, `--color-surface-secondary`) neutral so the user's artwork on the canvas remains the brightest, most saturated focal point.
   - **Desktop Information Density:** Follow [`docs/apple-design/layout-and-spacing.md`](../../../docs/apple-design/layout-and-spacing.md). Use compact desktop control heights (`--control-height-sm: 28px`, `--control-height-md: 32px`, `--control-height-lg: 36px`) and a strict `4px` spacing grid.
   - **Restrained Material Hierarchy:** Reserve translucent glass (`--surface-glass-bg` + `--backdrop-blur-glass`) for floating layers (such as canvas zoom HUDs, popovers, or modal headers), as documented in [`docs/apple-design/materials-and-effects.md`](../../../docs/apple-design/materials-and-effects.md). Keep docked sidebars and inspectors on high-legibility solid surfaces.

2. **Enforce Typographic Discipline**
   - Use only weights `400` (Regular), `500` (Medium), `600` (Semibold), and `700` (Bold). Never use `100`–`300` weights in UI controls.
   - Apply `font-variant-numeric: tabular-nums` (or `--font-family-mono`) to all numeric inputs, coordinates (`X`, `Y`, `W`, `H`, rotation), and zoom indicators.

3. **Preserve Original Product Identity**
   - Do not copy Canva's proprietary brand gradients, assets, or exact component layouts.
   - Do not imitate macOS window traffic-light buttons (`close/minimize/zoom` dots) inside a web browser viewport.

## Verification Checklist

- [ ] All colors, radii, shadows, and spacing values reference CSS variables from `@pencel/design-tokens`.
- [ ] Both `[data-theme="light"]` and `[data-theme="dark"]` maintain visual hierarchy and contrast.
- [ ] Accent color (`--color-accent-primary`) is reserved for primary actions and active selection states.
