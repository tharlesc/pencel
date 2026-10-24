import type { DesignDocument } from '../document/types.js';

/**
 * Conceptual state structure for future undo/redo history management.
 */
export interface DocumentHistorySnapshot {
  readonly past: readonly DesignDocument[];
  readonly present: DesignDocument;
  readonly future: readonly DesignDocument[];
}

/**
 * Initializes a baseline history container with an empty past and future stack.
 */
export function createInitialHistorySnapshot(document: DesignDocument): DocumentHistorySnapshot {
  return {
    past: [],
    present: document,
    future: [],
  };
}
