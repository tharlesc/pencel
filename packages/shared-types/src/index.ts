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
