# Estrutura de Pastas do Monorepositório

Este documento descreve a finalidade de cada diretório principal do projeto **Pencel**.

```text
pencel/
├── apps/
│   ├── web/                      # Aplicação frontend (React + TypeScript + Vite)
│   │   ├── public/               # Ativos estáticos públicos (favicon SVG próprio)
│   │   ├── src/
│   │   │   ├── app/              # Inicialização da app, providers (Theme) e rotas/shell
│   │   │   ├── assets/           # Ativos estáticos importados pelo bundler
│   │   │   ├── components/
│   │   │   │   ├── ui/           # Componentes primitivos do Design System (Icon, Button, etc.)
│   │   │   │   └── layout/       # Estrutura de layout do editor (TopToolbar, Sidebar, Inspector)
│   │   │   ├── features/
│   │   │   │   ├── editor/       # Domínio de edição no cliente
│   │   │   │   │   ├── components/ # CanvasStage, PropertyInspector, PresetSelector
│   │   │   │   │   ├── engine/     # Adaptador isolado do Fabric.js (FabricCanvasAdapter)
│   │   │   │   │   ├── hooks/      # useCanvasEngine, useEditorSession
│   │   │   │   │   ├── model/      # Presets e mapeadores locais de visualização
│   │   │   │   │   ├── state/      # Estado de UI e seleção do editor
│   │   │   │   │   ├── types/      # Tipos específicos da camada visual do editor
│   │   │   │   │   └── utils/      # Utilitários de zoom, geometria de viewport e formatação
│   │   │   │   ├── projects/     # Módulo reservado para gerenciamento de projetos
│   │   │   │   ├── assets/       # Módulo reservado para biblioteca de mídia/ativos
│   │   │   │   └── export/       # Módulo reservado para pipeline de exportação
│   │   │   └── styles/           # Estilos globais e reset que importam @pencel/design-tokens
│   │   └── tests/                # Testes de componentes e integração do frontend (Vitest)
│   │
│   └── api/                      # Aplicação backend (Node.js + Express + TypeScript)
│       ├── src/
│       │   ├── config/           # Leitura e validação de variáveis de ambiente
│       │   ├── middleware/       # Tratamento centralizado de erros e rotas não encontradas
│       │   ├── modules/
│       │   │   └── health/       # Rota e controlador de saúde (/api/v1/health)
│       │   ├── app.ts            # Instância Express configurada (exportada para testes)
│       │   └── server.ts         # Ponto de entrada HTTP (listen e graceful shutdown)
│       └── tests/                # Testes automatizados da API com Vitest + Supertest
│
├── packages/
│   ├── design-tokens/            # Variáveis CSS semânticas e temas (Light & Dark)
│   │   └── src/
│   │       ├── tokens.css        # Escalas de espaçamento, tipografia, raios, sombras e motion
│   │       ├── theme-light.css   # Cores semânticas do tema claro
│   │       ├── theme-dark.css    # Cores semânticas do tema escuro
│   │       └── index.css         # Ponto de entrada agregado do pacote
│   │
│   ├── editor-core/              # Núcleo agnóstico do editor gráfico (TypeScript puro)
│   │   ├── src/
│   │   │   ├── document/         # Modelo de DesignDocument, DesignPage, GraphicElement
│   │   │   ├── commands/         # Contratos de comando de edição
│   │   │   ├── history/          # Estrutura conceitual de histórico de sessão
│   │   │   ├── serialization/    # Serialização e validação JSON do documento
│   │   │   └── index.ts          # API pública do pacote
│   │   └── tests/                # Testes unitários do domínio gráfico
│   │
│   └── shared-types/             # Contratos TypeScript compartilhados entre todos os pacotes
│       └── src/
│           └── index.ts
│
├── .agents/                      # Customizações do Google Antigravity
│   ├── rules/                    # Regras contextuais do workspace
│   └── skills/                   # 8 skills especializadas do projeto (SKILL.md)
│
├── docs/                         # Documentação técnica e de produto
│   ├── apple-design/             # Pesquisa oficial do Apple HIG, recursos e decisões
│   ├── architecture/             # Arquitetura, estrutura, políticas e ADRs (decisions/)
│   ├── development/              # Configuração de ambiente, comandos, testes e troubleshooting
│   └── product/                  # Visão do produto e definição do MVP
│
├── scripts/                      # Scripts utilitários de verificação do workspace
└── .github/workflows/ci.yml      # Pipeline de Integração Contínua (GitHub Actions)
```

## Justificativa de Ajustes Estruturais

1. Os módulos `projects/`, `assets/` e `export/` no frontend foram posicionados dentro de `apps/web/src/features/` (junto a `features/editor/`) para manter todos os domínios funcionais sob a mesma camada `features/`, evitando duplicidade com `apps/web/src/assets/` (que armazena ativos estáticos de build).
