/**
 * Branded or semantic identifiers used across the Pencel domain.
 */
export type DocumentId = string;
export type PageId = string;
export type ElementId = string;
export type PresetId =
  'instagram-post' | 'instagram-story' | 'web-banner' | 'event-flyer' | 'ad-leaderboard';

/**
 * 2D Cartesian dimensions in pixels.
 */
export interface Dimensions {
  readonly width: number;
  readonly height: number;
}

/**
 * 2D Cartesian position in pixels relative to the page origin (top-left).
 */
export interface Position {
  readonly x: number;
  readonly y: number;
}

/**
 * Standard format preset definition for new graphic documents.
 */
export interface DocumentFormatPreset {
  readonly id: PresetId;
  readonly name: string;
  readonly category: 'social' | 'marketing' | 'print-digital';
  readonly description: string;
  readonly dimensions: Dimensions;
}

/**
 * Health check response contract returned by `@pencel/api`.
 */
export interface HealthCheckResponse {
  readonly status: 'ok';
  readonly service: '@pencel/api';
  readonly version: string;
  readonly environment: 'development' | 'test' | 'production';
  readonly timestamp: string;
  readonly uptimeSeconds: number;
}

/**
 * Standardized API error response envelope.
 */
export interface ApiErrorResponse {
  readonly status: 'error';
  readonly code: string;
  readonly message: string;
}

/**
 * Supported external AI providers for creative generation (BYOK and server-side).
 */
export type AiProvider = 'gemini' | 'openai' | 'claude' | 'deepseek';

/**
 * Aesthetic style directions supported by Pencel AI Creative Studio.
 */
export type LayoutStyleTheme =
  'tech' | 'promo' | 'minimal' | 'elegant' | 'vibrant' | 'editorial' | 'organic' | 'bold' | 'dark';

/**
 * Structural layout archetypes controlling creative visual composition.
 */
export type LayoutCompositionArchetype =
  | 'auto'
  | 'poster-impact'
  | 'swiss-editorial'
  | 'carousel-cover'
  | 'product-spotlight'
  | 'photo-overlay'
  | 'editorial-split'
  | 'bold-typo'
  | 'framed-card'
  | 'hero-bento';

/**
 * Graphic piece format guiding domain composition rules (social media posts vs web banners).
 */
export type CreativePieceType =
  | 'auto'
  | 'social-post'
  | 'carousel-slide'
  | 'story-poster'
  | 'promo-flyer'
  | 'editorial-quote'
  | 'product-showcase'
  | 'web-banner';

/**
 * Distilled graphic design principles applied to a generated creative.
 */
export interface ArtDirectionSummaryDto {
  readonly domain: string;
  readonly pieceType: Exclude<CreativePieceType, 'auto'>;
  readonly gridSystem: string;
  readonly colorPsychology: string;
  readonly gestaltPrinciple: string;
  readonly typographyVoice: string;
}

/**
 * Creative generation mode: create a fresh design or iteratively refine the active artboard.
 */
export type LayoutGenerationMode = 'create' | 'refine';

/**
 * Color stop inside a linear or radial gradient specification.
 */
export interface LayoutGradientStop {
  readonly offset: number;
  readonly color: string;
  readonly opacity?: number;
}

/**
 * Declarative gradient fill specification portable across API, SVG preview, and Fabric.js.
 */
export interface LayoutGradientSpec {
  readonly type: 'linear' | 'radial';
  readonly angle?: number;
  readonly stops: readonly LayoutGradientStop[];
}

/**
 * Declarative drop-shadow / glow specification for cards, badges, and display typography.
 */
export interface LayoutShadowSpec {
  readonly color: string;
  readonly blur: number;
  readonly offsetX?: number;
  readonly offsetY?: number;
}

/**
 * Element types supported by the Pencel AI Creative Engine.
 */
export type CanvasLayoutElementType =
  'rect' | 'circle' | 'ellipse' | 'triangle' | 'line' | 'polygon' | 'path' | 'textbox' | 'image';

/**
 * Portable creative canvas element contract shared between `@pencel/api` and `@pencel/web`.
 */
export interface CanvasLayoutElementDto {
  readonly id: string;
  readonly type: CanvasLayoutElementType;
  readonly left: number;
  readonly top: number;
  readonly width?: number;
  readonly height?: number;
  readonly radius?: number;
  readonly rx?: number;
  readonly ry?: number;
  readonly fill?: string;
  readonly fillGradient?: LayoutGradientSpec;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly strokeDashArray?: readonly number[];
  readonly opacity?: number;
  readonly angle?: number;
  readonly shadow?: LayoutShadowSpec;
  readonly text?: string;
  readonly fontSize?: number;
  readonly fontFamily?: string;
  readonly fontWeight?: 'normal' | 'bold' | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  readonly fontStyle?: 'normal' | 'italic';
  readonly textAlign?: 'left' | 'center' | 'right' | 'justify';
  readonly lineHeight?: number;
  readonly charSpacing?: number;
  readonly textBackgroundColor?: string;
  readonly sides?: number;
  readonly isStar?: boolean;
  readonly pathData?: string;
  readonly imageQuery?: string;
  readonly imageUrl?: string;
  readonly borderRadius?: number;
  readonly objectFit?: 'cover' | 'contain';
  readonly name: string;
}

/**
 * Structured creative brief fields that steer copy, branding, and imagery.
 */
export interface CreativeBriefInput {
  readonly headline?: string;
  readonly ctaText?: string;
  readonly brandName?: string;
  readonly brandColor?: string;
  readonly includeImagery?: boolean;
  readonly language?: 'en' | 'pt' | 'es';
}

/**
 * Complete AI-generated creative layout payload ready for canvas materialization.
 */
export interface GeneratedLayoutDto {
  readonly id?: string;
  readonly title: string;
  readonly backgroundColor: string;
  readonly backgroundGradient?: LayoutGradientSpec;
  readonly archetype?: LayoutCompositionArchetype;
  readonly palette?: readonly string[];
  readonly fontsUsed?: readonly string[];
  readonly artDirection?: ArtDirectionSummaryDto;
  readonly elements: readonly CanvasLayoutElementDto[];
  readonly explanation: string;
}

/**
 * Input options for generating or refining creative layouts with AI.
 */
export interface GenerateLayoutOptions {
  readonly prompt: string;
  readonly style?: LayoutStyleTheme;
  readonly archetype?: LayoutCompositionArchetype;
  readonly pieceType?: CreativePieceType;
  readonly mode?: LayoutGenerationMode;
  readonly variationsCount?: 1 | 2 | 3;
  readonly brief?: CreativeBriefInput;
  readonly currentLayout?: GeneratedLayoutDto;
  readonly dimensions?: Dimensions;
  readonly presetId?: string;
  readonly apiKey?: string;
  readonly provider?: AiProvider;
  readonly model?: string;
  readonly useLocalEngine?: boolean;
}

/**
 * Standardized response envelope returned by `POST /api/v1/ai/generate-layout`.
 */
export interface GenerateLayoutResponse {
  readonly success: boolean;
  readonly layout?: GeneratedLayoutDto;
  readonly variations?: readonly GeneratedLayoutDto[];
  readonly source?: 'llm' | 'autonomous';
  readonly providerUsed?: string;
  readonly modelUsed?: string;
  readonly error?: string;
}
