# Scope of Evolution and MVP Roadmap (`mvp.md`)

This document defines the delivered features and the progressive development roadmap toward the full production-grade MVP.

---

## 1. Core Architecture and Delivered Features

- Modular npm Workspaces monorepo (`apps/web`, `apps/api`, `packages/design-tokens`, `packages/editor-core`, `packages/shared-types`).
- Apple HIG research and 100% open-source, web-compliant asset licensing governance.
- 8 specialized operational agent skills (`.agents/skills/*/SKILL.md`) and permanent repository rules (`AGENTS.md`).
- Multi-theme Design System with semantic CSS tokens, complete Light/Dark parity, and Apple-inspired glass materials.
- High-performance Studio interface: Top Control Bar, Collapsible Side Navigation, Infinite Canvas Stage (with isolated Fabric.js engine adapter and clean lifecycle management), and Property Inspector.
- Pure TypeScript `@pencel/editor-core` domain models: documents, artboard pages, graphic elements (text, vector shapes, images, paths), preset catalogs, and schema-versioned JSON serialization.
- Autonomous AI Layout Generator with multi-provider Bring Your Own Key (BYOK) support (Google Gemini, Anthropic Claude, OpenAI, DeepSeek).
- Camera Raw photo adjustments (non-destructive brightness, contrast, saturation, hue, blur, noise, pixelate).
- In-browser and API-assisted background removal.
- Standalone Express 5 API with environment validation, health check `/api/v1/health`, rate limiting, defensive security headers, and media proxy endpoints.
- Full automated test suite (Vitest), linter (ESLint 9), formatter (Prettier), and automated CI quality gate (GitHub Actions).

---

## 2. Progressive Product Roadmap

- **Milestone 1 — Real-time Vector Enhancements:** Advanced Bézier curve editing, pen tool refinements, boolean shape operations (union, subtract, intersect).
- **Milestone 2 — Advanced Typography & OpenType:** Web-safe font pairings, tracking/kerning, variable font axes, and curved text paths.
- **Milestone 3 — Production Cloud Persistence & Collaboration:** Optional database sync (PostgreSQL/Supabase), collaborative sessions via WebSockets / CRDTs, and cloud asset storage (S3/R2).
- **Milestone 4 — High-Resolution Vector Export:** Multi-format export engine supporting high-DPI rasterization (1x, 2x, 3x PNG/JPEG), vector SVG, and print-ready CMYK PDF.
