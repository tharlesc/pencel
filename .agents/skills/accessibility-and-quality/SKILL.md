---
name: accessibility-and-quality
description: >-
  Use this skill when auditing UI accessibility, keyboard navigation, color
  contrast, focus states, or writing and running Vitest unit and integration
  tests across the Pencel monorepo.
---

# Accessibility and Quality

Use this workflow when validating UI components, auditing accessibility compliance, or running the quality gate suite.

## Activation Criteria

- Adding interactive UI controls (buttons, inputs, tabs, toolbars, dialogs).
- Writing or updating tests in `apps/web/tests/`, `apps/api/tests/`, or `packages/editor-core/tests/`.
- Preparing changes for CI verification.

## Operational Procedure

1. **Accessibility Audit (WCAG AA & Apple HIG Alignment)**
   - **Accessible Names:** Every icon-only button must have a descriptive `aria-label`. Inputs must be linked to a `<label>` or `aria-label`.
   - **Keyboard Operability:** Verify that all interactive controls can be reached via `Tab` / `Shift+Tab`, show a high-contrast `:focus-visible` ring (`var(--color-focus-ring)`), and activate with `Enter` or `Space`.
   - **State Communication:** Use `aria-pressed` on toggle/tool buttons, `aria-selected` on `role="tab"` elements, and `aria-disabled` / `disabled` on unavailable actions. Never rely on color alone to indicate state.
   - **Motion Sensitivity:** Respect `@media (prefers-reduced-motion: reduce)` across all transitions.

2. **Quality Gate Execution (Windows / PowerShell)**
   Run the full verification pipeline from the repository root:

   ```powershell
   npm.cmd run typecheck
   npm.cmd run lint
   npm.cmd run format:check
   npm.cmd run test
   npm.cmd run build
   ```

3. **Truthful Reporting**
   - Never claim a test or build passed without executing the command and inspecting its exit code.

## Verification Checklist

- [ ] All interactive controls have accessible names verified in component tests.
- [ ] Light and dark themes meet minimum WCAG AA contrast (`4.5:1` for normal text, `3:1` for UI graphics).
- [ ] All Vitest suites (`editor-core`, `api`, `web`) pass cleanly.
