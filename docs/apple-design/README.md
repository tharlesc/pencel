# Documentação de Referência — Apple Design & HIG

Este diretório centraliza a pesquisa técnica realizada sobre a documentação oficial da Apple, recursos de design (`Apple Design Resources`), diretrizes de interface humana (`Human Interface Guidelines` — HIG) e termos de licenciamento aplicáveis à construção do **Pencel** (editor gráfico web inspirado em ferramentas criativas modernas com linguagem visual fundamentada nos princípios da Apple).

## Índice de Documentos

1. [Fontes Consultadas e Metodologia (`sources.md`)](./sources.md) — Registro auditável de URLs oficiais, datas de consulta, status de verificação via API DocC/HTML e distinção entre conteúdo oficial, recursos identificados e inferências arquiteturais.
2. [PackageDescription: Plataforma macOS (`macos-platform.md`)](./macos-platform.md) — Estudo técnico isolado da propriedade `Platform.macOS` no manifesto Swift Package Manager (`PackageDescription`).
3. [StoreKit: AppStore.Platform.macOS (`appstore-platform.md`)](./appstore-platform.md) — Estudo técnico isolado da propriedade `AppStore.Platform.macOS` no framework `StoreKit`.
4. [Human Interface Guidelines — Visão Geral e Princípios (`human-interface-guidelines.md`)](./human-interface-guidelines.md) — Princípios fundamentais (_Purpose_, _Agency_, _Responsibility_) e diretrizes de _Designing for macOS_.
5. [Apple Design Resources (`design-resources.md`)](./design-resources.md) — Levantamento dos UI Kits (Figma/Sketch), templates de ícones, fontes e materiais disponíveis em `developer.apple.com/design/resources/` e restrições de uso na web.
6. [Tipografia (`typography.md`)](./typography.md) — Estudo das famílias San Francisco (`SF Pro`, `SF Compact`, `SF Mono`) e `New York`, restrições de licenciamento web e definição da pilha tipográfica compatível.
7. [Cor e Aparência (`color-and-appearance.md`)](./color-and-appearance.md) — Cores semânticas dinâmicas, contraste inclusivo, adaptação entre Light Mode e Dark Mode e diretrizes sobre cores em superfícies translúcidas.
8. [Layout e Espaçamento (`layout-and-spacing.md`)](./layout-and-spacing.md) — Hierarquia visual, densidade de informação para desktop, alinhamento óptico, barras de ferramentas, barras laterais e painéis de inspeção.
9. [Materiais e Efeitos (`materials-and-effects.md`)](./materials-and-effects.md) — Estudo de _Standard Materials_, _Vibrancy_ e _Liquid Glass_ (`regular` vs `clear`), e tradução técnica para CSS moderno (`backdrop-filter`).
10. [Iconografia e Licenciamento (`iconography.md`)](./iconography.md) — Análise técnica de `SF Symbols`, restrições contratuais de distribuição web e arquitetura da camada de abstração (`Icon`) com `lucide-react`.
11. [Acessibilidade (`accessibility.md`)](./accessibility.md) — Contraste (WCAG AA / APCA), navegação por teclado, nomes acessíveis (equivalentes web ao VoiceOver), redução de movimento e aumento de contraste.
12. [Movimento e Interações (`motion-and-interactions.md`)](./motion-and-interactions.md) — Microinterações breves e precisas, coerência espacial e respeito a `prefers-reduced-motion`.
13. [Decisões de Design Derivadas (`design-decisions.md`)](./design-decisions.md) — Síntese consolidada das decisões de produto e design system adotadas nesta fundação.
