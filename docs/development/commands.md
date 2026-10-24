# Referência de Comandos do Monorepositório (`commands.md`)

Todos os comandos abaixo devem ser executados a partir da pasta raiz do projeto. No Windows PowerShell, prefira `npm.cmd` no lugar de `npm`.

---

## 1. Scripts Principais da Raiz (`package.json`)

| Comando                    | Descrição                                                                                                                        |
| :------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| `npm.cmd run dev`          | Inicia simultaneamente o frontend (`@pencel/web` em `http://localhost:5173`) e a API (`@pencel/api` em `http://localhost:4000`). |
| `npm.cmd run dev:web`      | Inicia apenas o servidor de desenvolvimento Vite do frontend (`apps/web`).                                                       |
| `npm.cmd run dev:api`      | Inicia apenas o servidor de desenvolvimento da API (`apps/api`).                                                                 |
| `npm.cmd run build`        | Compila todos os pacotes e aplicações na ordem correta (`shared-types`, `editor-core`, `api`, `web`).                            |
| `npm.cmd run typecheck`    | Executa a verificação estática do TypeScript (`tsc --noEmit`) em todos os pacotes do monorepositório.                            |
| `npm.cmd run lint`         | Executa o ESLint em todos os arquivos TypeScript/React do projeto.                                                               |
| `npm.cmd run format:check` | Verifica se todos os arquivos seguem a formatação do Prettier.                                                                   |
| `npm.cmd run format`       | Formata automaticamente os arquivos do repositório com o Prettier.                                                               |
| `npm.cmd run test`         | Executa a suíte completa de testes automatizados (Vitest) em modo não interativo (`run`).                                        |

---

## 2. Execução Escopada por Workspace

- Executar testes apenas do núcleo do editor:
  ```powershell
  npm.cmd run test --workspace=@pencel/editor-core
  ```
- Executar testes apenas da API:
  ```powershell
  npm.cmd run test --workspace=@pencel/api
  ```
- Executar testes apenas do frontend:
  ```powershell
  npm.cmd run test --workspace=@pencel/web
  ```
