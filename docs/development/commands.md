# Monorepo Command Reference (`commands.md`)

All commands below should be executed from the repository root. On Windows PowerShell, invoke `npm.cmd` rather than `npm` to ensure reliable script execution.

---

## 1. Primary Root Scripts (`package.json`)

| Command                    | Description                                                                                                             |
| :------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| `npm.cmd run dev`          | Starts both the frontend (`@pencel/web` at `http://localhost:5173`) and API (`@pencel/api` at `http://localhost:4000`). |
| `npm.cmd run dev:web`      | Starts only the Vite development server for the frontend (`apps/web`).                                                  |
| `npm.cmd run dev:api`      | Starts only the development server for the Express API (`apps/api`).                                                    |
| `npm.cmd run build`        | Compiles all packages and applications in the required dependency order (`shared-types`, `editor-core`, `api`, `web`).  |
| `npm.cmd run typecheck`    | Runs monorepo-wide static TypeScript type checking (`tsc --noEmit`) across all workspaces.                              |
| `npm.cmd run lint`         | Runs ESLint 9 across all TypeScript and React files in the project.                                                     |
| `npm.cmd run format:check` | Verifies code adherence to Prettier formatting standards.                                                               |
| `npm.cmd run format`       | Automatically formats all project files with Prettier.                                                                  |
| `npm.cmd run test`         | Executes the automated test suite (Vitest) in non-interactive CI mode (`run`).                                          |

---

## 2. Workspace-Scoped Execution

- Run tests for the domain core only:
  ```powershell
  npm.cmd run test --workspace=@pencel/editor-core
  ```
- Run tests for the API service only:
  ```powershell
  npm.cmd run test --workspace=@pencel/api
  ```
- Run tests for the web client only:
  ```powershell
  npm.cmd run test --workspace=@pencel/web
  ```
- Install a package into a specific workspace:
  ```powershell
  npm.cmd install <package-name> --workspace=@pencel/web
  ```
