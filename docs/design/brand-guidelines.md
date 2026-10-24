# pencel — Diretrizes da Marca (Brand Guidelines)

> Guia compacto de uso da identidade visual oficial do **pencel** (Direção C — _Palco & Gota_), projetado em harmonia com os princípios de _Clarity_, _Deference_ e _Depth_ do `@pencel/design-tokens`.

---

## 1. A Marca e Seu Conceito

- **Ideia Central (_Palco & Gota_):** Um palco de estúdio (_squircle_ de curvatura contínua inspirado no macOS) esculpido a partir da borda inferior por um traço fluido em espaço negativo que desenha a inicial minúscula `p` e abriga uma gota de pincel no centro.
- **Wordmark Proprietário (`pencel`):** Desenhado em caixa baixa moderna/editorial e integralmente convertido em curvas vetoriais (`<path>`), com compensação óptica (_overshoot_ de `2px` nas curvas), terminais caligráficos cortados a exatos $30^\circ$ em `e` e `c` e cauda fluida de pincel na base do `l`.
- **Versões Oficiais (`apps/web/public/brand/`):**
  - **Lockup Horizontal (Primário):** `pencel-logo-horizontal-color.svg` (tema claro) e `pencel-logo-horizontal-dark.svg` (tema escuro).
  - **Lockup Empilhado (Vertical):** `pencel-logo-stacked-color.svg` e `pencel-logo-stacked-dark.svg`.
  - **Símbolo Autônomo:** `pencel-symbol-color.svg`, `pencel-symbol-black.svg`, `pencel-symbol-white.svg`.
  - **Corte para Tamanhos Reduzidos (`16px–32px`):** `pencel-symbol-small.svg` (também publicado em `apps/web/public/favicon.svg`).
  - **Wordmark Isolado:** `pencel-wordmark-black.svg` e `pencel-wordmark-white.svg`.
  - **Componente React:** `<BrandLogo variant="lockup | symbol | wordmark" size="sm | md | lg" />` em `apps/web/src/components/ui/BrandLogo/`.

---

## 2. Área de Proteção (Clear Space)

Mantenha uma zona livre mínima de **$1 \times d$** em todos os lados da marca, onde **$d$** equivale à largura da gota interna do símbolo (ou à altura-x da letra `e` nos usos apenas tipográficos). Essa zona escala proporcionalmente com a logo.

---

## 3. Tamanhos Mínimos

| Versão                | Tela (Digital / Web)                   | Impressão          | Observação Técnica                                                                        |
| :-------------------- | :------------------------------------- | :----------------- | :---------------------------------------------------------------------------------------- |
| **Lockup Horizontal** | `84 px` de largura (`22 px` de altura) | `24 mm` de largura | Usado em `TopToolbar` com `size="sm"` (`22 px` de altura).                                |
| **Lockup Empilhado**  | `64 px` de largura                     | `18 mm` de largura | Ideal para cards quadrados e telas de boas-vindas.                                        |
| **Símbolo Autônomo**  | `16 px × 16 px`                        | `5 mm × 5 mm`      | De `16 px` a `32 px`, utilize obrigatoriamente `pencel-symbol-small.svg` (`favicon.svg`). |

---

## 4. Paleta Cromática e Contraste

A paleta do **pencel** é diretamente vinculada aos tokens semânticos de `@pencel/design-tokens`:

| Nome             | Token CSS                      | HEX       | RGB             | CMYK (Ref.)      | Pantone (Ref.)  | Contraste                        |
| :--------------- | :----------------------------- | :-------- | :-------------- | :--------------- | :-------------- | :------------------------------- |
| **Pencel Blue**  | `--color-accent-primary`       | `#0071E3` | `0, 113, 227`   | `92, 50, 0, 0`   | `2175 C`        | `4.64 : 1` no branco (`#FFFFFF`) |
| **Studio Ink**   | `--color-text-primary` (Light) | `#1D1D1F` | `29, 29, 31`    | `72, 66, 62, 78` | `Black 6 C`     | `17.1 : 1` no branco (`#FFFFFF`) |
| **Canvas Stage** | `--color-text-primary` (Dark)  | `#F5F5F7` | `245, 245, 247` | `3, 2, 1, 0`     | `Cool Gray 1 C` | `15.4 : 1` no escuro (`#141416`) |
| **Pure White**   | `--color-surface-primary`      | `#FFFFFF` | `255, 255, 255` | `0, 0, 0, 0`     | —               | Vazado interno em fundos claros  |

### Pares de Fundo Aprovados

- **Superfícies Claras (`#FFFFFF`, `#F5F5F7`):** Símbolo em `#0071E3` + Wordmark em `#1D1D1F`.
- **Superfícies Escuras (`#141416`, `#1D1D1F`):** Símbolo em `#0071E3` + Wordmark em `#F5F5F7` (ou versão totalmente branca `#FFFFFF`).
- **Superfícies Azuis (`#0071E3`):** Versão monocromática branca (`pencel-symbol-white.svg` / `pencel-logo-horizontal-white.svg`).
- **Impressão Monocromática / Alto Contraste:** Versão preta (`pencel-logo-horizontal-black.svg`).

---

## 5. Tipografia Institucional (Além do Logo)

- **Wordmark do Logo:** Sempre utilize os arquivos vetoriais convertidos em curvas (`<path>`). **Nunca tente redigitar a palavra `pencel` com uma fonte instalada.**
- **Interface e Textos (`@pencel/design-tokens`):**
  - `--font-family-ui`: `-apple-system, BlinkMacSystemFont, 'Segoe UI Variable Text', 'Segoe UI', Inter, Roboto, Helvetica, Arial, sans-serif`
  - `--font-family-mono`: `ui-monospace, 'SFMono-Regular', 'SF Mono', 'Cascadia Mono', 'Segoe UI Mono', Menlo, Consolas, monospace`

---

## 6. Usos Incorretos (Don'ts)

1. **Não distorça:** Nunca escale a marca de forma não uniforme (esticar ou achatar).
2. **Não altere as relações do lockup:** Não mude a distância ou proporção entre o símbolo _Palco & Gota_ e o wordmark `pencel`.
3. **Não aplique efeitos:** Não adicione sombras projetadas, chanfros, contornos externos ou gradientes multicoloridos ao símbolo.
4. **Não preencha o espaço negativo com outra cor:** O traço em `p` do símbolo é um recorte real (`fill-rule="evenodd"`) que deve sempre revelar o fundo ou o container branco aprovado.
5. **Não redigite o wordmark:** Os terminais de $30^\circ$ em `e`/`c` e a cauda do `l` são exclusivos do desenho vetorial mestre.
