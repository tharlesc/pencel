---
name: react-typescript-standards
description: >-
  Use this skill when writing or reviewing React components, custom hooks,
  Express API modules, or TypeScript types across the Pencel monorepo. Enforces
  strict TypeScript typing, lean components, explicit error handling, and
  consistent module organization.
---

# React & TypeScript Standards

Apply these standards when authoring or refactoring TypeScript and React code in `apps/` and `packages/`.

## Activation Criteria

- Creating or updating `.ts` or `.tsx` files across any workspace package.
- Resolving TypeScript compiler, ESLint, or runtime error handling issues.
- Refactoring complex components into focused hooks and presentational units.

## Operational Procedure

1. **Strict TypeScript Discipline**
   - Maintain `strict: true`, `noUncheckedIndexedAccess: true`, and `exactOptionalPropertyTypes` compatibility where configured.
   - Never use `any` or silent `@ts-ignore`. Use `unknown` with explicit type guards at external boundaries (such as API inputs or serialized JSON).
   - Export explicit interfaces/types for component props and public package functions.

2. **Component & Hook Organization**
   - Keep components small and single-purpose. Extract lifecycle management (such as canvas initialization or keyboard listeners) into dedicated hooks under `hooks/`.
   - Do not concentrate feature logic inside [`apps/web/src/app/App.tsx`](../../../apps/web/src/app/App.tsx); place domain workflows in `apps/web/src/features/<feature>/`.
   - Ensure all `useEffect` hooks that register event listeners, timers, or canvas instances return a deterministic cleanup function.

3. **API & Error Handling Standards**
   - Validate environment variables at startup ([`apps/api/src/config/env.ts`](../../../apps/api/src/config/env.ts)).
   - Route Express errors through centralized middleware ([`apps/api/src/middleware/errorHandler.ts`](../../../apps/api/src/middleware/errorHandler.ts)) with consistent JSON structure.

## Verification Checklist

- [ ] `npm.cmd run typecheck` exits with code `0` across all workspaces.
- [ ] `npm.cmd run lint` and `npm.cmd run format:check` report zero errors.
- [ ] Every effect with external side effects has a verified cleanup path.
