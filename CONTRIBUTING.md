# Contributing to Pencel (`CONTRIBUTING.md`)

Welcome to the **Pencel** repository. This document outlines the mandatory engineering conventions, design principles, and contribution workflow required to maintain technical and visual excellence across the project.

---

## 1. Code Standards and Naming Conventions

- **Strict TypeScript:** Never use `any` or `@ts-ignore`. Prefer discriminated unions, precise interfaces, and `unknown` with explicit type guards at system boundaries.
- **React Components:** Named in `PascalCase` (e.g., `Button.tsx`, `TopToolbar.tsx`), co-located with their scoped style module (`Button.module.css`).
- **Custom Hooks and Utilities:** Named in `camelCase` (e.g., `useCanvasEngine.ts`, `documentFactory.ts`).
- **Automated Formatting:** Run `npm run format` and `npm run lint` before creating commits or pull requests.

---

## 2. Directory Structure and Package Boundaries

- **Never violate package boundaries:**
  - `@pencel/shared-types`: Pure type definitions and shared contracts with zero internal or external UI dependencies.
  - `@pencel/editor-core`: Pure conceptual document domain models, geometric calculations, commands, and history without React or Fabric.js dependencies.
  - `@pencel/design-tokens`: Global CSS custom properties and full Light/Dark themes.
  - `apps/web/src/components/ui/`: Reusable, design-system primitive components (must never import from `features/`).
  - `apps/web/src/features/editor/engine/`: The **sole authorized location** allowed to import `fabric`.

---

## 3. Design System and Licensing Guidelines

1. **Mandatory Token Usage:** Every color, spacing increment, typography rule, border radius, and elevation shadow must use variables from `@pencel/design-tokens`.
2. **Theme Parity:** Every token added to `theme-light.css` must have an equivalent token with accessible contrast in `theme-dark.css`.
3. **Icon Abstraction Layer:** Never import `lucide-react` directly into feature components or pages. Register the icon name in `apps/web/src/components/ui/Icon/iconRegistry.ts` and use `<Icon name="..." />`.
4. **Proprietary Asset Prohibition:** Do not bundle proprietary Apple fonts (`SF Pro`, `SF Mono`, `New York`), Apple UI kits, or Apple SF Symbols binary vector files in the web bundle. All assets must possess web-compatible open-source licenses (MIT, ISC, Apache-2.0, OFL).

---

## 4. Dependency Management Policy

Review [`docs/architecture/dependency-policy.md`](./docs/architecture/dependency-policy.md) before proposing or adding any package:

1. Confirm the capability is not already provided by modern web standards or existing dependencies.
2. Verify active maintenance, native TypeScript support, and compatibility with React 19 and Node 24.
3. Verify that the license is permissive (MIT, Apache-2.0, ISC, BSD).
4. Evaluate bundle size impact.
5. Install strictly into the targeted workspace (e.g., `npm install <pkg> --workspace=@pencel/web`).

---

## 5. Quality Verification and Architecture Decision Records (ADRs)

- Always run the full validation suite before submitting your work:
  ```powershell
  npm run typecheck
  npm run lint
  npm run format:check
  npm run test
  npm run build
  ```
- Any architectural decision with lasting impact must be documented as a numbered ADR in [`docs/architecture/decisions/`](./docs/architecture/decisions/) following the **Context**, **Decision**, and **Consequences** format.
