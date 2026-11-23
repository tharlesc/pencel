# ADR 0031 - AI Creative Studio v2: Unified Art Direction, Rich Canvas Primitives, Variations, and Iterative Refinement

## Status

Approved / Implemented

## Context

Pencel's initial AI layout generator (ADRs 0024-0027) proved end-to-end BYOK layout synthesis across Gemini, Claude, OpenAI, and DeepSeek, but had structural limitations that capped creative quality and workflow velocity:

1. **Inconsistent & Minimal Prompting:** OpenAI and DeepSeek did not receive the full JSON element schema, and none of the providers received aspect-ratio safe zones, curated Google Font pairings, typographic rhythm rules, or WCAG contrast constraints.
2. **Limited Graphic Primitives:** Layouts were restricted to 4 flat primitives (`rect`, `circle`, `triangle`, `textbox`) with no gradients, drop shadows, rotations, lines, polygons/stars, SVG paths, photographic frames, `lineHeight`, `charSpacing`, or dynamic web-font preloading. Numeric weights (`300`-`900`) were flattened to `'bold' | 'normal'`.
3. **No Geometry or Contrast Guardrails:** Raw LLM output was applied directly without clamping textboxes into artboard safe zones, resolving vertical text collisions, or auditing WCAG contrast against underlying surfaces.
4. **One-Shot Destructive Workflow:** Every generation wiped the artboard with a single concept, offering no multi-concept exploration (variations), no structured creative brief overrides (exact headline, CTA, brand handle, brand accent color, supporting photography), no non-destructive new-artboard destination, and no iterative canvas refinement ("Refine current").

## Architectural Decisions

### 1. Shared Contracts in `@pencel/shared-types`

Consolidated all AI creative DTOs (`AiProvider`, `LayoutStyleTheme`, `LayoutCompositionArchetype`, `LayoutGradientSpec`, `LayoutShadowSpec`, `CanvasLayoutElementDto`, `CreativeBriefInput`, `GeneratedLayoutDto`, `GenerateLayoutOptions`, `GenerateLayoutResponse`) into `packages/shared-types/src/index.ts`, re-exported by `@pencel/api` and `@pencel/web` for strict compile-time parity.

### 2. Modular Backend AI Pipeline (`apps/api/src/modules/ai/`)

Decomposed the monolithic AI service into four focused modules:

- **`ai.prompts.ts`:** Unified Art Director prompt builder shared by Gemini, OpenAI, Claude, and DeepSeek, with aspect-ratio classification (`square`, `portrait`, `landscape`, `slim-banner`), Pencel curated Google Font pairings, composition archetype rules, brief overrides, iterative refinement context, and multi-variation generation.
- **`ai.postprocess.ts`:** Resilient JSON cleaner (trailing comma repair), full element normalizer (preserving numeric font weights `300`-`900`, gradients, shadows, angles, polygons, paths, and image slots), safe-zone clamping, vertical text anti-collision pass, and automated WCAG 2.1 contrast auditing/repair against underlying surfaces.
- **`ai.autonomous.ts`:** Upgraded Parametric Creative Studio Engine featuring 7 curated styles (`tech`, `promo`, `minimal`, `editorial`, `elegant`, `vibrant`, `organic`), 5 distinct aspect-ratio-adaptive archetypes (`framed-card`, `editorial-split`, `bold-typo`, `hero-bento`, `photo-overlay`), multilingual copy inference (EN/PT/ES), multi-variation synthesis, and local refinement support.
- **`ai.service.ts` & `ai.routes.ts`:** Unified provider orchestration with reasoning-model parameter safety (`o3-mini`, `deepseek-reasoner`), explicit Gemini `thinkingConfig` control (`thinkingBudget: 0` on Flash 2.5 / `512` on Pro 2.5 / `thinkingLevel: 'minimal'` on Gemini 3.x) to prevent silent reasoning timeouts (`AbortError`), lazy filtered model discovery with automatic timeout/quota fallback across Gemini tiers, non-thought response part extraction, optional server-side Unsplash/Pexels stock photo enrichment for `image` layers, explicit `useLocalEngine` support, and strict payload validation.

### 3. Upgraded Fabric.js Engine (`apps/web/src/features/editor/engine/generatedLayoutEngine.ts`)

- Dynamically preloads Google WebFonts via `fontLoaderService` before rendering textboxes.
- Materializes `backgroundGradient` as an editable full-bleed Fabric gradient layer and renders all 9 element types (`rect`, `circle`, `ellipse`, `triangle`, `line`, `polygon`, `path`, `textbox`, `image`) with multi-stop `Gradient`, `Shadow`, rotation `angle`, `lineHeight`, `charSpacing`, `fontStyle`, and rounded `clipPath` cover-fitted photography (auto-resolved via `searchPublicMedia` when `imageUrl` is absent, with a graceful card fallback).
- Added `extractLayoutSnapshotFromCanvas` (exposed via `FabricCanvasAdapter.exportLayoutSnapshot` and `useCanvasEngine().getLayoutSnapshot`) so users can iteratively refine any active artboard.

### 4. Operate-Mode Creative Studio Panel (`AiGeneratorPanel`)

- Added artboard format ratio badge (`tabular-nums`), Create vs. Refine segmented switch, visual palette swatch dots across 7 aesthetic styles, composition archetype selector, `1 concept` vs `3 variations` switch, collapsible Creative Brief drawer, AbortController cancellation, live proportional SVG miniature `LayoutPreviewCard` gallery, non-destructive "Send to new artboard" action, session history strip, and explicit Local Parametric Studio toggle when no API key is set.
- All styling remains 100% tokenized in `@pencel/design-tokens` with zero hex/rgb/px literals in CSS Modules and complete EN/PT/ES i18n parity.

## Consequences

- Creative outputs achieve dramatically higher visual craft, typographic fidelity, and WCAG legibility across both external LLMs and the built-in local studio engine.
- Designers can explore 3 distinct creative concepts side-by-side, switch between them non-destructively, send favorites to new artboards, and iteratively refine existing canvas designs.
- All monorepo boundaries, strict TypeScript checks, CSS token invariants, and automated tests remain intact and expanded.
