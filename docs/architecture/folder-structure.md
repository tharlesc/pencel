# Monorepo Directory Structure (`folder-structure.md`)

This document outlines the organization and purpose of each primary directory in the **Pencel** monorepo.

```text
pencel/
├── apps/
│   ├── web/                      # Frontend client application (React 19 + TypeScript + Vite)
│   │   ├── public/               # Public static assets (custom brand SVGs, favicons, manifests)
│   │   ├── src/
│   │   │   ├── app/              # Application bootstrap, providers (Theme, I18n), and shell
│   │   │   ├── assets/           # Bundler-imported static graphic assets
│   │   │   ├── components/
│   │   │   │   ├── ui/           # Design System primitives (Icon, Button, Input, Modal, etc.)
│   │   │   │   └── layout/       # Structural shell layout (TopToolbar, Sidebar, Inspector)
│   │   │   ├── features/
│   │   │   │   ├── editor/       # Core client editing domain
│   │   │   │   │   ├── components/ # CanvasStage, PropertyInspector, PresetSelector, Toolbars
│   │   │   │   │   ├── engine/     # Isolated Fabric.js canvas adapter (FabricCanvasAdapter)
│   │   │   │   │   ├── hooks/      # useCanvasEngine, useEditorSession, useRulers
│   │   │   │   │   ├── model/      # Local view models, stock photo catalogs, swatches
│   │   │   │   │   ├── state/      # Reactive UI and element selection state
│   │   │   │   │   ├── types/      # Visual editor types and interfaces
│   │   │   │   │   └── utils/      # Viewport geometry, zoom transforms, color math
│   │   │   │   ├── ai/           # Autonomous AI art & layout generator with BYOK integration
│   │   │   │   ├── image/        # Camera Raw image adjustments and background removal
│   │   │   │   ├── projects/     # Future project lifecycle and workspace management
│   │   │   │   └── export/       # Multi-format raster & vector export pipeline
│   │   │   ├── shared/           # Cross-feature utilities, i18n dictionaries, HTTP client
│   │   │   └── styles/           # Global styles and resets importing @pencel/design-tokens
│   │   └── tests/                # Frontend integration & component tests (Vitest + JSDOM)
│   │
│   └── api/                      # Backend HTTP service (Node.js + Express 5 + TypeScript)
│       ├── src/
│       │   ├── config/           # Environment variable parsing and defensive validation
│       │   ├── middleware/       # Security headers, rate limiting, and centralized error handling
│       │   ├── modules/
│       │   │   ├── health/       # Health check controller (/api/v1/health)
│       │   │   ├── ai/           # AI layout generation proxy
│       │   │   ├── image/        # Background removal processing route
│       │   │   └── media/        # Curated stock media proxies (Unsplash, Pexels, GIPHY)
│       │   ├── app.ts            # Configured Express application instance (exported for tests)
│       │   └── server.ts         # Server entry point (HTTP listen and graceful shutdown)
│       └── tests/                # Automated API integration tests (Vitest + Supertest)
│
├── packages/
│   ├── design-tokens/            # Semantic CSS custom properties and themes (Light & Dark)
│   │   └── src/
│   │       ├── tokens.css        # Spacing scales, typography, radii, elevation shadows, motion
│   │       ├── theme-light.css   # Semantic Light Theme color definitions
│   │       ├── theme-dark.css    # Semantic Dark Theme color definitions
│   │       └── index.css         # Aggregated package entry point
│   │
│   ├── editor-core/              # Pure domain logic for graphics editing (Pure TypeScript)
│   │   ├── src/
│   │   │   ├── document/         # Models for DesignDocument, DesignPage, GraphicElement, Presets
│   │   │   ├── commands/         # Immutable editing command definitions
│   │   │   ├── history/          # Bidirectional undo/redo history snapshots
│   │   │   ├── math/             # Pure coordinate transformations, rulers, guides, snapping
│   │   │   ├── serialization/    # Schema-versioned JSON serialization and validation
│   │   │   └── index.ts          # Public package API
│   │   └── tests/                # Pure domain unit tests
│   │
│   └── shared-types/             # TypeScript contracts shared across all workspaces
│       └── src/
│           └── index.ts
│
├── .agents/                      # Google Antigravity agent customizations
│   ├── rules/                    # Contextual governance rules
│   └── skills/                   # Operational project skills (SKILL.md)
│
├── docs/                         # Engineering and product documentation
│   ├── apple-design/             # Apple HIG research, design guidelines, and licensing
│   ├── architecture/             # Architecture overviews, policies, and ADRs (decisions/)
│   ├── development/              # Environment setup, CLI commands, testing, troubleshooting
│   └── product/                  # Vision statement, scope, and MVP roadmap
│
├── scripts/                      # Developer workflow orchestration scripts
└── .github/workflows/ci.yml      # Continuous Integration quality gate (GitHub Actions)
```
