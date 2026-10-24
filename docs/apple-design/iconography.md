# Iconografia e Licenciamento — Pesquisa, Restrições e Arquitetura

- **URLs Oficiais Consultadas:**
  - `https://developer.apple.com/sf-symbols/`
  - `https://developer.apple.com/design/human-interface-guidelines/sf-symbols`
  - `https://developer.apple.com/design/human-interface-guidelines/icons`
- **Data da Consulta:** 21 de outubro de 2026

---

## 1. Análise Técnica das Diretrizes da Apple (`Icons` & `SF Symbols`)

A partir da leitura direta dos documentos oficiais da Apple, foram extraídos os seguintes critérios técnicos para a iconografia de interface:

1. **Simplicidade e Metáfora Universal:** Ícones de interface (_glyphs_) diferem de ícones de aplicativo (_app icons_). Devem usar formas enxutas e metáforas visuais imediatamente reconhecíveis, sem excesso de texturas ou sombreamentos tridimensionais.
2. **Peso Visual e Consistência de Traço (_Stroke Weight_):** Todos os ícones da interface devem compartilhar o mesmo nível de detalhe, perspectiva e espessura de linha. O peso do ícone deve harmonizar-se com o peso da tipografia adjacente (`Regular` a `Medium`).
3. **Escala e Proporção:** Os símbolos organizam-se em escalas padronizadas (pequena, média e grande) para manter alinhamento vertical com diferentes tamanhos de texto e alturas de botões.
4. **Alinhamento Óptico (_Optical Centering_):** Ícones assimétricos (por exemplo, setas direcionais ou símbolos de download/reprodução) podem parecer visualmente deslocados quando centralizados apenas geometricamente; o contêiner de ícone deve preservar área de respiro (_padding_) uniforme para equilíbrio óptico.
5. **Legibilidade em Tamanhos Pequenos:** Em barras de ferramentas e painéis de propriedades de desktop (tamanhos de `14px`, `16px` e `18px`), os caminhos vetoriais precisam manter contraformas abertas para não borrar em telas padrão ou Retina.
6. **Modos de Renderização e Uso Contextual:** O HIG define modos monocromático, hierárquico (variação de opacidade entre camadas), paleta e multicor. Em barras de ferramentas e inspetores, o modo monocromático/hierárquico evita poluição visual, mudando de cor ou fundo apenas quando o estado da ferramenta está **selecionado (`active/pressed`)** ou **desabilitado (`disabled`)**.
7. **Acessibilidade:** Ícones puramente decorativos (acompanhados de rótulo textual visível) devem ser ocultados da árvore de acessibilidade (`aria-hidden="true"`), enquanto botões que exibem apenas ícones exigem descrição acessível explícita (`aria-label` / `role="img"`).

---

## 2. Verificação de Licenciamento do SF Symbols para Aplicações Web

Conforme verificado na página oficial de `SF Symbols` e nos termos do **Xcode and Apple SDKs Agreement** (_System-Provided Images_):

1. **Restrição de Plataforma:** Os símbolos do catálogo `SF Symbols` são licenciados pela Apple **exclusivamente para o desenvolvimento de aplicações destinadas a produtos da marca Apple que executem nos sistemas operacionais para os quais os símbolos foram fornecidos** (iOS, iPadOS, macOS, tvOS, watchOS, visionOS).
2. **Proibição de Distribuição Web:** Extrair glifos, fontes ou arquivos SVG do aplicativo `SF Symbols` (ou instalar pacotes npm de terceiros que redistribuam esses ativos) para uso em uma aplicação web pública multiplataforma (acessível em Windows, Linux, Android e navegadores web gerais) **viola os termos de licença da Apple**.
3. **Proibição em Logotipos e Marcas:** Os termos também proíbem o uso de `SF Symbols` (ou imagens confusamente similares) em logotipos ou ícones de marca.

---

## 3. Decisão Técnica Adotada: `lucide-react` + Camada de Abstração `<Icon />`

### 3.1 Biblioteca Escolhida e Licença

- **Biblioteca adotada:** `lucide-react` (Lucide Icons).
- **Licença:** **ISC License** (open-source, totalmente permissiva para uso comercial, modificação e distribuição em aplicações web sem restrições de plataforma).
- **Justificativa técnica e visual:**
  - Traço vetorial limpo, geométrico, com terminações arredondadas (`stroke-linecap="round"`, `stroke-linejoin="round"`) que se aproxima dos princípios de clareza, proporção e alinhamento óptico documentados no HIG.
  - Suporte nativo ao ajuste fino de `strokeWidth` e `size` via propriedades SVG, permitindo calibrar o peso visual (`1.75` a `2.0`) para casar com a tipografia de peso `Regular` (`400`) e `Medium` (`500`).
  - Suporte completo a _tree-shaking_ em bundlers modernos (Vite/Rollup), incluindo no pacote final apenas os ícones efetivamente mapeados.

### 3.2 Arquitetura da Camada de Abstração (`apps/web/src/components/ui/Icon/`)

Para impedir acoplamento direto dos componentes da aplicação à biblioteca `lucide-react`, foi projetada uma camada única de abstração:

1. **Mapeamento Semântico (`iconRegistry.ts`):**
   - Nenhum componente de domínio importa ícones diretamente de `lucide-react`.
   - A aplicação referencia apenas nomes semânticos do domínio do editor (`'select'`, `'text'`, `'shape'`, `'image'`, `'layers'`, `'template'`, `'zoomIn'`, `'zoomOut'`, `'undo'`, `'redo'`, `'export'`, `'sun'`, `'moon'`, `'check'`, `'warning'`, `'info'`, `'layout'`, `'sliders'`, `'sparkles'`).
2. **Componente Reutilizável `<Icon />` (`Icon.tsx`):**
   - **Tamanhos padronizados:** `xs` (`14px`), `sm` (`16px`), `md` (`18px`), `lg` (`20px`), `xl` (`24px`).
   - **Pesos visuais consistentes:** `regular` (`strokeWidth: 1.75`), `medium` (`strokeWidth: 2`), `bold` (`strokeWidth: 2.25`).
   - **Estados visuais:** Suporte a variante de cor/estado (`default`, `muted`, `active`, `disabled`, `accent`).
   - **Acessibilidade embutida:** Se a propriedade `label` for informada, renderiza `role="img"` e `aria-label={label}` com `aria-hidden="false"`; caso seja omitida (ícone decorativo ao lado de texto), aplica automaticamente `aria-hidden="true"` e `focusable="false"`.
