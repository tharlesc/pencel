# Testing & Quality Strategy (`testing.md`)

**Pencel** uses **Vitest** as its unified test runner across all workspaces in the monorepo.

---

## 1. Testing Layers

### 1.1 Pure Domain Tests (`packages/editor-core/tests/`)

- Run in a pure Node.js environment without DOM overhead.
- Validate document creation from presets, artboard additions and modifications, geometric coordinate transformations, snapping algorithms, and schema-versioned JSON serialization/deserialization.

### 1.2 API Integration Tests (`apps/api/tests/`)

- Run using `Vitest` + `Supertest` against the Express application instance (`app.ts`).
- Validate `/api/v1/health`, error handling, rate limiting middleware, security headers, image background removal endpoints, and media proxy routes.

### 1.3 Component and UI Integration Tests (`apps/web/tests/`)

- Run in `jsdom` with `@testing-library/react` and `@testing-library/jest-dom`.
- Validate the `<Icon />` abstraction layer (ensuring appropriate `aria-label` and `aria-hidden` attributes), structural editor shell rendering, Light/Dark theme toggling, preset catalog selection, and modal lifecycles.

---

## 2. Running Test Suites

```powershell
# Run all tests across the monorepo
npm.cmd run test

# Run tests in a specific package
npm.cmd run test --workspace=@pencel/editor-core
npm.cmd run test --workspace=@pencel/api
npm.cmd run test --workspace=@pencel/web
```
