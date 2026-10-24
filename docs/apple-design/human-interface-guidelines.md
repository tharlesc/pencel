# Human Interface Guidelines (HIG) — Princípios e Design para macOS

- **URLs Oficiais Consultadas:**
  - `https://developer.apple.com/design/human-interface-guidelines/`
  - `https://developer.apple.com/design/human-interface-guidelines/design-principles`
  - `https://developer.apple.com/design/human-interface-guidelines/designing-for-macos/`
- **Data da Consulta:** 21 de outubro de 2026

---

## 1. Síntese do Conteúdo Oficial Consultado

### 1.1 Estrutura Geral do HIG

O _Human Interface Guidelines_ organiza-se em seis pilares:

1. **Getting Started:** Princípios fundamentais e especificidades de cada plataforma (_Designing for macOS_, iOS, iPadOS, visionOS, watchOS, tvOS).
2. **Foundations:** Acessibilidade, cor, estética, ícones, SF Symbols, layout, materiais, movimento, privacidade, escrita e tipografia.
3. **Patterns:** Fluxos de interação recorrentes (arrastar e soltar, busca, desfazer/refazer, gerenciamento de arquivos, configurações).
4. **Components:** Controles de interface, barras de ferramentas, barras laterais, menus, diálogos e popovers.
5. **Inputs:** Teclados físicos, dispositivos apontadores (_mouse/trackpad_), gestos e atalhos.
6. **Technologies:** Integrações específicas de ecossistema.

### 1.2 Princípios Fundamentais de Design (_Design Principles_)

A documentação oficial estabelece três princípios centrais para orientar decisões entre prioridades concorrentes:

- **Purpose (Propósito):** O design deve orientar-se continuamente pelo que torna o produto genuinamente útil. Priorizar as funcionalidades mais importantes alinhadas ao objetivo do usuário, evitando recriar soluções desnecessárias e mantendo clareza sobre o diferencial do produto.
- **Agency (Agência e Controle do Usuário):** As pessoas usam o software para realizar tarefas; a melhor interface leva o usuário diretamente ao conteúdo e à tarefa em questão, permanecendo discreta (_unobtrusive_) e disponível quando necessária.
  - Evitar aprisionar o usuário em fluxos rígidos ou modos bloqueantes.
  - Incorporar **reversibilidade e tolerância a erros** (_forgiveness_): quando o usuário sabe que pode reverter uma ação ou retornar a um estado anterior, sente-se livre para explorar sem receio de perder tempo ou trabalho.
- **Responsibility (Responsabilidade):** Clareza de intenção desde a primeira interação, solicitação transparente de permissões, coleta mínima de dados necessária ao funcionamento e proteção da integridade do trabalho do usuário.

### 1.3 Diretrizes de _Designing for macOS_

O guia oficial de macOS destaca as características físicas e comportamentais que distinguem a experiência de produtividade em desktop:

1. **Telas amplas e de alta resolução:** O usuário trabalha em telas grandes (frequentemente com múltiplos monitores) a uma distância típica de **1 a 3 pés (~30 a 90 cm)**.
2. **Precisão de entrada multimodal:** Uso combinado e intensivo de **teclado físico** (atalhos, navegação por foco, entrada de valores exatos) e **dispositivos apontadores** (_mouse_ e _trackpad_ com seleção precisa, _hover_ e menus de contexto).
3. **Sessões de trabalho variáveis e multitarefa:** Interações que vão de edições rápidas de alguns minutos a horas de concentração profunda, com alternância frequente entre janelas ativas e inativas.
4. **Familiaridade estrutural:** Uso consistente de barra de ferramentas superior (_toolbar_), barra lateral de navegação (_sidebar_), área central de documento (_canvas_) e painel inspetor (_inspector_) à direita.

---

## 2. Recomendações e Decisões Inferidas para o Editor Gráfico Web

- **Deferência ao conteúdo (_Agency_):** A área central do canvas recebe destaque visual máximo; barras e painéis utilizam superfícies neutras para não competir cromática ou visualmente com a peça gráfica que está sendo editada.
- **Ausência de modais bloqueantes na entrada:** O editor abre diretamente na superfície de trabalho com dimensões de documento visíveis e controles prontos para uso.
- **Arquitetura preparada para _Forgiveness_ (Histórico/Comandos):** O pacote `@pencel/editor-core` separa explicitamente documentos e comandos desde a fundação para suportar `undo/redo` previsível nas etapas seguintes.
- **Densidade de desktop calibrada:** Controles compactos (28px a 36px de altura) otimizados para ponteiro (_mouse/trackpad_) e navegação completa por teclado, mantendo áreas de clique confortáveis.
