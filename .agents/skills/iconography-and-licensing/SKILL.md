---
name: iconography-and-licensing
description: >-
  Use this skill when adding, modifying, or auditing icons, fonts, or external
  visual assets in the Pencel repository. Enforces Apple SF Symbols licensing
  boundaries and routes all application icons through the centralized Icon
  abstraction component.
---

# Iconography and Licensing

Use this skill whenever adding icons to UI components, expanding the icon catalog, or evaluating third-party visual assets/fonts.

## Activation Criteria

- Adding a new icon name to the UI or toolbar.
- Auditing dependencies or assets for web distribution licensing compliance.
- Modifying [`apps/web/src/components/ui/Icon/`](../../../apps/web/src/components/ui/Icon/Icon.tsx) or [`docs/apple-design/iconography.md`](../../../docs/apple-design/iconography.md).

## Operational Procedure

1. **Verify Asset Licensing Before Installation**
   - **Prohibited in Web Repo:** Never embed Apple `SF Symbols` SVG/font files, `SF Pro`/`SF Mono`/`New York` `.dmg`/`.otf` font files, or third-party packages that redistribute Apple system glyphs. Apple's license restricts those assets to native apps running on Apple-branded platforms.
   - **Permitted Library:** Use `lucide-react` (ISC License) or custom-authored SVGs created specifically for this project.

2. **Route All Icons Through the Abstraction Layer**
   - Never import directly from `lucide-react` inside feature or layout components (`apps/web/src/features/**` or `apps/web/src/components/layout/**`).
   - Register semantic icon names in [`apps/web/src/components/ui/Icon/iconRegistry.ts`](../../../apps/web/src/components/ui/Icon/iconRegistry.ts) and render them exclusively via `<Icon name="..." />`.

3. **Maintain Optical & Typographic Consistency**
   - Use standardized sizes (`xs: 14px`, `sm: 16px`, `md: 18px`, `lg: 20px`, `xl: 24px`).
   - Keep stroke weight aligned with adjacent text (`regular: 1.75`, `medium: 2.0`, `bold: 2.25`).
   - Ensure icon-only buttons provide an explicit `aria-label`, while decorative icons beside visible text leave `label` undefined so `<Icon />` sets `aria-hidden="true"`.

## Verification Checklist

- [ ] `grep` across `apps/web/src` confirms `lucide-react` is imported only inside `apps/web/src/components/ui/Icon/`.
- [ ] Every new semantic icon is documented and typed in `IconName`.
- [ ] License compatibility is verified and recorded in [`docs/apple-design/iconography.md`](../../../docs/apple-design/iconography.md).
