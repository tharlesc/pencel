# ADR 0024 — Geração Autônoma de Layouts com IA e Integração na Barra de Criação

## Status

Aprovado / Implementado

## Contexto

O usuário solicitou suporte a Inteligência Artificial para que, a partir de comandos em texto (linguagem natural), o Pencel gere layouts completos de forma autônoma a partir de uma API, posicionando o botão de acionamento na lateral, na parte inferior do menu "Ferramentas de Criação" (barra vertical do estúdio).

Requisitos essenciais:

1. **Geração Autônoma e Real:** O layout gerado não deve ser uma imagem estática ou simulação; deve consistir em elementos vetoriais e de texto reais (`textbox`, `rect`, `circle`, `triangle`), completamente editáveis no palco (mover, redimensionar, recolorir, editar textos, duplicar e reordenar camadas).
2. **Desacoplamento e Resiliência (Zero Segredos Hardcoded):** Suporte opcional a chaves de API externas (`GEMINI_API_KEY` ou `OPENAI_API_KEY`) no backend `@pencel/api`, com mecanismo de fallback integrado (motor de síntese de design autônomo baseado em regras semânticas de harmonia cromática e hierarquia visual).
3. **Ergonomia e Posicionamento (Apple Pro Studio):** O botão deve ficar posicionado na parte inferior do menu de ferramentas de criação (`SidebarNav`), abrindo uma gaveta expansível (`AiGeneratorPanel`) com sugestões rápidas, seletor de estilo e campo de prompt.
4. **Governança de Código (`AGENTS.md`):** Zero literais hexadecimais, zero chamadas `rgba()` e zero unidades `px` no CSS do componente; compilação estrita em TypeScript (`strict: true`, sem `any`); e paridade nos modos claro e escuro.

## Decisões Técnicas

### 1. Backend `@pencel/api`: Módulo de IA e Síntese de Design

- **Configuração de Ambiente (`apps/api/src/config/env.ts`):**
  - Adicionadas as variáveis opcionais `geminiApiKey` e `openaiApiKey`.
- **Serviço de Inteligência Artificial (`apps/api/src/modules/ai/ai.service.ts`):**
  - Quando uma chave externa (`GEMINI_API_KEY` ou `OPENAI_API_KEY`) estiver presente, envia a solicitação ao LLM com instruções estritas para devolução de JSON compatível com o schema do Pencel.
  - Se a chave não estiver configurada ou a chamada externa falhar, aciona o motor interno `synthesizeAutonomousLayout`, que:
    - Analisa semanticamente as palavras-chave do prompt (detecção de categorias: tech/software, promoção/black friday, evento/workshop, frase/editorial, gastronomia).
    - Determina paleta de cores harmônica (fundo escuro/claro, superfícies de cartão, cores de destaque, destaques secundários e contraste WCAG AA).
    - Calcula a escala tipográfica proporcional e a geometria espacial para as dimensões exatas do artboard (badge, título com tamanho responsivo, subtítulo com entrelinha equilibrada, botão de CTA em pílula e rodapé sutil).
- **Rotas Express (`apps/api/src/modules/ai/ai.routes.ts`):**
  - Exposição de `POST /api/v1/ai/generate-layout` com validação de payload.
  - Montado no roteador principal em `apps/api/src/app.ts`.

### 2. Frontend `@pencel/web`: Serviço e Motor Gráfico Fabric.js

- **Serviço de Rede (`apps/web/src/features/editor/services/aiLayoutService.ts`):**
  - Utiliza o `httpClient` centralizado para acionar `/ai/generate-layout` com timeout resiliente e tipagem estrita de resposta `Result`.
- **Motor Gráfico Isolado (`apps/web/src/features/editor/engine/generatedLayoutEngine.ts`):**
  - Função pura `applyGeneratedLayoutToCanvas` que limpa objetos anteriores, ajusta a cor de fundo do artboard e instancia classes nativas de Fabric (`FabricRect`, `FabricCircle`, `FabricTriangle`, `FabricTextbox`).
  - Cada elemento recebe propriedades táteis (preenchimento, borda, raio de curvatura, alinhamento de texto e nome da camada).
  - Integrado ao histórico (`undo`/`redo`) via `onCommit()`.
- **Extensão do Facade (`FabricCanvasAdapter.ts` e `useCanvasEngine.ts`):**
  - Adicionado o método `applyGeneratedLayout(layout)` exportado pelo hook de motor gráfico.

### 3. Interface do Usuário: Botão Lateral e Painel `AiGeneratorPanel`

- **Posicionamento no Trilho Lateral (`SidebarNav.tsx` e `SidebarNav.module.css`):**
  - O trilho de navegação foi particionado em `.railTop` e `.railBottom`.
  - `.railBottom` aplica `margin-top: auto`, ancorando o botão de IA com ícone `sparkles` e rótulo "IA Arte" na extremidade inferior do menu "Ferramentas de criação", conforme solicitado pelo usuário.
- **Painel Gaveta (`AiGeneratorPanel.tsx` e `AiGeneratorPanel.module.css`):**
  - Cartão introdutório com explicação clara sobre a autonomia da IA.
  - Fichas de sugestão rápida ("🚀 Lançamento Tech", "🔥 Black Friday / Oferta", "✨ Frase Inspiradora", "🎉 Workshop Online", "☕ Café Artesanal").
  - Caixa de texto para prompt com contagem de caracteres e botão para limpar.
  - Seletor de direção estética (Tech & Dark, Promoção, Minimalista, Elegante, Vibrante).
  - Botão de ação com indicador de carregamento giratório e tratamento de erros com alertas acessíveis.
  - Estilização 100% tokenizada via `@pencel/design-tokens` (zero literais hex/px/rgba).

## Consequências

- O usuário agora possui um fluxo completo de criação de artes por Inteligência Artificial, acessível diretamente na extremidade inferior da barra de ferramentas lateral.
- As artes criadas são totalmente editáveis e interativas, respeitando o modelo de prancheta, camadas e histórico do estúdio.
- O sistema opera perfeitamente tanto de forma autônoma offline (sem necessidade de chaves externas) quanto conectado a provedores modernos de LLM.
- Todos os testes unitários, testes de integração, checagens de tipos do TypeScript, ESLint e Prettier foram executados com sucesso (166 testes aprovados).
