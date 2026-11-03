# Dependency and Security Policy (`dependency-policy.md`)

Every external library introduced into the **Pencel** monorepo incurs maintenance overhead, expands the security attack surface, and impacts client bundle size. This policy defines the mandatory protocol for evaluating and adding dependencies.

---

## 1. Mandatory Evaluation Criteria

1. **Demonstrated Need:** Verify first whether the capability can be implemented using modern web platform primitives (Web APIs, modern CSS, `node:*`) or existing workspace utilities.
2. **Single Responsibility:** Never introduce competing libraries for the same domain (e.g., competing icon sets, multiple CSS styling runtimes, or redundant HTTP clients).
3. **Technical Compatibility:** Packages must natively support TypeScript (or maintained `@types/*`), remain compatible with Node.js 24 LTS and React 19, and support modern ECMAScript Modules (ESM) with tree-shaking.
4. **Permissive Web Licensing:**
   - **Approved:** `MIT`, `ISC`, `BSD-2-Clause`, `BSD-3-Clause`, `Apache-2.0`, `OFL-1.1`.
   - **Prohibited without explicit legal review:** `GPL`, `AGPL`, `SSPL`, proprietary platform-restricted licenses (such as raw Apple SDK or SF Symbols assets), and packages lacking explicit licenses.
5. **Security and Integrity:**
   - Never install packages with opaque post-install scripts downloading unverified remote binaries.
   - Run `npm audit` regularly and keep `package-lock.json` committed.

---

## 2. Approved Core Dependencies

| Package                            | Scope               | License    | Purpose                                                                     |
| :--------------------------------- | :------------------ | :--------- | :-------------------------------------------------------------------------- |
| `react` / `react-dom`              | `@pencel/web`       | MIT        | Declarative user interface runtime.                                         |
| `fabric`                           | `@pencel/web`       | MIT        | HTML5 Canvas rendering engine (encapsulated in `features/editor/engine/`).  |
| `lucide-react`                     | `@pencel/web`       | ISC        | Open-source vector icon set accessed solely through `<Icon />` abstraction. |
| `@huggingface/transformers`        | `@pencel/web`       | Apache-2.0 | In-browser client-side background removal machine learning models.          |
| `express`                          | `@pencel/api`       | MIT        | Minimalist HTTP server framework.                                           |
| `cors`                             | `@pencel/api`       | MIT        | Defensive Cross-Origin Resource Sharing control between web client and API. |
| `typescript`                       | Root (Dev)          | Apache-2.0 | Monorepo-wide static type checking and compilation.                         |
| `vite` / `@vitejs/plugin-react`    | `@pencel/web` (Dev) | MIT        | Next-generation frontend build tooling and local development server.        |
| `vitest`                           | Root (Dev)          | MIT        | High-performance unit and integration test runner.                          |
| `@testing-library/react` / `jsdom` | `@pencel/web` (Dev) | MIT        | Accessible component testing suite.                                         |
| `supertest`                        | `@pencel/api` (Dev) | MIT        | Fast API integration testing.                                               |
| `eslint` / `typescript-eslint`     | Root (Dev)          | MIT        | Static linting and code hygiene.                                            |
| `prettier`                         | Root (Dev)          | MIT        | Deterministic, automated code formatting.                                   |
