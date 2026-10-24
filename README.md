# Pencel — Editor Gráfico Web (Fundação Técnica)

O **Pencel** é um editor gráfico web para criação de posts de Instagram, stories, banners, flyers e peças digitais. Sua organização funcional é inspirada em ferramentas criativas modernas, enquanto sua experiência visual, tipografia tabular, hierarquia de superfícies e precisão ergonômica seguem os princípios do **Apple Human Interface Guidelines (HIG)** para macOS, com identidade visual própria e licenciamento 100% compatível com a web.

---

## 1. Tecnologias Utilizadas

- **Monorepositório:** npm Workspaces (`apps/*`, `packages/*`)
- **Frontend (`@pencel/web`):** React 19, TypeScript 5.9, Vite, CSS Modules + CSS Variables
- **Design System (`@pencel/design-tokens`):** Tokens semânticos CSS com suporte nativo a Tema Claro e Tema Escuro
- **Motor Gráfico Isolado:** Fabric.js encapsulado em `apps/web/src/features/editor/engine/`
- **Núcleo de Domínio (`@pencel/editor-core`):** Modelagem agnóstica de documento, páginas, elementos, presets e serialização JSON
- **Iconografia:** `lucide-react` (Licença ISC) sob camada de abstração única (`<Icon />`)
- **Backend (`@pencel/api`):** Node.js, Express 5, TypeScript
- **Qualidade e Testes:** Vitest, Testing Library, Supertest, ESLint e Prettier

---

## 2. Requisitos do Ambiente

- **Node.js:** `>= 22.19.0` ou `>= 24.11.0` (testado e validado em `v24.21.0`)
- **npm:** `>= 10.0.0` (testado e validado em `11.19.0`)
- **Git:** `>= 2.40`

> **Dica para Windows / PowerShell:** Caso a política de execução do PowerShell bloqueie scripts `.ps1`, utilize `npm.cmd` e `npx.cmd` sem precisar alterar configurações globais do sistema.

---

## 3. Estrutura de Diretórios

```text
pencel/
├── apps/
│   ├── web/                 # Interface React + Vite + adaptador Fabric.js
│   └── api/                 # Servidor HTTP Express + rota de saúde (/api/v1/health)
├── packages/
│   ├── design-tokens/       # Variáveis CSS semânticas e temas (Light/Dark)
│   ├── editor-core/         # Modelo conceitual de documento, comandos e serialização
│   └── shared-types/        # Contratos TypeScript compartilhados
├── .agents/
│   ├── rules/               # Regras contextuais do Antigravity
│   └── skills/              # 8 skills especializadas do projeto (SKILL.md)
├── docs/
│   ├── apple-design/        # Sínteses oficiais do Apple HIG, recursos e licenciamento
│   ├── architecture/        # Visão geral, estrutura, políticas e ADRs (decisions/)
│   ├── development/         # Guias de ambiente, comandos, testes e troubleshooting
│   └── product/             # Visão do produto e escopo do MVP
├── AGENTS.md                # Regras permanentes para agentes e desenvolvedores
└── CONTRIBUTING.md          # Guia de contribuição e padrões de engenharia
```

---

## 4. Instalação e Execução

### Instalar todas as dependências

```powershell
npm.cmd install
```

### Iniciar o Frontend (`http://localhost:5173`)

```powershell
npm.cmd run dev:web
```

### Iniciar a API (`http://localhost:4000/api/v1/health`)

```powershell
npm.cmd run dev:api
```

### Iniciar Frontend e API simultaneamente

```powershell
npm.cmd run dev
```

_(Nota: O frontend é totalmente independente e funciona mesmo com a API desligada e sem banco de dados)._

---

## 5. Compilação, Testes e Verificação de Qualidade

```powershell
# Compilar todos os pacotes e aplicações
npm.cmd run build

# Verificar tipagem estática TypeScript em todos os workspaces
npm.cmd run typecheck

# Executar linter (ESLint)
npm.cmd run lint

# Verificar formatação de código (Prettier)
npm.cmd run format:check

# Executar suíte completa de testes automatizados (Vitest)
npm.cmd run test
```

---

## 6. Utilizando as Skills no Google Antigravity

O projeto inclui 8 skills operacionais em `.agents/skills/<nome>/SKILL.md`, descobertas automaticamente pelo Antigravity:

1. `apple-design-researcher` — Pesquisa auditável nas fontes oficiais da Apple.
2. `apple-inspired-web-design` — Aplicação de hierarquia, materiais e densidade de desktop.
3. `iconography-and-licensing` — Governança da camada `<Icon />` e conformidade de licenças.
4. `design-system-engineer` — Manutenção de tokens CSS, temas e componentes primitivos.
5. `editor-architecture` — Separação entre `@pencel/editor-core`, estado React e `Fabric.js`.
6. `react-typescript-standards` — Padrões estritos de tipagem, hooks e tratamento de erros.
7. `accessibility-and-quality` — Auditoria WCAG AA, teclado, ARIA e execução de testes.
8. `rea-analysis-workflow` — Uso ético e baseado em evidências do REA.

---

## 7. Verificando a Integração do REA (`rea-agents`)

Para verificar a prontidão do REA para o cliente Antigravity:

```powershell
npx.cmd --yes rea-agents@latest doctor --client antigravity --skill --json
```

Caso configure ou atualize a integração com `npx.cmd rea-agents@latest setup --client antigravity`, **reinicie o Antigravity** para que o servidor MCP registrado em `~/.gemini/config/mcp_config.json` seja carregado na sessão ativa.
