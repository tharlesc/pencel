# AGENTS.md — Permanent Pencel Repository Rules

This document establishes the mandatory architectural, technical, design, and governance rules for any agent or software engineer working in this repository.

---

## 1. Official Technology Stack

- **Monorepo Management:** npm Workspaces (`apps/*`, `packages/*`).
- **Frontend (`@pencel/web`):** React 19, TypeScript 5, Vite 8, CSS Modules + CSS Custom Properties (`@pencel/design-tokens`).
- **Isolated Graphic Engine:** Fabric.js (`fabric`) encapsulated within `apps/web/src/features/editor/engine/`, decoupled from the pure domain model in `@pencel/editor-core`.
- **Backend (`@pencel/api`):** Node.js (>= 22.19 / 24.11+), Express 5, TypeScript.
- **Iconography:** `lucide-react` (ISC License), accessed exclusively through the `<Icon />` abstraction layer (`apps/web/src/components/ui/Icon/`).
- **Quality and Testing:** Vitest, Testing Library, Supertest, ESLint 9 (Flat Config), and Prettier.
- **Prohibition of Competing Styling Systems:** Do not introduce Tailwind CSS, styled-components, Emotion, or other CSS-in-JS libraries without a formally approved ADR.

---

## 2. Monorepo Structure and Package Boundaries

- `apps/web/`: Graphic editor React interface.
- `apps/api/`: Standalone Express HTTP server (capable of starting without a database or external services in its initial phase).
- `packages/design-tokens/`: Global CSS tokens (`tokens.css`, `theme-light.css`, `theme-dark.css`).
- `packages/editor-core/`: Conceptual document model, elements, commands, history, and serialization in pure TypeScript (zero dependencies on React, DOM, or Fabric.js).
- `packages/shared-types/`: Shared contracts and TypeScript types across frontend, backend, and core.

**Strict Dependency Direction (Circular dependencies are strictly forbidden):**

- `shared-types` → zero internal dependencies.
- `editor-core` → depends only on `shared-types`.
- `design-tokens` → zero code dependencies.
- `web` → may import `design-tokens`, `editor-core`, and `shared-types`.
- `api` → may import `shared-types` and `editor-core`.

---

## 3. Naming Conventions

- **React Components and Component Files:** `PascalCase` (e.g., `TopToolbar.tsx`, `TopToolbar.module.css`).
- **Custom Hooks:** `camelCase` starting with `use` (e.g., `useCanvasEngine.ts`, `useTheme.ts`).
- **Utilities, Domain Models, and Helper Modules:** `camelCase` (e.g., `documentFactory.ts`, `iconRegistry.ts`).
- **Global Constants and Environment Variables:** `UPPER_SNAKE_CASE`.
- **CSS Tokens:** `kebab-case` with semantic prefixes (`--color-*`, `--space-*`, `--font-*`, `--radius-*`, `--shadow-*`).

---

## 4. TypeScript Typing Rules

- Mandatory strict compilation (`strict: true`, `noUncheckedIndexedAccess: true`).
- The use of `any` is forbidden; use `unknown` with explicit type guards at external boundaries.
- Never suppress errors with `@ts-ignore`.
- All component props and public package function return types must have explicit typing.

---

## 5. Component and State Organization

- Generic reusable components reside in `apps/web/src/components/ui/`.
- Page and shell layouts reside in `apps/web/src/components/layout/`.
- Editor-specific domain logic and components reside in `apps/web/src/features/editor/`.
- Do not concentrate business logic in `App.tsx`.
- Strictly separate: (1) Document Model, (2) UI State, (3) Selection State, (4) Canvas Representation (`Fabric.js`), and (5) Persistence Format.

---

## 6. Design System Principles (Apple-Inspired)

- All colors, spacing, typography, borders, and shadows must originate from `@pencel/design-tokens`.
- Maintain complete parity between Light Theme (`[data-theme="light"]`) and Dark Theme (`[data-theme="dark"]`).
- Prioritize deference to content: neutral chrome, toolbars, and inspectors that let the canvas stage stand out.
- Apply `font-variant-numeric: tabular-nums` to all numeric displays, inputs, and coordinates.
- Ensure baseline accessibility: WCAG AA contrast ratio, full keyboard navigability, clear `:focus-visible` styling, explicit `aria-label` on icon-only controls, and `prefers-reduced-motion` compliance.

---

## 7. Licensing and Intellectual Property Rules

- **Prohibition of Proprietary Apple Assets:** Do not bundle proprietary Apple font files (`SF Pro`, `SF Mono`, `New York`), Apple UI kits, or Apple SF Symbols binary vectors into the web application.
- **Prohibition of Copying Commercial Assets:** Do not duplicate source code, trademarks, proprietary brand gradients, or templates from Canva, Adobe, or other commercial tools.
- Every icon library, font, or external media asset introduced must have an open-source license compatible with web distribution (MIT, ISC, Apache-2.0, OFL).

---

## 8. Security and Environment Governance

- Never commit fictitious credentials masquerading as real secrets or hardcode sensitive API keys in source code.
- Provide safe reference templates in `.env.example`.
- **Prohibition of Destructive Changes:** Do not delete critical files, overwrite configurations without prior analysis, alter global PowerShell execution policies, or install global packages without explicit user approval.
- On Windows / PowerShell, use `npm.cmd` and `npx.cmd` when necessary to prevent `.ps1` execution policy restrictions.

---

## 9. Dependency Management Protocol

Before introducing any new dependency ([`docs/architecture/dependency-policy.md`](./docs/architecture/dependency-policy.md)):

1. Confirm the required capability is not already available in the web platform or existing dependencies.
2. Verify active maintenance, native TypeScript typings, and full compatibility with React 19 and Node 24.
3. Verify that the license is permissive.
4. Measure and evaluate the impact on production bundle size.
5. Record an Architecture Decision Record (ADR) in `docs/architecture/decisions/` whenever introducing a significant architectural dependency.

---

## 10. Minimum Quality Gates, ADRs, and Technical Integrity

- Every modification must pass `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run format:check`, `npm.cmd run test`, and `npm.cmd run build`.
- **Obligation to Record Architectural Decisions:** Document all significant decisions in `docs/architecture/decisions/` (ADR format).
- **Prohibition of Mock/Fictitious Features:** Never implement deceptive UI flows or non-functional placeholder buttons just to pretend future capabilities (such as full undo/redo, advanced export, or databases) are complete.
- **Absolute Transparency on State and Tests:** Never claim a command, test, or build passed without having actually executed it and inspected its genuine output.
