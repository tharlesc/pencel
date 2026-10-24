# Materiais e Efeitos Visuais — Diretrizes Oficiais e Tradução Web

- **URL Oficial Consultada:** `https://developer.apple.com/design/human-interface-guidelines/materials`
- **Endpoint DocC:** `https://developer.apple.com/tutorials/data/design/human-interface-guidelines/materials.json`
- **Data da Consulta:** 21 de outubro de 2026

---

## 1. Síntese do Conteúdo Oficial Consultado

Um **material** no HIG da Apple é um efeito visual que cria sensação de profundidade, estratificação (_layering_) e hierarquia entre elementos de primeiro plano (controles, navegação, texto) e elementos de plano de fundo (conteúdo).

A documentação oficial divide os materiais em duas categorias principais:

### 1.1 _Liquid Glass_

- Forma uma camada funcional distinta para controles e elementos de navegação (como barras de ferramentas, barras laterais, popovers e controles flutuantes) que pairam sobre a camada de conteúdo.
- **Regra explícita de contenção:** O _Liquid Glass_ funciona melhor quando distingue claramente elementos interativos do conteúdo; incluí-lo indiscriminadamente dentro da camada de conteúdo gera complexidade desnecessária e hierarquia confusa.
- Possui duas variantes documentadas:
  1. **`regular`:** Desfoca e ajusta a luminosidade do fundo para manter a legibilidade de textos e controles densos (usado em barras laterais, alertas e popovers).
  2. **`clear`:** Altamente translúcido, voltado a controles flutuantes sobre mídia rica (fotos e vídeos).
- Respeita configurações de acessibilidade do sistema que reduzem transparência ou aumentam o contraste.

### 1.2 _Standard Materials_

- Utilizados para diferenciação visual estrutural dentro da camada de conteúdo (planos de fundo de janelas, cartões agrupados e divisões de seção).

---

## 2. Tradução Técnica para CSS Moderno no Editor Web

Em nossa aplicação web, traduzimos os conceitos de _Standard Materials_ e _Liquid Glass (`regular`)_ de forma sóbria e performática nos tokens CSS (`packages/design-tokens/src/tokens.css`):

1. **Superfícies translúcidas (`--surface-glass-bg` + `--backdrop-blur-glass`):**
   - Aplicadas apenas a camadas flutuantes (como cabeçalhos sobrepostos, popovers, diálogos e barra de zoom flutuante sobre o palco do canvas) utilizando `backdrop-filter: saturate(180%) blur(16px)`.
2. **Painéis laterais e inspetores (`Standard Materials`):**
   - Utilizam superfícies sólidas ou semissólidas de alta opacidade (`--color-surface-primary` e `--color-surface-secondary`) separadas por bordas capilares de `1px` (`--color-border-subtle`), garantindo contraste máximo para leitura prolongada de propriedades numéricas.
3. **Respeito a Preferências de Transparência/Contraste:**
   - Quando o navegador ou o tema solicita maior contraste, os tokens mantêm opacidade sólida legível sem depender do efeito de desfoque para garantir leitura.
