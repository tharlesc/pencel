# AGENTS.md — Regras Permanentes do Projeto Pencel

Este documento estabelece as diretrizes arquiteturais, técnicas, de design e de governança obrigatórias para qualquer agente ou desenvolvedor que atue neste repositório.

---

## 1. Stack Tecnológica Oficial

- **Gerenciamento de Monorepositório:** npm Workspaces (`apps/*`, `packages/*`).
- **Frontend (`@pencel/web`):** React 19, TypeScript 5, Vite 8, CSS Modules + CSS Custom Properties (`@pencel/design-tokens`).
- **Motor Gráfico Isolado:** Fabric.js (`fabric`) encapsulado em `apps/web/src/features/editor/engine/`, desacoplado do modelo de domínio puro em `@pencel/editor-core`.
- **Backend (`@pencel/api`):** Node.js (>= 22.19 / 24.11+), Express 5, TypeScript.
- **Iconografia:** `lucide-react` (Licença ISC), acessada exclusivamente pela camada de abstração `<Icon />` (`apps/web/src/components/ui/Icon/`).
- **Qualidade e Testes:** Vitest, Testing Library, Supertest, ESLint 9 (Flat Config) e Prettier.
- **Proibição de sistemas concorrentes de estilização:** Não adicione Tailwind CSS, styled-components, Emotion ou outras bibliotecas de CSS-in-JS sem um ADR formal aprovado.

---

## 2. Estrutura da Aplicação e Limites de Pacotes

- `apps/web/`: Interface gráfica React do editor.
- `apps/api/`: Servidor HTTP Express independente (capaz de iniciar sem banco de dados ou serviços externos na fase inicial).
- `packages/design-tokens/`: Tokens CSS globais (`tokens.css`, `theme-light.css`, `theme-dark.css`).
- `packages/editor-core/`: Modelo conceitual de documento, elementos, comandos, histórico e serialização em TypeScript puro (sem dependência de React, DOM ou Fabric.js).
- `packages/shared-types/`: Contratos e tipos compartilhados entre frontend, backend e core.

**Direção estrita de dependências (dependências circulares são proibidas):**

- `shared-types` → nenhuma dependência interna.
- `editor-core` → depende apenas de `shared-types`.
- `design-tokens` → nenhuma dependência de código.
- `web` → pode importar `design-tokens`, `editor-core` e `shared-types`.
- `api` → pode importar `shared-types` e `editor-core`.

---

## 3. Convenções de Nomes

- **Componentes React e Arquivos de Componente:** `PascalCase` (ex.: `TopToolbar.tsx`, `TopToolbar.module.css`).
- **Hooks customizados:** `camelCase` iniciando com `use` (ex.: `useCanvasEngine.ts`, `useTheme.ts`).
- **Utilitários, modelos e módulos de domínio:** `camelCase` (ex.: `documentFactory.ts`, `iconRegistry.ts`).
- **Constantes globais e variáveis de ambiente:** `UPPER_SNAKE_CASE`.
- **Tokens CSS:** `kebab-case` com prefixo semântico (`--color-*`, `--space-*`, `--font-*`, `--radius-*`, `--shadow-*`).

---

## 4. Regras de Tipagem (TypeScript)

- Compilação estrita obrigatória (`strict: true`, `noUncheckedIndexedAccess: true`).
- O uso de `any` é proibido; utilize `unknown` com refinamento explícito (_type guards_) em fronteiras externas.
- Não suprima erros com `@ts-ignore`.
- Todas as propriedades de componentes e retornos de funções públicas de pacotes devem possuir tipagem explícita.

---

## 5. Organização dos Componentes e Estado

- Componentes reutilizáveis genéricos residem em `apps/web/src/components/ui/`.
- Estruturas de página residem em `apps/web/src/components/layout/`.
- Lógica e componentes específicos do editor residem em `apps/web/src/features/editor/`.
- Não concentre lógica de negócio em `App.tsx`.
- Separe claramente: (1) Modelo do Documento, (2) Estado da Interface, (3) Estado de Seleção, (4) Representação no Canvas (`Fabric.js`) e (5) Formato de Persistência.

---

## 6. Princípios do Design System (Apple-Inspired)

- Todas as cores, espaçamentos, fontes, bordas e sombras devem vir de `@pencel/design-tokens`.
- Mantenha paridade total entre o tema claro (`[data-theme="light"]`) e o tema escuro (`[data-theme="dark"]`).
- Priorize a deferência ao conteúdo: barras e painéis neutros para destacar o palco do canvas.
- Aplique `font-variant-numeric: tabular-nums` em todos os campos e indicadores numéricos.
- Garanta acessibilidade desde a base: contraste mínimo WCAG AA, navegação completa por teclado, `:focus-visible` nítido, `aria-label` em controles somente com ícone e suporte a `prefers-reduced-motion`.

---

## 7. Regras de Licenciamento e Propriedade Intelectual

- **Proibido embutir ativos restritos da Apple:** Não incorpore arquivos de fonte (`SF Pro`, `SF Mono`, `New York`), arquivos ou vetores do `SF Symbols`, ou templates de UI Kits da Apple ao pacote web.
- **Proibido copiar ativos de terceiros:** Não copie código-fonte, marcas, logotipos, gradientes proprietários ou templates do Canva ou de outras ferramentas comerciais.
- Toda biblioteca de ícones, fontes ou mídia adicionada deve possuir licença aberta compatível com distribuição web (MIT, ISC, Apache-2.0, OFL).

---

## 8. Política de Segurança e Governança de Ambiente

- Nunca crie credenciais fictícias que se passem por segredos reais nem exponha chaves ou tokens no código-fonte.
- Mantenha apenas modelos seguros em `.env.example`.
- **Proibição de alterações destrutivas:** Não exclua arquivos importantes, não sobrescreva configurações sem análise, não altere a política global de execução do PowerShell e não instale pacotes globais sem necessidade e autorização explícita do usuário.
- No Windows/PowerShell, utilize `npm.cmd` e `npx.cmd` quando necessário para evitar bloqueios de política de scripts `.ps1`.

---

## 9. Procedimento para Adicionar Dependências

Antes de instalar qualquer nova dependência (`docs/architecture/dependency-policy.md`):

1. Verifique se a capacidade já está disponível na plataforma web ou nas dependências existentes.
2. Confirme manutenção ativa, tipagem TypeScript e compatibilidade com React 19 / Node 24.
3. Verifique se a licença é permissiva.
4. Avalie o impacto no tamanho do bundle.
5. Registre um ADR em `docs/architecture/decisions/` quando a dependência tiver impacto arquitetural.

---

## 10. Requisitos Mínimos de Testes, Decisões e Honestidade Técnica

- Toda alteração deve passar por `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run format:check`, `npm.cmd run test` e `npm.cmd run build`.
- **Obrigação de registrar decisões arquiteturais:** Decisões técnicas relevantes devem ser documentadas em `docs/architecture/decisions/` (formato ADR).
- **Proibição de funcionalidades fictícias:** Nunca implemente botões ou fluxos enganosos apenas para aparentar que recursos futuros (como desfazer/refazer completo, exportação avançada ou banco de dados) já estão prontos.
- **Transparência sobre testes e estado:** Nunca declare que um comando, build ou teste funcionou sem tê-lo executado e verificado seu resultado real.
