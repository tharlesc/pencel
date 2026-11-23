# ADR-0032: Graphic Design Knowledge Engine & Social-First Creative Synthesis

- **Status:** Accepted
- **Date:** 2026-11-21
- **Context:** ADR-0031 introduced multi-provider AI creative generation, variations, and iterative refinement. However, real-world testing showed that both external LLMs and the local parametric engine defaulted to SaaS / website hero clichés (floating rounded cards, HTML-style pill buttons, multi-chip UI grids) instead of human-crafted graphic design for social media posts, carousels, posters, and product visuals.

## Decision

Introduce a deterministic **Graphic Design Knowledge Engine** (`apps/api/src/modules/ai/ai.designKnowledge.ts`) that bridges every user request with formal graphic design theory before calling either an LLM or the Local Parametric Studio Engine:

1. **Theoretical Grounding (Research Corpus):**
   - **Form Follows Message & Essential Simplicity** (Santos & Claudino; John Maeda's Law 10: subtract the obvious and add the meaningful).
   - **Social Media 2D Post Criteria** (Oliveira & Coutinho, 2021, UEMG): warm/appetizing color psychology and Pedrosa's 4 functions of color (attract, hold, inform, aid memory), Gestalt _pregnância_ (Gomes Filho), visible and invisible lines/underlines for emphasis, depth/layering, and tight product framing.
   - **Contemporary Graphic Design Grammar** (Bomeny, 2009, FAUUSP): Swiss mathematical grid (Josef Müller-Brockmann, Karl Gerstner), Figure/Ground & active negative space (Armin Hofmann, Emil Ruder), Jan Tschichold's 5 principles (tracked uppercase micro-labels, harmonious 2-font limit), Wolfgang Weingart's Triple Typographic Dimension (Syntactic, Semantic, Pragmatic), Tibor Kalman's nuance over cliché, and David Jury's conscious rule-breaking.

2. **Deterministic Request-to-Art-Direction Pipeline:**
   - `analyzeDesignBrief(options)` classifies the request into 9 graphic domains (`food-gastronomy`, `retail-promo`, `culture-event`, `education-carousel`, `fashion-luxury`, `wellness-organic`, `editorial-quote`, `tech-product`, `web-banner`) and 7 piece types (`social-post`, `carousel-slide`, `story-poster`, `promo-flyer`, `editorial-quote`, `product-showcase`, `web-banner`).
   - `computeGraphicGrid()` computes exact pixel Swiss column coordinates, gutters, margins, Golden Section focal points, proportional typography scales, and Instagram 9:16 mobile safe zones (`safeTop = 12%`, `safeBottom = 85%`).
   - `ai.prompts.ts` injects the computed grid math, color psychology, typographic voice, and an explicit **Anti-Website-UI rule** whenever `!blueprint.isWebInterface` (switching cleanly to Web Banner mode only when `pieceType === 'web-banner'` or a website/landing banner is explicitly requested).

3. **Authentic Social Graphic Compositions & Canvas Capabilities:**
   - Added 4 social-first composition archetypes in `apps/api/src/modules/ai/ai.socialCompositions.ts`: `poster-impact`, `swiss-editorial`, `carousel-cover`, and `product-spotlight`.
   - Extended `CanvasLayoutElementDto`, `ai.postprocess.ts`, `generatedLayoutEngine.ts`, `layoutSnapshotEngine.ts`, and `LayoutPreviewCard.tsx` to support editorial highlighter bars (`textBackgroundColor`), hollow outlined poster typography (`fill: 'transparent'` + `stroke` + `strokeWidth`), low-opacity architectural watermarks (`opacity <= 0.22`), and 9:16 Story safe-zone clamping.
   - Added `pieceType` selector and an **Art Direction Applied** summary card (`ArtDirectionSummaryDto`) in `AiGeneratorPanel` so users see exactly which grid, typographic voice, and Gestalt principles shaped their piece.

## Consequences

- **Positive:** Both LLM-generated and local studio creatives adopt real graphic design hierarchy (full-bleed color/photo planes, Swiss hairline grids, active negative space, visible underline accents, marker strips, rotated seals, and natural social footers) while preserving Web Banner support on demand.
- **Positive:** Users can inspect and steer both Piece Type and Composition directly from the sidebar without writing prompt engineering jargon.
- **Trade-offs:** Adds one pure-TypeScript knowledge module (`ai.designKnowledge.ts`) and one social composition module (`ai.socialCompositions.ts`) with zero new runtime dependencies.
