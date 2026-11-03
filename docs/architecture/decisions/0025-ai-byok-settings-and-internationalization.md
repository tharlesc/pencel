# 25. Integração de IA com Chave Própria (BYOK), Painel de Configurações e Internacionalização (i18n)

- **Status:** Aceito
- **Data:** 2026-11-02
- **Autor(es):** Equipe Pencel Studio

---

## 1. Contexto e Motivação

O usuário requisitou a evolução do Pencel Studio com foco em três pilares fundamentais:

1. **Posicionamento do botão de Configurações:** O botão de ajustes/configurações deve se localizar estritamente abaixo do botão de _IA Arte_ na barra de navegação lateral (`SidebarNav`), dentro da área de ferramentas de criação.
2. **Integração de IA com Chave do Usuário Final (BYOK - Bring Your Own Key):** A geração autônoma de artes deve ser operada pelo próprio usuário utilizando sua chave pessoal de API (Google Gemini ou OpenAI). A aplicação não deve depender de layouts ou modelos engessados/pré-definidos, interagindo de forma autônoma com o palco gráfico.
3. **Internacionalização Completa (i18n):** O sistema e todos os diretórios devem adotar o inglês padrão (`en`) como idioma nativo default, com suporte reativo e dinâmico a Português (`pt-BR`) e Espanhol (`es`).

---

## 2. Decisões Arquiteturais

### 2.1. Arquitetura de Internacionalização (`@pencel/web/src/shared/i18n`)

- Criou-se um sistema de internacionalização tipado com inferência de chaves por notação de ponto (`TranslationKey` via `NestedKeyOf<TranslationDictionary>`), sem introduzir dependências externas pesadas (como `i18next` ou `react-intl`).
- O dicionário base foi estruturado em módulos limpos:
  - `locales/en.ts`: Inglês padrão (Default do sistema).
  - `locales/pt.ts`: Português do Brasil.
  - `locales/es.ts`: Espanhol.
- Provedor reativo `<I18nProvider>` integrado no topo da árvore de renderização (`App.tsx`), persistindo a preferência em `localStorage['pencel_language']` e atualizando o atributo `document.documentElement.lang`.
- Hook desacoplado `useI18n()` fornecendo `{ language, locale, setLanguage, t }` com fallback gracioso para execução em testes unitários isolados.

### 2.2. Gestão Segura de Chaves BYOK (`aiConfigService.ts`)

- Criou-se o serviço `aiConfigService.ts` para persistência segura de credenciais do usuário:
  - Chaves salvas estritamente no armazenamento local do navegador (`localStorage`), sem jamais serem armazenadas ou salvas em banco de dados central.
  - Suporte a múltiplos provedores: Google Gemini (`gemini-1.5-flash`) e OpenAI (`gpt-4o-mini`).
  - Despacho de eventos customizados `pencel_ai_config_changed` para manter sincronia instantânea entre o `SettingsPanel`, o `AiGeneratorPanel` e outros painéis.
  - Envio seguro por requisição via `httpClient` para o backend proxy `/api/v1/ai/generate-layout`, evitando bloqueios de CORS e respeitando o limite arquitetural de único ponto de `fetch()` (ADR 0005/0013).

### 2.3. Layout do Trilho Lateral e Painel de Configurações

- A barra de navegação `SidebarNav` foi particionada semanticamente entre `.railTop` (ferramentas de design) e `.railBottom` (ferramentas de inteligência e sistema).
- No `.railBottom`, posicionou-se um divisor visual (`.railDivider`), seguido imediatamente pelo botão de **IA Arte** (`id: 'ai'`), e logo abaixo o botão de **Configurações** (`id: 'settings'`).
- O novo componente `SettingsPanel` (`apps/web/src/features/editor/components/sidebar/SettingsPanel/`) foi implementado com:
  - **Seletor de Idioma:** Botões visuais para 🇺🇸 English, 🇧🇷 Português e 🇪🇸 Español.
  - **Configuração BYOK de IA:** Seletor de provedor, input de chave de API com máscara e botão para alternar visibilidade, verificação de status e link direto para obtenção de chave gratuita no Google AI Studio.
  - **Ajustes de Palco:** Alternância da barra flutuante (Inferior horizontal ou Lateral vertical), réguas, guias e recorte de prancheta (`StudioAdjustmentsSection.tsx`).

### 2.4. Conformidade Estrita com os Padrões do Repositório (`AGENTS.md`)

- **Design Tokens:** Todos os módulos CSS (`SettingsPanel.module.css`, `AiGeneratorPanel.module.css`) utilizam estritamente CSS Custom Properties de `@pencel/design-tokens` (zero literais hexadecimais, zero `rgba()` brutos e zero literais `px`).
- **Teto de Linhas por Componente:** Para manter os componentes estritamente abaixo do limite de 300 linhas exigido pelo teste `editorContext.test.tsx`, extraíram-se:
  - `aiGeneratorConstants.ts` e `AiKeyCard.tsx` a partir de `AiGeneratorPanel.tsx`.
  - `StudioAdjustmentsSection.tsx` a partir de `SettingsPanel.tsx`.

---

## 3. Consequências

- **Positivas:**
  - O estúdio agora atende a usuários internacionais em Inglês, Português e Espanhol de forma instantânea e sem recarregar a página.
  - Usuários podem usar qualquer modelo IA com suas próprias chaves, sem custo operacional de infraestrutura para o projeto e com total privacidade de dados.
  - A interface gráfica mantém conformidade rigorosa com a identidade visual Apple Pro Studio (Graphite e Studio Clean).
  - O pipeline de verificação (`typecheck`, `lint`, `format:check`, `test`, `build`) atinge 100% de aprovação (171 testes executados com sucesso).
- **Compromissos:**
  - Chaves de API do usuário dependem da disponibilidade do `localStorage` do navegador e das cotas disponibilizadas pelos provedores externos.
