import { describe, expect, it } from 'vitest';
import {
  CURRENT_DOCUMENT_SCHEMA_VERSION,
  DOCUMENT_FORMAT_PRESETS,
  addPageToDocument,
  createEmptyDocument,
  createInitialHistorySnapshot,
  deletePageFromDocument,
  deserializeDocument,
  duplicateActivePage,
  getActivePage,
  getDocumentPresetById,
  renamePageInDocument,
  serializeDocument,
  setActivePageInDocument,
  updateActivePageBackground,
  updateActivePageDimensions,
  updateDocumentPreset,
} from '../src/index.js';

describe('@pencel/editor-core domain foundation', () => {
  it('creates an empty document with default Instagram Post dimensions (1080x1080)', () => {
    const doc = createEmptyDocument({ nowIso: '2026-10-21T00:00:00.000Z' });
    const activePage = getActivePage(doc);

    expect(doc.presetId).toBe('instagram-post');
    expect(doc.pages).toHaveLength(1);
    expect(activePage.dimensions).toEqual({ width: 1080, height: 1080 });
    expect(activePage.backgroundColor).toBe('#FFFFFF');
    expect(activePage.elements).toEqual([]);
  });

  it('switches format presets and updates active page dimensions immutably', () => {
    const initial = createEmptyDocument();
    const updated = updateDocumentPreset(initial, 'instagram-story', '2026-10-21T01:00:00.000Z');

    expect(updated.presetId).toBe('instagram-story');
    expect(getActivePage(updated).dimensions).toEqual({ width: 1080, height: 1920 });
    expect(getActivePage(initial).dimensions).toEqual({ width: 1080, height: 1080 });
  });

  it('clamps custom page dimensions within safe bounds and updates page background', () => {
    const initial = createEmptyDocument();
    const resized = updateActivePageDimensions(initial, { width: 1200, height: 628 });
    const recolored = updateActivePageBackground(resized, '#F5F5F7');

    expect(getActivePage(recolored).dimensions).toEqual({ width: 1200, height: 628 });
    expect(getActivePage(recolored).backgroundColor).toBe('#F5F5F7');
  });

  it('provides all expected format presets and initializes history snapshot', () => {
    expect(DOCUMENT_FORMAT_PRESETS.length).toBeGreaterThanOrEqual(5);
    expect(getDocumentPresetById('event-flyer').dimensions).toEqual({
      width: 1200,
      height: 1600,
    });

    const doc = createEmptyDocument();
    const history = createInitialHistorySnapshot(doc);
    expect(history.past).toHaveLength(0);
    expect(history.present).toBe(doc);
    expect(history.future).toHaveLength(0);
  });

  it('supports multi-page workflow: addPage, duplicatePage, deletePage, and setActivePage', () => {
    const doc = createEmptyDocument();
    expect(doc.pages).toHaveLength(1);

    const withSecondPage = addPageToDocument(doc, { name: 'Página 2' });
    expect(withSecondPage.pages).toHaveLength(2);
    expect(withSecondPage.activePageId).toBe(withSecondPage.pages[1]!.id);
    expect(getActivePage(withSecondPage).name).toBe('Página 2');

    const withRenamed = renamePageInDocument(
      withSecondPage,
      withSecondPage.pages[1]!.id,
      'Capa Principal',
    );
    expect(withRenamed.pages[1]!.name).toBe('Capa Principal');

    const duplicated = duplicateActivePage(withRenamed);
    expect(duplicated.pages).toHaveLength(3);
    expect(getActivePage(duplicated).name).toBe('Capa Principal (Copy)');

    const switchedBack = setActivePageInDocument(duplicated, doc.pages[0]!.id);
    expect(switchedBack.activePageId).toBe(doc.pages[0]!.id);

    const withDeleted = deletePageFromDocument(switchedBack, doc.pages[0]!.id);
    expect(withDeleted.pages).toHaveLength(2);
    expect(withDeleted.activePageId).toBe(withDeleted.pages[0]!.id);

    // Cannot delete the only remaining page
    const singleDoc = createEmptyDocument();
    const cantDelete = deletePageFromDocument(singleDoc, singleDoc.pages[0]!.id);
    expect(cantDelete.pages).toHaveLength(1);
  });

  it('serializes and deserializes a valid document envelope and rejects invalid schemas', () => {
    const doc = createEmptyDocument({ title: 'Campanha Outono' });
    const raw = serializeDocument(doc, '2026-10-21T02:00:00.000Z');
    const restored = deserializeDocument(raw);

    expect(restored.schemaVersion).toBe(CURRENT_DOCUMENT_SCHEMA_VERSION);
    expect(restored.document.title).toBe('Campanha Outono');
    expect(() => deserializeDocument('{"schemaVersion": 999}')).toThrow(
      /Unsupported document schemaVersion/,
    );
  });
});
