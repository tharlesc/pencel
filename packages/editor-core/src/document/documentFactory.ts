import type { Dimensions, PresetId } from '@pencel/shared-types';
import { getDocumentPresetById } from './presets.js';
import type { DesignDocument, DesignPage } from './types.js';

export interface CreateDocumentOptions {
  readonly id?: string;
  readonly title?: string;
  readonly presetId?: PresetId;
  readonly backgroundColor?: string;
  readonly nowIso?: string;
}

/**
 * Creates a clean initial `DesignDocument` ready to be loaded into the editor workspace.
 */
export function createEmptyDocument(options: CreateDocumentOptions = {}): DesignDocument {
  const presetId: PresetId = options.presetId ?? 'instagram-post';
  const preset = getDocumentPresetById(presetId);
  const timestamp = options.nowIso ?? new Date().toISOString();
  const pageId = 'page-1';

  const initialPage: DesignPage = {
    id: pageId,
    name: 'Página 1',
    dimensions: {
      width: preset.dimensions.width,
      height: preset.dimensions.height,
    },
    backgroundColor: options.backgroundColor ?? '#FFFFFF',
    elements: [],
  };

  return {
    id: options.id ?? 'doc-initial',
    title: options.title ?? `${preset.name} sem título`,
    presetId,
    createdAt: timestamp,
    updatedAt: timestamp,
    activePageId: pageId,
    pages: [initialPage],
  };
}

/**
 * Returns the currently active `DesignPage` from a document.
 */
export function getActivePage(document: DesignDocument): DesignPage {
  const active = document.pages.find((page) => page.id === document.activePageId);
  if (active) {
    return active;
  }
  const firstPage = document.pages[0];
  if (!firstPage) {
    throw new Error(`Document "${document.id}" contains no pages.`);
  }
  return firstPage;
}

/**
 * Pure helper to update the active page's dimensions and preset reference.
 */
export function updateDocumentPreset(
  document: DesignDocument,
  presetId: PresetId,
  nowIso: string = new Date().toISOString(),
): DesignDocument {
  const preset = getDocumentPresetById(presetId);
  return updateActivePageDimensions(document, preset.dimensions, presetId, nowIso);
}

/**
 * Pure helper to update the active page's pixel dimensions.
 */
export function updateActivePageDimensions(
  document: DesignDocument,
  dimensions: Dimensions,
  presetId: PresetId = document.presetId,
  nowIso: string = new Date().toISOString(),
): DesignDocument {
  const clampedWidth = Math.max(64, Math.min(8000, Math.round(dimensions.width)));
  const clampedHeight = Math.max(64, Math.min(8000, Math.round(dimensions.height)));

  return {
    ...document,
    presetId,
    updatedAt: nowIso,
    pages: document.pages.map((page) =>
      page.id === document.activePageId
        ? {
            ...page,
            dimensions: { width: clampedWidth, height: clampedHeight },
          }
        : page,
    ),
  };
}

/**
 * Pure helper to update the active page's background color.
 */
export function updateActivePageBackground(
  document: DesignDocument,
  backgroundColor: string,
  nowIso: string = new Date().toISOString(),
): DesignDocument {
  return {
    ...document,
    updatedAt: nowIso,
    pages: document.pages.map((page) =>
      page.id === document.activePageId
        ? {
            ...page,
            backgroundColor,
          }
        : page,
    ),
  };
}

/**
 * Adds a new page/artboard to the document and makes it the active page.
 */
export function addPageToDocument(
  document: DesignDocument,
  options?: {
    name?: string;
    dimensions?: Dimensions;
    backgroundColor?: string;
  },
  nowIso: string = new Date().toISOString(),
): DesignDocument {
  const pageNumber = document.pages.length + 1;
  const newPageId = `page-${Date.now()}-${pageNumber}`;
  const active = getActivePage(document);

  const newPage: DesignPage = {
    id: newPageId,
    name: options?.name ?? `Página ${pageNumber}`,
    dimensions: options?.dimensions ?? {
      width: active.dimensions.width,
      height: active.dimensions.height,
    },
    backgroundColor: options?.backgroundColor ?? '#FFFFFF',
    elements: [],
  };

  return {
    ...document,
    updatedAt: nowIso,
    activePageId: newPageId,
    pages: [...document.pages, newPage],
  };
}

/**
 * Clones the active page/artboard and inserts it immediately after the active page.
 */
export function duplicateActivePage(
  document: DesignDocument,
  nowIso: string = new Date().toISOString(),
): DesignDocument {
  const activeIndex = document.pages.findIndex((p) => p.id === document.activePageId);
  const active = activeIndex >= 0 ? document.pages[activeIndex]! : getActivePage(document);

  const pageNumber = document.pages.length + 1;
  const newPageId = `page-${Date.now()}-${pageNumber}`;

  const duplicatedPage: DesignPage = {
    ...active,
    id: newPageId,
    name: `${active.name} (Cópia)`,
    elements: active.elements.map((el) => ({
      ...el,
      id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    })),
  };

  const nextPages = [...document.pages];
  const insertionIndex = activeIndex >= 0 ? activeIndex + 1 : nextPages.length;
  nextPages.splice(insertionIndex, 0, duplicatedPage);

  return {
    ...document,
    updatedAt: nowIso,
    activePageId: newPageId,
    pages: nextPages,
  };
}

/**
 * Deletes a page/artboard from the document.
 * Documents must have at least one page.
 */
export function deletePageFromDocument(
  document: DesignDocument,
  pageId: string,
  nowIso: string = new Date().toISOString(),
): DesignDocument {
  if (document.pages.length <= 1) {
    return document;
  }

  const nextPages = document.pages.filter((p) => p.id !== pageId);
  const nextActiveId =
    document.activePageId === pageId ? (nextPages[0]?.id ?? 'page-1') : document.activePageId;

  return {
    ...document,
    updatedAt: nowIso,
    activePageId: nextActiveId,
    pages: nextPages,
  };
}

/**
 * Sets the active page/artboard in the document.
 */
export function setActivePageInDocument(
  document: DesignDocument,
  pageId: string,
  nowIso: string = new Date().toISOString(),
): DesignDocument {
  if (!document.pages.some((p) => p.id === pageId)) {
    return document;
  }

  return {
    ...document,
    updatedAt: nowIso,
    activePageId: pageId,
  };
}
