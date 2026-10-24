# Estratégia de Testes e Qualidade (`testing.md`)

O **Pencel** utiliza **Vitest** como executor unificado de testes em todos os pacotes do monorepositório.

---

## 1. Camadas de Teste Implementadas na Fundação

### 1.1 Testes de Domínio (`packages/editor-core/tests/`)

- Executados em ambiente Node puro.
- Validam criação de documentos a partir de presets, adição/atualização de páginas, criação de elementos (`TextElement`, `ShapeElement`, `ImageElement`), histórico conceitual e serialização/desserialização segura com rejeição de schemas inválidos.

### 1.2 Testes de Integração da API (`apps/api/tests/`)

- Executados com `Vitest` + `Supertest` contra a instância Express (`app.ts`) sem necessidade de abrir sockets de rede externos.
- Validam a rota `/api/v1/health`, o formato do payload de saúde, cabeçalhos e o middleware de rota não encontrada (`404`).

### 1.3 Testes de Componentes e Interface (`apps/web/tests/`)

- Executados em ambiente `jsdom` com `@testing-library/react` e `@testing-library/jest-dom`.
- Validam a camada de abstração de ícones (`<Icon />` com atributos `aria-label` e `aria-hidden`), a renderização da estrutura principal do editor, a alternância de tema Claro/Escuro e a seleção de formatos de documento.

---

## 2. Expansão Futura Planejada (Etapas Seguintes)

Quando as ferramentas interativas completas de manipulação no canvas forem implementadas, poderão ser adicionados:

- Testes de interação de usuário com `@testing-library/user-event`:
  ```powershell
  npm.cmd install --save-dev @testing-library/user-event --workspace=@pencel/web
  ```
- Testes End-to-End (E2E) de navegador real com Playwright (não instalado nesta etapa inicial para evitar download de binários pesados de navegadores sem necessidade).
