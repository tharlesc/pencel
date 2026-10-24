# Configuração do Ambiente de Desenvolvimento (`environment-setup.md`)

Este guia descreve os requisitos e procedimentos para preparar o ambiente de desenvolvimento do **Pencel**, com instruções específicas para **Windows e PowerShell**.

---

## 1. Requisitos de Sistema

- **Sistema Operacional:** Windows 10/11, macOS ou Linux.
- **Node.js:** `v22.19.0+` ou `v24.11.0+` (verificado no ambiente atual: `v24.21.0`).
- **npm:** `v10+` ou `v11+` (verificado no ambiente atual: `11.19.0`).
- **Git:** `2.40+` (verificado no ambiente atual: `2.55.0.windows.5`).

---

## 2. Particularidade do Windows PowerShell (`npm.cmd` e `npx.cmd`)

Em ambientes Windows onde a política de execução do PowerShell (`ExecutionPolicy`) restringe a execução de wrappers `.ps1` (`npm.ps1`, `npx.ps1`), **não altere a política global do sistema**. Utilize sempre os executáveis de comando nativos `.cmd`:

```powershell
node -v
npm.cmd -v
git --version
```

Para instalar as dependências na raiz do monorepositório:

```powershell
npm.cmd install
```

---

## 3. Variáveis de Ambiente da API (`apps/api`)

A API funciona imediatamente com valores padrão seguros de desenvolvimento sem exigir banco de dados ou serviços externos. Caso deseje personalizar a porta ou o ambiente local:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

Variáveis suportadas em `apps/api/.env.example`:

- `PORT=4000`
- `HOST=127.0.0.1`
- `NODE_ENV=development`
- `CORS_ORIGIN=http://localhost:5173`

---

## 4. Integração com Antigravity e REA

1. **Skills e Regras do Projeto:** Localizadas em `.agents/skills/*/SKILL.md`, `.agents/rules/project-governance.md` e `AGENTS.md` na raiz. O Antigravity as descobre automaticamente ao abrir o workspace.
2. **Verificação do REA (`rea-agents`):**
   Para inspecionar o estado de configuração do REA no Antigravity sem modificar arquivos:
   ```powershell
   npx.cmd --yes rea-agents@latest doctor --client antigravity --skill --json
   ```
   _(Nota: Após executar `rea setup` pela primeira vez, reinicie o Antigravity para que o servidor MCP registrado em `~/.gemini/config/mcp_config.json` fique ativo como ferramenta na sessão)._
