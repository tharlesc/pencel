# Cor e Aparência — Diretrizes Oficiais e Tokens Semânticos

- **URL Oficial Consultada:** `https://developer.apple.com/design/human-interface-guidelines/color`
- **Endpoint DocC:** `https://developer.apple.com/tutorials/data/design/human-interface-guidelines/color.json`
- **Data da Consulta:** 21 de outubro de 2026

---

## 1. Síntese do Conteúdo Oficial Consultado

### 1.1 Cores Semânticas e Dinâmicas (_System Colors_)

- A Apple define cores dinâmicas pelo seu **propósito semântico** (_purpose_), e não por valores estáticos de cor ou aparência.
- Exemplos oficiais citados na documentação:
  - Cores de plano de fundo (_backgrounds_) divididas em níveis de hierarquia (primário, secundário, terciário / agrupado).
  - Cores de primeiro plano (_foreground_) para rótulos primários, rótulos secundários, links e separadores.
- **Regra explícita do HIG:** Usar cada cor semântica apenas para sua finalidade pretendida (por exemplo, nunca usar a cor de `separator` como cor de texto, nem `secondaryLabel` como cor de fundo).

### 1.2 Cor Inclusiva (_Inclusive Color_)

- Nunca utilizar a cor como único meio de transmitir informação ou estado: sempre combinar cor com rótulos de texto, formas de glifos ou ícones distintos para atender pessoas com daltonismo ou baixa visão.
- Garantir contraste suficiente entre texto/ícones e plano de fundo tanto no tema claro quanto no tema escuro.

### 1.3 Uso Comedido de Cor em Controles e _Liquid Glass_

- Em barras de ferramentas e barras laterais, ícones e rótulos seguem preferencialmente um esquema monocromático neutro para preservar a legibilidade e dar protagonismo ao conteúdo.
- A cor de destaque (_accent color_) deve ser reservada para elementos que realmente se beneficiam de ênfase, como **ações primárias** (aplicando a cor de destaque ao fundo do botão primário) ou **estados de seleção ativos**, evitando colorir o fundo de múltiplos controles simultaneamente.

---

## 2. Tradução Técnica para o Design System (`@pencel/design-tokens`)

Implementamos em `packages/design-tokens/src/` três arquivos coordenados:

- `tokens.css`: Escalas base, tipografia, dimensões e variáveis estruturais.
- `theme-light.css`: Paleta semântica calibrada para ambiente claro (`:root, [data-theme="light"]`).
- `theme-dark.css`: Paleta semântica calibrada para ambiente escuro (`[data-theme="dark"]`), utilizando tons de cinza grafite elevados (`#121214`, `#1c1c1f`, `#252529`) em vez de mera inversão matemática de cores.

### Categorias de Tokens de Cor Definidas

1. **Fundos e Superfícies:** `--color-bg-app`, `--color-bg-canvas-stage`, `--color-surface-primary`, `--color-surface-secondary`, `--color-surface-tertiary`, `--color-surface-elevated`, `--color-surface-glass`.
2. **Bordas e Separadores:** `--color-border-subtle`, `--color-border-default`, `--color-border-strong`.
3. **Textos:** `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`, `--color-text-disabled`, `--color-text-on-accent`.
4. **Destaque, Seleção e Foco:** `--color-accent-primary`, `--color-accent-primary-hover`, `--color-accent-primary-active`, `--color-selection-bg`, `--color-selection-border`, `--color-focus-ring`.
5. **Estados Semânticos:** `--color-status-success`, `--color-status-warning`, `--color-status-error` (com pares de fundo suave `-bg` e texto/borda contrastante).
