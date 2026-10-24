# Política de Dependências e Segurança (`dependency-policy.md`)

Toda biblioteca externa adicionada ao monorepositório **Pencel** representa um custo de manutenção, superfície de segurança e impacto no tamanho do pacote. Esta política define os critérios obrigatórios para avaliação e instalação de pacotes.

---

## 1. Critérios Obrigatórios Antes de Adicionar uma Dependência

1. **Necessidade Real:** Verifique primeiro se a funcionalidade pode ser resolvida com APIs nativas da plataforma (Web APIs, CSS moderno, `node:*`) ou com dependências já presentes no workspace.
2. **Responsabilidade Única:** É proibido manter duas bibliotecas que disputem a mesma responsabilidade (por exemplo, duas bibliotecas de ícones, dois sistemas de estilização ou dois clientes HTTP).
3. **Compatibilidade Técnica:** O pacote deve suportar TypeScript nativamente (ou possuir `@types/*` mantidos), ser compatível com Node.js 24 LTS e React 19, e suportar ESM / _tree-shaking_.
4. **Licenciamento Compatível com Distribuição Web:**
   - **Permitidas:** `MIT`, `ISC`, `BSD-2-Clause`, `BSD-3-Clause`, `Apache-2.0`, `OFL-1.1`.
   - **Proibidas sem revisão jurídica:** `GPL`, `AGPL`, `SSPL`, licenças proprietárias restritas a plataformas específicas (como ativos do Apple SDK/SF Symbols) ou pacotes sem licença declarada.
5. **Segurança:**
   - Não instale pacotes com scripts de pós-instalação opacos que baixem binários desconhecidos.
   - Execute `npm.cmd audit` periodicamente e mantenha o `package-lock.json` versionado.

---

## 2. Dependências Aprovadas na Fundação Inicial

| Pacote                             | Escopo              | Licença    | Finalidade                                                                              |
| :--------------------------------- | :------------------ | :--------- | :-------------------------------------------------------------------------------------- |
| `react` / `react-dom`              | `@pencel/web`       | MIT        | Biblioteca declarativa de interface de usuário.                                         |
| `fabric`                           | `@pencel/web`       | MIT        | Motor gráfico interativo HTML5 Canvas (isolado em `features/editor/engine/`).           |
| `lucide-react`                     | `@pencel/web`       | ISC        | Biblioteca de ícones vetoriais consumida exclusivamente via abstração `<Icon />`.       |
| `express`                          | `@pencel/api`       | MIT        | Servidor HTTP minimalista para a API REST.                                              |
| `cors`                             | `@pencel/api`       | MIT        | Configuração controlada de Cross-Origin Resource Sharing entre `web` e `api`.           |
| `typescript`                       | Raiz (Dev)          | Apache-2.0 | Verificação estática de tipos em todo o monorepositório.                                |
| `vite` / `@vitejs/plugin-react`    | `@pencel/web` (Dev) | MIT        | Servidor de desenvolvimento rápido e empacotador de produção.                           |
| `vitest`                           | Raiz (Dev)          | MIT        | Executor de testes unitários e de integração compatível com Vite e TypeScript.          |
| `@testing-library/react` / `jsdom` | `@pencel/web` (Dev) | MIT        | Testes de componentes React focados em acessibilidade e comportamento.                  |
| `supertest`                        | `@pencel/api` (Dev) | MIT        | Testes de integração HTTP da API Express sem necessidade de abrir portas de rede reais. |
| `eslint` / `typescript-eslint`     | Raiz (Dev)          | MIT        | Análise estática de código e aplicação de regras arquiteturais.                         |
| `prettier`                         | Raiz (Dev)          | MIT        | Formatação padronizada de código.                                                       |
