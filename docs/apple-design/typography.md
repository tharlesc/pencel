# Tipografia — Diretrizes Oficiais e Adaptação Web

- **URL Oficial Consultada:** `https://developer.apple.com/design/human-interface-guidelines/typography`
- **Endpoint DocC:** `https://developer.apple.com/tutorials/data/design/human-interface-guidelines/typography.json`
- **Data da Consulta:** 21 de outubro de 2026

---

## 1. Síntese do Conteúdo Oficial Consultado

### 1.1 Garantindo Legibilidade (_Ensuring Legibility_)

- O texto precisa ser legível em diferentes distâncias de visualização e condições de iluminação.
- A documentação oficial recomenda explicitamente:
  > _"If you're using system-provided fonts, prefer Regular, Medium, Semibold, or Bold font weights, and avoid Ultralight, Thin, and Light font weights, which can be difficult to see, especially when text is small."_
- Quando pesos finos são utilizados em fontes personalizadas (por exemplo, dentro de uma peça gráfica), deve-se utilizar tamanhos maiores que os padrões de interface.

### 1.2 Hierarquia Tipográfica (_Conveying Hierarchy_)

- Manter distinção visual clara entre títulos, rótulos de seção, corpo de texto e legendas.
- Evitar misturar múltiplas famílias tipográficas na interface de controle, pois isso obscurece a hierarquia de informação e prejudica a consistência interna.
- Nem todo texto da interface deve escalar na mesma proporção: rótulos estruturais de abas e barras de ferramentas permanecem estáveis e concisos, enquanto áreas de leitura e inspeção acomodam variações de tamanho.

### 1.3 Famílias do Sistema Apple

- **San Francisco (SF):** Família sans-serif composta por `SF Pro`, `SF Compact` e `SF Mono` (além de variantes arredondadas e internacionais).
- **New York (NY):** Família serifada complementar.
- Fornecidas em formato _variable font_, permitindo interpolação de pesos e alinhamento óptico direto com glifos de `SF Symbols`.

---

## 2. Licenciamento e Decisão Técnica para a Web

As fontes `SF Pro`, `SF Compact`, `SF Mono` e `New York` baixadas em `developer.apple.com/fonts/` **não possuem licença para hospedagem e distribuição pública via `@font-face` em aplicações web gerais**.

### Solução Adotada no Design System (`@pencel/design-tokens`)

Utilizamos uma pilha tipográfica nativa do sistema operacional (_system font stack_), que resolve automaticamente para San Francisco (`-apple-system`, `BlinkMacSystemFont`) em dispositivos Apple sem redistribuir arquivos proprietários, mantendo equivalentes de alta legibilidade (`Segoe UI Variable` / `Segoe UI` no Windows, `Inter` / `Roboto` no Linux):

- **`--font-family-ui` / `--font-family-sans`:**
  `-apple-system, BlinkMacSystemFont, "Segoe UI Variable Text", "Segoe UI", Inter, Roboto, Helvetica, Arial, sans-serif`
- **`--font-family-mono` (para coordenadas `X/Y`, dimensões `W/H`, zoom e inspetor numérico):**
  `ui-monospace, "SFMono-Regular", "SF Mono", "Cascadia Mono", "Segoe UI Mono", Menlo, Consolas, monospace`

### Escala e Pesos Padronizados

- **Pesos permitidos na UI:** `400` (Regular), `500` (Medium), `600` (Semibold) e `700` (Bold). Pesos abaixo de `400` não são usados na interface do editor.
- **Números tabulares (`font-variant-numeric: tabular-nums`):** Aplicados obrigatoriamente a todos os campos de dimensão, rotação, posição e indicadores de zoom para evitar trepidação visual (_layout jitter_) durante alterações de valor.
