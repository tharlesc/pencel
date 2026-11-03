import type { DesignPage } from '@pencel/editor-core';
import { useEffect, useState, type ReactElement } from 'react';
import type { UseCanvasEngineResult } from '../../hooks/useCanvasEngine.js';
import type { EditorSessionContextValue } from '../../state/editorContexts.js';
import { ArtboardThumbnailsDrawer } from '../ArtboardThumbnailsDrawer/index.js';

export interface CanvasArtboardDrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly page: DesignPage;
  readonly activePageIndex: number;
  readonly elementCount: number;
  readonly engine: UseCanvasEngineResult | null | undefined;
  readonly session: EditorSessionContextValue | null | undefined;
}

const NOOP = (): void => {};

export function CanvasArtboardDrawer({
  open,
  onClose,
  page,
  activePageIndex,
  elementCount,
  engine,
  session,
}: CanvasArtboardDrawerProps): ReactElement {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || !engine) return;
    const capture = (): void => {
      try {
        const thumb = engine.exportImage('jpeg', 0.85, 320);
        if (thumb) {
          setThumbnails((prev) => (prev[page.id] === thumb ? prev : { ...prev, [page.id]: thumb }));
        }
      } catch {
        /* ignore */
      }
    };
    capture();
    const timer = setTimeout(capture, 120);
    return () => clearTimeout(timer);
  }, [open, engine, page.id, elementCount]);

  return (
    <ArtboardThumbnailsDrawer
      open={open}
      pages={session?.document?.pages ?? [page]}
      activePageIndex={activePageIndex}
      thumbnails={thumbnails}
      onClose={onClose}
      onSelectPage={(index) => {
        const target = session?.document?.pages[index];
        if (target) session?.setActivePage(target.id);
      }}
      onAddPage={() => session?.addPage()}
      onDuplicatePage={(id) => {
        session?.setActivePage(id);
        session?.duplicatePage();
      }}
      onDeletePage={session ? (id) => session.deletePage(id) : NOOP}
      onRenamePage={session ? (id, name) => session.renamePage(id, name) : NOOP}
    />
  );
}
