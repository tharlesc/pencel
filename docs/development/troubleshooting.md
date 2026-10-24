# Solução de Problemas Comuns (`troubleshooting.md`)

---

## 1. Erro de Execução de Scripts no PowerShell (`npm.ps1 cannot be loaded`)

- **Causa:** Política de execução restritiva do Windows PowerShell para arquivos `.ps1`.
- **Solução (sem alterar configurações globais do Windows):** Utilize `npm.cmd` e `npx.cmd` em todos os comandos:
  ```powershell
  npm.cmd install
  npm.cmd run build
  ```

## 2. Erro de Resolução de Tipos entre Pacotes do Workspace (`Cannot find module '@pencel/...'`)

- **Causa:** Os pacotes internos (`@pencel/shared-types`, `@pencel/editor-core`) ainda não foram compilados ou o `npm.cmd install` na raiz não criou os links simbólicos do workspace.
- **Solução:**
  ```powershell
  npm.cmd install
  npm.cmd run build
  ```

## 3. Ferramentas do REA Não Aparecem na Sessão Atual do Antigravity

- **Causa:** O comando `npx.cmd rea-agents@latest setup --client antigravity` atualiza `~/.gemini/config/mcp_config.json` e instala a skill em `~/.gemini/config/skills/reverse-engineer-anything`, mas o cliente Antigravity carrega servidores MCP na inicialização.
- **Solução:** Reinicie o Antigravity após concluir a configuração inicial do REA.

## 4. Porta `4000` ou `5173` Já Está em Uso

- **Solução:** Defina uma porta alternativa ao iniciar a API (`$env:PORT=4001; npm.cmd run dev:api`) ou passe `--port` ao Vite.
