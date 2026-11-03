# Troubleshooting Guide (`troubleshooting.md`)

---

## 1. PowerShell Script Execution Error (`npm.ps1 cannot be loaded`)

- **Cause:** Restrictive PowerShell execution policies on Windows regarding unverified `.ps1` script wrappers.
- **Remedy (without altering global Windows security settings):** Invoke the native `.cmd` command shims:
  ```powershell
  npm.cmd install
  npm.cmd run build
  ```

---

## 2. Workspace Package Resolution Error (`Cannot find module '@pencel/...'`)

- **Cause:** Internal shared packages (`@pencel/shared-types`, `@pencel/editor-core`) have not yet been built or npm workspace symlinks are stale.
- **Remedy:**
  ```powershell
  npm.cmd install
  npm.cmd run build
  ```

---

## 3. REA Tools Do Not Appear in Active Antigravity Session

- **Cause:** Running `npx.cmd rea-agents@latest setup --client antigravity` updates `~/.gemini/config/mcp_config.json`, but MCP servers are registered during client startup.
- **Remedy:** Restart your Antigravity session after running setup so new MCP endpoints are activated.

---

## 4. Port `4000` or `5173` Already in Use

- **Remedy:** Configure an alternative port via environment variables or CLI flags:
  ```powershell
  $env:PORT=4001; npm.cmd run dev:api
  ```
