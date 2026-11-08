# ADR 0030: Motor de Exportação em Resolução Nativa Multi-Escala e Otimizações de Renderização Vetorial

- **Status:** Aprovado
- **Data:** 2026-11-08
- **Contexto:** Resolução de perda de qualidade na exportação raster (PNG/JPEG) decorrente da amostragem em tela com zoom reduzido, adição de suporte a exportação com fundo transparente e aprimoramento da fidelidade de pré-visualização e estabilidade do motor de vetorização VTracer.

---

## 1. Contexto e Problema

1. **Degradação de Qualidade na Exportação em Tela:** A implementação inicial de exportação raster gerava arquivos PNG/JPEG capturando o canvas HTML da viewport de edição (`lowerCanvasEl`). Quando o usuário trabalhava com a prancheta visualizada a 30% ou 50% de zoom para caber na tela, a imagem gerada sofria redução destrutiva de resolução e interpolação bilinear borrada, perdendo a nitidez original da arte vetorial e das fotos.
2. **Necessidade de Fundo Transparente (Canal Alfa):** Designers frequentemente criam logotipos, selos, adesivos e ícones que exigem exportação em PNG ou SVG sem o preenchimento de fundo da prancheta (fundo transparente).
3. **Ergonomia e Estabilidade de Vetorização VTracer:**
   - Em imagens densas ou com detalhes minuciosos, a conversão para SVG gerava grande volume de caminhos vetoriais que podiam causar lentidão ao serem inseridos no palco.
   - O visualizador do modal de vetorização não possuía ajuste automático de enquadramento (auto-fit), cortando artes que excediam a janela de pré-visualização.
   - Silhuetas escuras (como logotipos pretos) ficavam invisíveis no palco escuro de pré-visualização, necessitando de controle de contraste de fundo (xadrez, claro e escuro).

---

## 2. Decisões Arquiteturais

### 2.1 Renderização Direta em Resolução Nominal Multi-Escala (`historyAndPageEngine.ts`)

- Em vez de interpolar os pixels visíveis da janela do navegador, o motor `exportCanvasDataUrl` executa uma passagem atômica de renderização nativa:
  1. Salva as dimensões atuais (`originalWidth`, `originalHeight`) e a matriz de transformação do viewport (`originalVpt = fabricCanvas.viewportTransform`).
  2. Ajusta as dimensões físicas do canvas para o tamanho nominal da página multiplicado pelo fator de escala solicitado (`scaleFactor`: 1x, 2x Retina, 3x Print Ultra-HD):
     $$\text{outWidth} = \text{page.dimensions.width} \times \text{scaleFactor}$$
     $$\text{outHeight} = \text{page.dimensions.height} \times \text{scaleFactor}$$
  3. Define a matriz afim de transformação de viewport limpa: `[scaleFactor, 0, 0, scaleFactor, 0, 0]`.
  4. Executa a extração do fluxo de dados via `fabricCanvas.toDataURL({ format, quality, multiplier: 1 })`.
  5. Restaura imediatamente as dimensões e o viewport da sessão interativa, garantindo zero oscilação de tela (_flicker_) para o usuário.

### 2.2 Supressão de Fundo para Exportação Transparente

- O gerenciador de pranchetas (`ViewportManager` em `viewportAndGuidesEngine.ts`) recebeu as flags de controle `isExporting` e `exportSuppressBackground`.
- Durante a exportação com `transparentBackground = true`:
  - O desenho do retângulo de fundo da prancheta é suprimido na camada de exportação.
  - Elementos vetoriais e imagens mantêm suas posições e cores exatas, gravados sobre canal alfa puro de 32 bits (RGBA).

### 2.3 Interface do Diálogo de Exportação (`ExportDialog.tsx`)

- O modal de exportação foi reestruturado de forma concisa (< 300 linhas):
  - **Fator de Escala:** Seleção rápida entre `1x (Padrão)`, `2x (Retina)` e `3x (Impressão / Ultra-HD)`.
  - **Fundo Transparente:** Checkbox semântico "Fundo Transparente (Sem Fundo)" disponível para formatos PNG e SVG.
  - Estilização 100% aderente a `@pencel/design-tokens`, com zero valores fixos em pixels ou cores literais hexadecimais no CSS Module.

### 2.4 Aprimoramentos no Modal de Vetorização VTracer (`VectorizePreview.tsx` e `vectorTraceEngine.ts`)

- **Auto-Fit e Pan:** Cálculo de escala ideal na montagem da pré-visualização para enquadrar completamente o vetor sem cortes.
- **Alternador de Fundo do Palco de Preview:** Botões compactos de troca de fundo em 3 modos:
  - *Xadrez (Checkerboard):* Padrão clássico de transparência para validar recortes.
  - *Claro (Light):* Superfície clara para visualização de silhuetas e traços pretos/escuros.
  - *Escuro (Dark):* Superfície escura para visualização de logotipos e elementos brancos.
- **Remoção de Fundo Vetorial (`stripSvgBackground`):** Algoritmo que detecta e remove o elemento de fundo delimitador do SVG gerado pelo VTracer quando solicitado.
- **Otimização de Lote no Canvas:** Ao transferir o SVG vetorizado para o palco do editor, o motor ativa `renderOnAddRemove = false`, aplica `objectCaching: true` aos caminhos filhos e efetua decimação de nós redundantes, eliminando qualquer travamento na UI do React.

---

## 3. Consequências

### 3.1 Benefícios

- **Qualidade Profissional de Imagem:** Exportações vetoriais e raster com definição nítida independente do nível de zoom da tela.
- **Versatilidade para Impressão e Web:** Capacidade de gerar arquivos de alta densidade (2x e 3x) e imagens isoladas com fundo transparente.
- **Estabilidade do Navegador:** Mesmo imagens complexas com centenas de curvas de Bézier são inseridas no palco instantaneamente sem degradação na taxa de quadros (60 FPS).
- **Sem Dependências Proprietárias:** Totalmente construído com APIs abertas do Fabric.js e WebAssembly Rust (VTracer).

### 3.2 Conformidade com Regras do Repositório (AGENTS.md)

- `historyAndPageEngine.ts`: Mantido estritamente abaixo do teto de 500 linhas (224 linhas).
- `FabricCanvasAdapter.ts`: Mantido estritamente abaixo do teto de 500 linhas (482 linhas).
- `ExportDialog.tsx`: Mantido estritamente abaixo do teto de 300 linhas (261 linhas).
- `VectorizePreview.tsx`: Mantido estritamente abaixo do teto de 300 linhas (284 linhas).
- Zero literais hexadecimais, zero `rgba()` e zero unidades fixas `px` nos módulos CSS.
