import type { DesignPage } from '@pencel/editor-core';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Button, Icon } from '../../../../components/ui/index.js';
import styles from './ArtboardThumbnailsDrawer.module.css';

export interface ArtboardThumbnailsDrawerProps {
  readonly open: boolean;
  readonly pages: readonly DesignPage[];
  readonly activePageIndex: number;
  readonly thumbnails?: Record<string, string>;
  readonly onClose: () => void;
  readonly onSelectPage: (index: number) => void;
  readonly onAddPage?: () => void;
  readonly onDuplicatePage: (pageId: string) => void;
  readonly onDeletePage: (pageId: string) => void;
  readonly onRenamePage?: (pageId: string, newName: string) => void;
}

export function ArtboardThumbnailsDrawer({
  open,
  pages,
  activePageIndex,
  thumbnails,
  onClose,
  onSelectPage,
  onDuplicatePage,
  onDeletePage,
  onRenamePage,
}: ArtboardThumbnailsDrawerProps): ReactElement | null {
  const listRef = useRef<HTMLDivElement | null>(null);
  const activeCardRef = useRef<HTMLDivElement | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [tempName, setTempName] = useState<string>('');
  const [verticalPadding, setVerticalPadding] = useState<number>(180);

  useEffect(() => {
    if (!open) return;
    const updatePadding = (): void => {
      if (!listRef.current) return;
      const h = listRef.current.clientHeight;
      const cardH = activeCardRef.current?.clientHeight || 160;
      const spacer = Math.max(24, Math.round((h - cardH) / 2));
      setVerticalPadding(spacer);
    };
    updatePadding();

    window.addEventListener('resize', updatePadding);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && listRef.current) {
      ro = new ResizeObserver(updatePadding);
      ro.observe(listRef.current);
    }

    return () => {
      window.removeEventListener('resize', updatePadding);
      ro?.disconnect();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      if (typeof activeCardRef.current?.scrollIntoView === 'function') {
        activeCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [open, activePageIndex, verticalPadding]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (editingPageId) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (activePageIndex > 0) onSelectPage(activePageIndex - 1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (activePageIndex < pages.length - 1) onSelectPage(activePageIndex + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, activePageIndex, pages.length, onClose, onSelectPage, editingPageId]);

  if (!open) return null;

  const handleStartRename = (pageId: string, currentName: string, e: React.MouseEvent): void => {
    e.stopPropagation();
    setEditingPageId(pageId);
    setTempName(currentName);
  };

  const handleFinishRename = (pageId: string): void => {
    if (editingPageId === pageId && tempName.trim()) {
      onRenamePage?.(pageId, tempName.trim());
    }
    setEditingPageId(null);
  };

  return (
    <div
      className={styles.drawerOverlay}
      role="region"
      aria-label="Navegador Espacial de Pranchetas"
    >
      <div
        ref={listRef}
        className={styles.cardList}
        style={{
          paddingTop: `${verticalPadding}px`,
          paddingBottom: `${verticalPadding}px`,
        }}
      >
        {pages.map((page, index) => {
          const diff = index - activePageIndex;
          const isInView = diff === 0;
          const isPrevious = diff === -1;
          const isNext = diff === 1;

          let spatialClass = styles.cardDistant;
          if (isInView) {
            spatialClass = styles.cardInView;
          } else if (isPrevious) {
            spatialClass = styles.cardPrevious;
          } else if (isNext) {
            spatialClass = styles.cardNext;
          }

          const w = page.dimensions.width;
          const h = page.dimensions.height;
          const aspect = `${w} / ${h}`;
          const displayName = page.name || `Página ${index + 1}`;

          return (
            <div
              key={page.id}
              ref={isInView ? activeCardRef : undefined}
              className={[styles.card, spatialClass].filter(Boolean).join(' ')}
              onClick={() => onSelectPage(index)}
              onKeyDown={(e) => {
                if (editingPageId === page.id) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPage(index);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`${displayName}${isInView ? ' (ativa)' : ''}`}
              aria-current={isInView ? 'page' : undefined}
            >
              <div className={styles.cardMetaRow}>
                {editingPageId === page.id ? (
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={() => handleFinishRename(page.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFinishRename(page.id);
                      if (e.key === 'Escape') setEditingPageId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={styles.renameInput}
                    autoFocus
                    aria-label="Renomear prancheta"
                  />
                ) : (
                  <div className={styles.cardNameWrapper}>
                    {isInView && <span className={styles.activeDot}>●</span>}
                    <span
                      className={styles.cardName}
                      onDoubleClick={(e) => handleStartRename(page.id, displayName, e)}
                      title="Clique duas vezes para renomear"
                    >
                      {displayName}
                    </span>
                    <button
                      type="button"
                      className={styles.renameBtn}
                      onClick={(e) => handleStartRename(page.id, displayName, e)}
                      title="Renomear prancheta"
                      aria-label={`Renomear ${displayName}`}
                    >
                      <Icon name="pencil" size="xs" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.previewBox}>
                {thumbnails?.[page.id] ? (
                  <img
                    src={thumbnails[page.id]}
                    alt={`Miniatura de ${displayName}`}
                    className={styles.thumbnailImg}
                    style={{ aspectRatio: aspect }}
                  />
                ) : (
                  <div
                    className={styles.previewArtboardMini}
                    style={{
                      aspectRatio: aspect,
                      backgroundColor: page.backgroundColor || 'var(--color-surface-elevated)',
                    }}
                  >
                    <span className={styles.emptyPlaceholderText}>
                      {w} × {h}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.cardDims}>
                  {w} × {h}
                </span>
                <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="copy"
                    onClick={() => onDuplicatePage(page.id)}
                    title="Duplicar esta prancheta"
                    aria-label={`Duplicar prancheta ${index + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="trash"
                    disabled={pages.length <= 1}
                    onClick={() => onDeletePage(page.id)}
                    title="Excluir esta prancheta"
                    aria-label={`Excluir prancheta ${index + 1}`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
