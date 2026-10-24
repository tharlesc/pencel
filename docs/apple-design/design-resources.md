# Apple Design Resources — Levantamento e Licenciamento

- **URL Oficial Consultada:** `https://developer.apple.com/design/resources/`
- **Data da Consulta:** 21 de outubro de 2026
- **Status HTTP:** `200 OK`

---

## 1. Recursos Oficiais Identificados na Data da Consulta

A inspeção direta da página `https://developer.apple.com/design/resources/` identificou os seguintes recursos oficiais publicados pela Apple relevantes para macOS, tipografia e iconografia:

### 1.1 Kits de Interface e Templates de macOS

| Nome do Recurso                   | Origem / URL Identificada                                           | Formato                    | Finalidade Oficial                                                                                                                                                          |
| :-------------------------------- | :------------------------------------------------------------------ | :------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **macOS Design Kit (Figma)**      | `https://www.figma.com/community/file/1651309434229735362/macos-27` | Biblioteca Figma Community | Componentes de UI nativos do macOS (barras de ferramentas, barras laterais, controles, menus, janelas ativas/inativas, materiais e estilos de cor/texto) para prototipação. |
| **macOS Design Library (Sketch)** | `https://sketch.com/s/57153a31-3379-4737-8ac6-dbfd6525f052`         | Biblioteca Sketch Cloud    | Equivalente em formato Sketch para criação de mockups de aplicativos macOS.                                                                                                 |

### 1.2 Recursos Tipográficos (Fontes do Sistema)

| Nome do Recurso              | URL de Download Identificada                                               | Formato                        | Finalidade Oficial                                                                      |
| :--------------------------- | :------------------------------------------------------------------------- | :----------------------------- | :-------------------------------------------------------------------------------------- |
| **SF Pro**                   | `https://devimages-cdn.apple.com/design/resources/download/SF-Pro.dmg`     | `.dmg` (Imagem de disco macOS) | Fonte sans-serif principal do sistema para macOS, iOS e iPadOS.                         |
| **SF Compact**               | `https://devimages-cdn.apple.com/design/resources/download/SF-Compact.dmg` | `.dmg`                         | Variante compacta usada principalmente no watchOS e contextos estreitos.                |
| **SF Mono**                  | `https://devimages-cdn.apple.com/design/resources/download/SF-Mono.dmg`    | `.dmg`                         | Variante monoespaçada para código, valores numéricos tabulares e inspetores técnicos.   |
| **New York (NY)**            | `https://devimages-cdn.apple.com/design/resources/download/NY.dmg`         | `.dmg`                         | Família serifada projetada para funcionar isoladamente ou em conjunto com as fontes SF. |
| **Variantes Internacionais** | `SF-Arabic.dmg`, `SF-Armenian.dmg`, `SF-Georgian.dmg`, `SF-Hebrew.dmg`     | `.dmg`                         | Extensões de script para internacionalização.                                           |

### 1.3 Ferramentas de Iconografia e Molduras de Hardware (_Bezels_)

| Nome do Recurso             | URL de Download Identificada                                                                             | Formato                   | Finalidade Oficial                                                                    |
| :-------------------------- | :------------------------------------------------------------------------------------------------------- | :------------------------ | :------------------------------------------------------------------------------------ |
| **SF Symbols App**          | `https://devimages-cdn.apple.com/design/resources/download/SF-Symbols-27.dmg?2`                          | `.dmg` (Aplicativo macOS) | Aplicativo para navegação, inspeção de camadas e exportação de templates de símbolos. |
| **Molduras Mac / Displays** | `Bezel-MacBook-Air-M5.dmg`, `Bezel-MacBook-Pro-M5.dmg`, `Bezel-iMac-M4.dmg`, `Bezel-Studio-Displays.dmg` | `.dmg`                    | Molduras de produto para apresentação de capturas de tela promocionais.               |

---

## 2. Condições de Uso e Restrições para Aplicações Web

1. **Proibição de redistribuição de ativos em produtos web:** Os UI Kits, fontes em arquivos `.dmg` e o aplicativo `SF Symbols` são disponibilizados sob os contratos de licença da Apple (_Apple Font License_ e _Xcode and Apple SDKs Agreement_) exclusivamente para design, desenvolvimento e mockups de aplicações voltadas às plataformas da Apple.
2. **Uso legítimo neste projeto:** Nenhum arquivo `.dmg`, fonte `.otf/.ttf` proprietária da Apple ou vetor extraído dos kits do Figma/Sketch foi baixado ou embutido no código-fonte do repositório. Os recursos foram analisados como **referência conceitual e dimensional** (proporções de barras, níveis de superfície, raios de borda e semântica de tokens).
