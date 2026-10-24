import type {
  Dimensions,
  DocumentId,
  ElementId,
  PageId,
  Position,
  PresetId,
} from '@pencel/shared-types';

/**
 * Supported graphic element kinds in the Pencel document model.
 */
export type ElementKind = 'text' | 'shape' | 'image';

/**
 * Supported vector shape primitives.
 */
export type ShapeVariant =
  | 'rectangle'
  | 'rounded-rectangle'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'polygon'
  | 'star'
  | 'pill'
  | 'line'
  | 'path';

/**
 * Non-destructive Layer Mask metadata (Parte VII).
 */
export interface LayerMaskMetadata {
  readonly enabled: boolean;
  readonly inverted: boolean;
  readonly linked: boolean;
  readonly maskType: 'vector' | 'raster';
  readonly shape?: 'rectangle' | 'circle' | 'ellipse' | 'rounded';
  readonly featherPx?: number;
}

/**
 * Non-destructive Crop / Object Clipping region in local coordinates (Parte VI).
 */
export interface CropMetadata {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly aspectRatio?: 'free' | '1:1' | '4:3' | '16:9' | '9:16';
}

/**
 * Architectural separation for the Text Engine (Parte IV):
 * 1. TextContent (UTF-8 string & character ranges)
 * 2. TextStyle (Font family, weight, style, size, tracking, leading, decoration, fill/stroke)
 * 3. TextLayout (Point vs Area box mode, alignment, wrapping, bounding metrics)
 * 4. TextTransform (Position, scale, rotation, skew)
 * 5. TextRendering (Subpixel/antialiased vector glyph rendering hints)
 */
export interface TextContentModel {
  readonly rawText: string;
}

export interface TextStyleModel {
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly fontWeight: 400 | 500 | 600 | 700 | 'normal' | 'bold';
  readonly fontStyle?: 'normal' | 'italic';
  readonly underline?: boolean;
  readonly linethrough?: boolean;
  readonly charSpacing?: number;
  readonly lineHeight: number;
  readonly fill: string;
  readonly strokeColor?: string;
  readonly strokeWidth?: number;
}

export interface TextLayoutModel {
  readonly boxMode: 'point' | 'area';
  readonly textAlign: 'left' | 'center' | 'right' | 'justify';
  readonly width: number;
  readonly height: number;
}

export interface TextTransformModel {
  readonly x: number;
  readonly y: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly rotationDegrees: number;
}

export interface TextRenderingModel {
  readonly vectorPreserved: boolean;
  readonly editableInline: boolean;
}

/**
 * Common visual styling properties applicable to graphic elements.
 */
export interface VisualStyleProperties {
  readonly opacity: number;
  readonly fill: string;
  readonly strokeColor?: string;
  readonly strokeWidth?: number;
  readonly cornerRadius?: number;
}

/**
 * Layer ordering and interaction lock metadata for an element.
 */
export interface LayerMetadata {
  readonly name: string;
  readonly zIndex: number;
  readonly visible: boolean;
  readonly locked: boolean;
}

/**
 * Base contract shared by all graphic elements on a page.
 */
export interface BaseGraphicElement {
  readonly id: ElementId;
  readonly kind: ElementKind;
  readonly position: Position;
  readonly dimensions: Dimensions;
  readonly rotationDegrees: number;
  readonly style: VisualStyleProperties;
  readonly layer: LayerMetadata;
}

/**
 * Typography-specific element model.
 */
export interface TextElement extends BaseGraphicElement {
  readonly kind: 'text';
  readonly content: string;
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly fontWeight: 400 | 500 | 600 | 700;
  readonly textAlign: 'left' | 'center' | 'right';
  readonly lineHeight: number;
}

/**
 * Vector shape element model.
 */
export interface ShapeElement extends BaseGraphicElement {
  readonly kind: 'shape';
  readonly shapeVariant: ShapeVariant;
}

/**
 * Raster or SVG image element model.
 */
export interface ImageElement extends BaseGraphicElement {
  readonly kind: 'image';
  readonly src: string;
  readonly altText: string;
  readonly naturalDimensions?: Dimensions;
}

/**
 * Discriminated union of all graphic elements supported by `@pencel/editor-core`.
 */
export type GraphicElement = TextElement | ShapeElement | ImageElement;

/**
 * A single artboard/page within a design document.
 */
export interface DesignPage {
  readonly id: PageId;
  readonly name: string;
  readonly dimensions: Dimensions;
  readonly backgroundColor: string;
  readonly elements: readonly GraphicElement[];
}

/**
 * Root conceptual model of an editable Pencel design document.
 */
export interface DesignDocument {
  readonly id: DocumentId;
  readonly title: string;
  readonly presetId: PresetId;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly activePageId: PageId;
  readonly pages: readonly DesignPage[];
}
