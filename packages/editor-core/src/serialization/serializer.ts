import type { DesignDocument } from '../document/types.js';

export const CURRENT_DOCUMENT_SCHEMA_VERSION = 1 as const;

/**
 * Versioned persistence envelope for saving and loading Pencel documents.
 */
export interface SerializedDocumentEnvelope {
  readonly schemaVersion: typeof CURRENT_DOCUMENT_SCHEMA_VERSION;
  readonly exportedAt: string;
  readonly document: DesignDocument;
}

/**
 * Serializes a `DesignDocument` into a formatted JSON string with version metadata.
 */
export function serializeDocument(
  document: DesignDocument,
  exportedAt: string = new Date().toISOString(),
): string {
  const envelope: SerializedDocumentEnvelope = {
    schemaVersion: CURRENT_DOCUMENT_SCHEMA_VERSION,
    exportedAt,
    document,
  };
  return JSON.stringify(envelope, null, 2);
}

/**
 * Parses and validates a serialized document JSON string.
 */
export function deserializeDocument(rawJson: string): SerializedDocumentEnvelope {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('Invalid JSON payload provided to deserializeDocument.');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Serialized document payload must be a JSON object.');
  }

  const record = parsed as Record<string, unknown>;
  if (record.schemaVersion !== CURRENT_DOCUMENT_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported document schemaVersion: "${String(record.schemaVersion)}". Expected ${CURRENT_DOCUMENT_SCHEMA_VERSION}.`,
    );
  }

  const doc = record.document as Record<string, unknown> | undefined;
  if (
    typeof doc !== 'object' ||
    doc === null ||
    typeof doc.id !== 'string' ||
    typeof doc.title !== 'string' ||
    !Array.isArray(doc.pages) ||
    doc.pages.length === 0
  ) {
    throw new Error('Serialized document is missing required structural fields.');
  }

  return parsed as SerializedDocumentEnvelope;
}
