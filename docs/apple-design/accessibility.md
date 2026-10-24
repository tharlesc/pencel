# Acessibilidade — Diretrizes Oficiais e Critérios de Qualidade Web

- **URL Oficial Consultada:** `https://developer.apple.com/design/human-interface-guidelines/accessibility`
- **Endpoint DocC:** `https://developer.apple.com/tutorials/data/design/human-interface-guidelines/accessibility.json`
- **Data da Consulta:** 21 de outubro de 2026

---

## 1. Síntese do Conteúdo Oficial Consultado

### 1.1 Visão (_Vision_)

- **Escalonamento de texto:** Permitir que o usuário amplie o texto em pelo menos **200%** sem perda de funcionalidade ou truncamento destrutivo de layout.
- **Contraste de cor:** O HIG referencia diretamente o padrão **WCAG Level AA** e o algoritmo **APCA** (_Accessible Perceptual Contrast Algorithm_) para garantir contraste suficiente entre texto/ícones de primeiro plano e cores de fundo, tanto em _Light Mode_ quanto em _Dark Mode_.
- **Independência cromática:** Oferecer indicadores visuais (formas distintas, ícones ou rótulos textuais) além da cor, evitando depender exclusivamente de pares problemáticos para daltonismo (como vermelho-verde ou azul-laranja).
- **Descrições para Leitores de Tela (_VoiceOver_):** Todo controle interativo — especialmente botões somente com ícone — deve fornecer rótulo acessível claro que descreva sua ação ou estado.

### 1.2 Audição, Mobilidade e Cognição

- **Navegação completa por teclado:** Todas as áreas da interface, barras de ferramentas, abas e listas devem ser alcançáveis e operáveis via teclado (`Tab`, `Shift+Tab`, `Enter`, `Espaço`, setas e `Escape`).
- **Redução de movimento:** Evitar que animações sejam o único meio de comunicar informações e respeitar a preferência do usuário por redução de movimento.

---

## 2. Aplicação Prática no Editor Gráfico Web

1. **Contraste Verificado nos Temas Claro e Escuro:**
   - Texto primário sobre superfície primária supera `12:1` (WCAG AAA).
   - Texto secundário sobre superfícies de painel supera `4.8:1` (WCAG AA).
2. **Anéis de Foco Visíveis (`:focus-visible`):**
   - Nenhum controle remove o `outline` sem fornecer um anel de foco nítido (`2px solid var(--color-focus-ring)` com `outline-offset`).
3. **Semântica HTML e Atributos ARIA:**
   - Regiões estruturais demarcadas com `<header>`, `<nav>`, `<main>` e `<aside aria-label="...">`.
   - Botões de ferramentas indicam estado selecionado com `aria-pressed={isSelected}`.
   - Grupo de abas implementa `role="tablist"`, `role="tab"`, `aria-selected` e `role="tabpanel"`.
   - Botões somente de ícone exigem `aria-label` explícito.
4. **Suporte a `@media (prefers-reduced-motion: reduce)`:**
   - Definido globalmente em `packages/design-tokens/src/tokens.css`, reduzindo durações de transição para `0.01ms` quando o usuário ativa a redução de movimento no sistema operacional.
