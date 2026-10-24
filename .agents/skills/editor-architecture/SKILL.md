---
name: editor-architecture
description: >-
  Use this skill when designing or modifying the graphic editor domain model,
  commands, history, serialization, or Fabric.js canvas engine adapter. Enforces
  strict separation between @pencel/editor-core, React UI state, and the canvas
  rendering engine.
---

# Editor Architecture

Use this skill whenever working on `packages/editor-core/`, `packages/shared-types/`, or `apps/web/src/features/editor/`.

## Activation Criteria

- Modifying document models, pages, elements (text, image, shape), or serialization in `@pencel/editor-core`.
- Implementing or updating the Fabric.js adapter in `apps/web/src/features/editor/engine/`.
- Adding editor state management, selection handling, or commands.

## Operational Procedure

1. **Enforce Strict Package Dependency Direction**
   - `@pencel/shared-types` → zero workspace dependencies.
   - `@pencel/editor-core` → depends only on `@pencel/shared-types`. **Never** import React, DOM globals, or `fabric` inside `@pencel/editor-core`.
   - `apps/web` → consumes `@pencel/editor-core`, `@pencel/shared-types`, and `@pencel/design-tokens`.
   - `apps/api` → consumes `@pencel/shared-types` (and `@pencel/editor-core` if validating documents).
   - Circular dependencies between packages or feature modules are strictly forbidden.

2. **Maintain the Five-Layer Separation (See [`docs/architecture/editor-architecture.md`](../../../docs/architecture/editor-architecture.md))**
   - **Document Model (`@pencel/editor-core/document`):** Pure TypeScript representation of pages, dimensions, layers, and elements.
   - **UI State (`features/editor/state`):** Active sidebar tab, current zoom factor, theme, and panel visibility.
   - **Selection State (`features/editor/state`):** Currently selected element IDs and active tool mode.
   - **Canvas Engine Adapter (`features/editor/engine`):** Isolated bridge that mounts/disposes the `fabric.Canvas` instance and translates between the domain model and Fabric objects.
   - **Persistence Format (`@pencel/editor-core/serialization`):** Versioned JSON schema for saving/loading documents.

3. **No Fake Features**
   - Do not claim that undo/redo, grouping, drag-and-drop, or export are complete until their command execution and unit tests are genuinely implemented.

## Verification Checklist

- [ ] `packages/editor-core` compiles and passes Vitest tests in a pure Node environment without DOM or React dependencies.
- [ ] `fabric` imports are confined exclusively to `apps/web/src/features/editor/engine/`.
- [ ] Architectural changes with lasting impact are recorded as an ADR in `docs/architecture/decisions/`.
