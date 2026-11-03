# Graphic Editor Architecture (`editor-architecture.md`)

A frequent architectural flaw in web graphic editors is coupling React component state directly with mutable canvas objects (such as `fabric.Object`). This mistake makes dependable undo/redo, clean persistence, and future rendering engine migrations nearly impossible.

**Pencel** strictly separates five distinct architectural layers.

---

## 1. The Five Editor Layers

### 1.1 Document Model (`@pencel/editor-core`)

- Represents **what the design is**, independent of how it is currently rendered on screen.
- Contains `DesignDocument`, `DesignPage` (with real document dimensions such as `1080 × 1080 px` and background fill), and the ordered array of `GraphicElement` records (`TextElement`, `ShapeElement`, `ImageElement`, `PathElement`).
- Formed exclusively from immutable, serializable pure TypeScript data structures.

### 1.2 UI State (`apps/web/src/features/editor/state/`)

- Represents the transient viewport and workspace chrome configuration:
  - Active navigation tab (`templates`, `elements`, `text`, `media`, `layers`, `aiArt`, `settings`).
  - Viewport zoom ratio (`zoom`: e.g. `0.5` for 50%, `1.0` for 100%).
  - Active color theme (`light` or `dark`).
  - Floating toolbar orientation and position (`bottom` or `left`).
  - Modal and overlay visibility states.
- Changing workspace zoom or UI theme **never mutates the `DesignDocument`**.

### 1.3 Selection and Tool State (`apps/web/src/features/editor/state/`)

- Identifies the active canvas tool (`select`, `hand`, `pen`, `text`, `shape`, `eraser`) and selected element IDs (`selectedElementIds: ElementId[]`).
- Drives the contextual `InspectorPanel`, showing artboard properties when nothing is selected, and contextual typography/transform/filter controls when an element is active—all without storing raw Fabric.js instances inside React state.

### 1.4 Visual Canvas Engine (`apps/web/src/features/editor/engine/`)

- Encapsulated within `FabricCanvasAdapter`.
- Responsible for instantiating `fabric.Canvas` on the HTML `<canvas>` element, mapping physical device pixels, rendering artboard boundaries and layers, handling mouse/touch gesture transformations, and managing complete teardown (`dispose()`) upon unmount.
- No file outside `features/editor/engine/` is permitted to import `fabric`.

### 1.5 Persistence & Serialization (`@pencel/editor-core/serialization/`)

- Defines schema-versioned JSON envelopes (`schemaVersion: 1`) used for export/import, local storage backup, and future database synchronization.
- Enforces strict runtime validation upon deserialization (`deserializeDocument`) to reject corrupt or incompatible payloads before they reach the application state.
