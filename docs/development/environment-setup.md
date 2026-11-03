# Development Environment Setup (`environment-setup.md`)

This guide details the system prerequisites and procedures to prepare your local development environment for **Pencel**, including platform-specific recommendations for **Windows and PowerShell**.

---

## 1. System Prerequisites

- **Operating System:** Windows 10/11, macOS, or Linux.
- **Node.js:** `v22.19.0+` or `v24.11.0+` LTS (validated with `v24.21.0`).
- **npm:** `v10+` or `v11+` (validated with `11.19.0`).
- **Git:** `2.40+`.

---

## 2. Windows PowerShell Conventions (`npm.cmd` and `npx.cmd`)

On Windows systems where the PowerShell script execution policy restricts `.ps1` wrapper execution, **do not alter global system execution policies**. Instead, invoke the native Windows command shims `.cmd` directly:

```powershell
node -v
npm.cmd -v
git --version
```

To install all workspace dependencies from the repository root:

```powershell
npm.cmd install
```

---

## 3. Environment Variables Configuration

The backend API functions out-of-the-box with secure local defaults, requiring zero external services or databases:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

Key environment configurations supported in `apps/api/.env.example`:

- `PORT=4000`: Local API port.
- `HOST=127.0.0.1`: Local binding host.
- `NODE_ENV=development`: Node execution environment.
- `CORS_ORIGIN=http://localhost:5173`: Allowed origin for the frontend client.

---

## 4. Google Antigravity & REA Integration

1. **Repository Skills & Governance:** Operational skills are located in `.agents/skills/*/SKILL.md`, rules in `.agents/rules/project-governance.md`, and permanent repository rules in `AGENTS.md`. Antigravity automatically discovers and loads these upon opening the workspace.
2. **REA Health Verification (`rea-agents`):**
   To inspect the REA integration status for Antigravity without altering files:
   ```powershell
   npx.cmd --yes rea-agents@latest doctor --client antigravity --skill --json
   ```
   _(Note: After running `rea setup` for the first time, restart your Antigravity session so the MCP server registered in `~/.gemini/config/mcp_config.json` is loaded as an active tool)._
