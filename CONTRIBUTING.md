# Guia de Contribuição (`CONTRIBUTING.md`)

Bem-vindo ao repositório do **Pencel**. Este documento descreve as convenções obrigatórias para manter a qualidade arquitetural e visual do projeto.

---

## 1. Convenções de Código e Nomenclatura

- **TypeScript Estrito:** Não utilize `any` ou `@ts-ignore`. Prefira tipos discriminados (`discriminated unions`) e `unknown` com validação explícita.
- **Componentes React:** Nomeados em `PascalCase` (`Button.tsx`, `TopToolbar.tsx`), acompanhados de seu módulo de estilo (`Button.module.css`).
- **Hooks e Utilitários:** Nomeados em `camelCase` (`useCanvasEngine.ts`, `documentFactory.ts`).
- **Formatação:** Antes de abrir um commit ou PR, execute `npm.cmd run format` e `npm.cmd run lint`.

---

## 2. Organização das Pastas e Fronteiras

- **Nunca misture responsabilidades de pacotes:**
  - `@pencel/shared-types`: Contratos puros sem dependências.
  - `@pencel/editor-core`: Lógica conceitual do documento sem React e sem `Fabric.js`.
  - `@pencel/design-tokens`: Variáveis CSS globais e temas.
  - `apps/web/src/components/ui/`: Componentes genéricos do design system (não devem importar de `features/`).
  - `apps/web/src/features/editor/engine/`: Único local autorizado a importar `fabric`.

---

## 3. Regras para Alterações no Design System e Iconografia

1. **Tokens Obrigatórios:** Toda cor, espaçamento, fonte, raio de borda ou sombra deve usar variáveis de `@pencel/design-tokens`.
2. **Paridade de Temas:** Qualquer token semântico adicionado a `theme-light.css` deve ser adicionado com contraste adequado em `theme-dark.css`.
3. **Abstração de Ícones:** Nunca importe `lucide-react` diretamente em páginas ou features. Registre o nome semântico em `apps/web/src/components/ui/Icon/iconRegistry.ts` e utilize `<Icon name="..." />`.
4. **Licenciamento:** Não adicione fontes proprietárias da Apple (`SF Pro`, `SF Mono`, `NY`) nem ativos do `SF Symbols` ao repositório web.

---

## 4. Adição de Novas Dependências

Consulte [`docs/architecture/dependency-policy.md`](./docs/architecture/dependency-policy.md) antes de instalar qualquer pacote:

1. Confirme que não há duplicação de responsabilidade.
2. Verifique a licença (apenas licenças abertas compatíveis com distribuição web, como MIT, ISC, Apache-2.0).
3. Instale no workspace específico (`npm.cmd install <pkg> --workspace=@pencel/web`).

---

## 5. Processo de Testes e Documentação de Decisões (ADRs)

- Execute sempre a bateria completa antes de concluir uma tarefa:
  ```powershell
  npm.cmd run typecheck
  npm.cmd run lint
  npm.cmd run format:check
  npm.cmd run test
  npm.cmd run build
  ```
- Toda decisão técnica com impacto duradouro deve ser documentada como um novo arquivo numerado em [`docs/architecture/decisions/`](./docs/architecture/decisions/) explicando **Contexto**, **Decisão** e **Consequências**.
