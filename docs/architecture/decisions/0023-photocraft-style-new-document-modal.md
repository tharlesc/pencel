# ADR 0023 — Modal de Novo Documento e Tamanho Personalizado (Arquitetura Studio Desktop / PhotoCraft)

## Status

Aprovado / Implementado

## Contexto

O usuário solicitou um modal de tamanho personalizado / criação de novo documento idêntico e inspirado na arquitetura profissional de estúdios desktop (semelhante a outros no mercado) e no PhotoCraft (`photocraft.exe`):

1. **Predefinições de Documento por Categorias:** Categorias completas organizadas em abas superiores (Recentes, Salvos, Redes Sociais, Foto, Impressão, Arte & Ilustração, Web, Mobile, Filme & Vídeo).
2. **Painel de Detalhes da Predefinição com Conversão de Unidades e DPI:** Suporte estrito a unidades de medida físicas e digitais (`px`, `in`, `cm`, `mm`, `pt`, `pica`), conversão dinâmica de resolução em PPI e PPCm, e preservação da dimensão física ao alterar a resolução.
3. **Alternância de Orientação (Retrato / Paisagem):** Botões com ícones dedicados que invertem largura e altura de forma inteligente.
4. **Miniatura Proporcional da Página:** Renderização em tempo real da proporção de aspecto (aspect ratio) da folha em cada cartão de predefinição.
5. **Criação Rápida por Duplo Clique:** Mecânica de segundo clique/duplo clique sobre qualquer cartão que seleciona a predefinição e inicia o documento imediatamente.
6. **Gerenciamento de Predefinições Salvas e Histórico Recente:** Persistência em `localStorage` para criação e exclusão de predefinições personalizadas pelo usuário, além de histórico automático dos últimos documentos criados.
7. **Acesso Global e Atalhos:** Botão "Novo" na barra superior (`TopToolbar`) com atalho `⌘N` / `Ctrl+N` e integração pelo painel lateral de modelos (`TemplatesPanel`).

## Decisões Técnicas

### 1. Modelo de Domínio e Conversão de Unidades (`newDocumentModel.ts`)

- Criado o módulo `newDocumentModel.ts` encapsulando as taxas de conversão polegadas/pixels/centímetros/milímetros/pontos/picas:
  - `pxToUnit(px, unit, ppi)` e `unitToPx(value, unit, ppi)`.
  - Catálogo imutável `NEW_DOCUMENT_CATEGORIES` alinhado ao padrão da indústria.
  - Funções com tratamento seguro de exceções para persistência de predefinições customizadas (`pencel_saved_document_presets`) e histórico (`pencel_recent_document_presets`).

### 2. Particionamento e Limites Rígidos de Componentes

Para respeitar a governança arquitetural de Pencel (nenhum componente `.tsx` com mais de 300 linhas ou 15 hooks):

- `useNewDocumentModal.ts`: Hook customizado que centraliza estado, validação aritmética de fórmulas (ex: `1920/2`), chaveamento de orientação, persistência e criação do documento (< 200 linhas).
- `NewDocumentModal.tsx`: Container orquestrador do modal montado sobre o componente primitivo `Dialog` com tamanho `size="xl"` (< 150 linhas).
- Subcomponentes dedicados em `apps/web/src/features/editor/components/newDocument/`:
  - `NewDocumentPresetCard.tsx`: Renderização do cartão com miniatura em proporção áurea/aspect ratio.
  - `NewDocumentSavedList.tsx`: Listagem de predefinições do usuário com ação de exclusão.
  - `NewDocumentColorSection.tsx`: Seletor de Modo de Cor (RGB, Cinza, CMYK, Lab), Profundidade de bits e Conteúdo do Plano de Fundo (com swatch interativo e padrão xadrez para transparência).
  - `NewDocumentSavePresetSection.tsx`: Formulário sanfonado para salvar a configuração atual como predefinição permanente.
  - `NewDocumentDetailsPane.tsx`: Painel lateral direito de configuração de detalhes.

### 3. Conformidade com Design Tokens e Zero Literais

- O arquivo `NewDocumentModal.module.css` foi projetado com aderência estrita a `@pencel/design-tokens`:
  - Zero literais hexadecimais ou chamadas `rgba()`.
  - Zero unidades `px` (utilização exclusiva de `rem`, `var(--space-*)` e variáveis semânticas de borda/raio).
  - Novo token de diálogo `--size-dialog-xl: 57.5rem` (920px) adicionado aos tokens globais para acomodar confortavelmente a visualização em duas colunas.

### 4. Integração no Editor

- Disponibilizado no contexto global `EditorSessionContext` via `isNewDocumentModalOpen`, `openNewDocumentModal` e `closeNewDocumentModal`.
- Tecla de atalho `⌘N` / `Ctrl+N` configurada em `useCanvasShortcuts.ts` com prevenção de ação padrão do navegador.
- Botão "Novo" com ícone `filePlus` integrado à barra superior `TopToolbar`.
- Botão avançado "Abrir Modal Avançado (PhotoCraft)..." incorporado ao `TemplatesPanel`.

## Consequências

- Experiência completa e profissional de criação de telas (semelhante a outros no mercado / PhotoCraft.exe).
- 100% dos testes unitários e de integração aprovados (155 testes no monorepo).
- Código estritamente tipado em TypeScript, sem `any`, sem `@ts-ignore` e em total conformidade com o linter ESLint e formatador Prettier.
