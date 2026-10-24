import type { DesignPage } from '@pencel/editor-core';
import type { ReactElement } from 'react';
import { Button, ToolbarDivider, ToolbarGroup } from '../../../components/ui/index.js';
import { formatZoomPercentage } from '../utils/zoomUtils.js';
import styles from './CanvasWorkspace.module.css';

export interface CanvasBottomHudProps {
  readonly page: DesignPage;
  readonly activePageIndex: number;
  readonly pageCount: number;
  readonly zoom: number;
  readonly elementCount: number;
  readonly currentDrawingTool: 'none' | 'brush' | 'eraser';
  readonly clipArtboard: boolean;
  readonly onSetClipArtboard: (next: boolean) => void;
  readonly onSetDrawingMode?: (enabled: boolean, mode?: 'brush' | 'eraser') => void;
  readonly onPageBackgroundChange: (color: string) => void;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onReset: () => void;
  readonly onNextPage?: () => void;
  readonly onPrevPage?: () => void;
  readonly onAddPage?: () => void;
  readonly onDuplicatePage?: () => void;
  readonly onDeletePage?: (pageId: string) => void;
}

export function CanvasBottomHud({
  page,
  activePageIndex,
  pageCount,
  zoom,
  elementCount,
  currentDrawingTool,
  clipArtboard,
  onSetClipArtboard,
  onSetDrawingMode,
  onPageBackgroundChange,
  onZoomIn,
  onZoomOut,
  onReset,
  onNextPage,
  onPrevPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
}: CanvasBottomHudProps): ReactElement {
  return (
    <footer className={styles.bottomBar}>
      <div className={styles.bottomLeft}>
        <ToolbarGroup ariaLabel="Ferramentas interativas de estúdio">
          <Button
            variant="toolbar"
            size="sm"
            icon="select"
            active={currentDrawingTool === 'none'}
            onClick={() => onSetDrawingMode?.(false)}
            aria-label="Ferramenta Seleção (V)"
            title="Seleção / Mover (V)"
          />
          <Button
            variant="toolbar"
            size="sm"
            icon="brush"
            active={currentDrawingTool === 'brush'}
            onClick={() => onSetDrawingMode?.(currentDrawingTool !== 'brush', 'brush')}
            aria-label="Pincel Livre (B)"
            title="Pincel Livre (B)"
          />
          <Button
            variant="toolbar"
            size="sm"
            icon="eraser"
            active={currentDrawingTool === 'eraser'}
            onClick={() => onSetDrawingMode?.(currentDrawingTool !== 'eraser', 'eraser')}
            aria-label="Borracha (E)"
            title="Borracha (E)"
          />
          <Button
            variant="toolbar"
            size="sm"
            icon="pipette"
            onClick={async () => {
              if (
                typeof (window as unknown as { EyeDropper?: unknown }).EyeDropper !== 'undefined'
              ) {
                try {
                  type EyeDropperInstance = { open: () => Promise<{ sRGBHex: string }> };
                  type EyeDropperConstructor = new () => EyeDropperInstance;
                  const EyeDropperClass = (
                    window as unknown as { EyeDropper: EyeDropperConstructor }
                  ).EyeDropper;
                  const dropper = new EyeDropperClass();
                  const res = await dropper.open();
                  if (res?.sRGBHex) {
                    onPageBackgroundChange(res.sRGBHex.toUpperCase());
                  }
                } catch {
                  // Cancelled
                }
              }
            }}
            aria-label="Conta-gotas (I)"
            title="Conta-gotas da tela (I)"
          />
        </ToolbarGroup>

        <ToolbarDivider />

        <span className={styles.statTag}>
          {page.dimensions.width} × {page.dimensions.height} px
        </span>
        <span className={styles.statDivider}>•</span>
        <span className={styles.statTag}>
          {elementCount} {elementCount === 1 ? 'elemento' : 'elementos'}
        </span>
      </div>

      <div className={styles.bottomCenter}>
        <ToolbarGroup ariaLabel="Controles de zoom do palco">
          <Button
            variant="toolbar"
            size="sm"
            icon="zoomOut"
            onClick={onZoomOut}
            aria-label="Reduzir zoom"
          />
          <span className={styles.zoomReadout} aria-live="polite">
            {formatZoomPercentage(zoom)}
          </span>
          <Button
            variant="toolbar"
            size="sm"
            icon="zoomIn"
            onClick={onZoomIn}
            aria-label="Aumentar zoom"
          />
          <ToolbarDivider />
          <Button
            variant="toolbar"
            size="sm"
            icon="fitScreen"
            onClick={onReset}
            aria-label="Ajustar zoom e centralizar prancheta"
          >
            Ajustar
          </Button>
          <Button
            variant="toolbar"
            size="sm"
            icon={clipArtboard ? 'eye' : 'eyeOff'}
            active={clipArtboard}
            onClick={() => onSetClipArtboard(!clipArtboard)}
            aria-label="Alternar recorte de conteúdo da prancheta"
            title={
              clipArtboard
                ? 'Recorte da prancheta ativo (apenas alças visíveis fora da prancheta)'
                : 'Mostrando conteúdo completo fora da prancheta'
            }
          >
            Recorte
          </Button>
        </ToolbarGroup>
      </div>

      {pageCount > 0 ? (
        <div className={styles.bottomRight}>
          <ToolbarGroup ariaLabel="Navegação e páginas da prancheta">
            <Button
              variant="toolbar"
              size="sm"
              icon="chevronLeft"
              disabled={activePageIndex === 0}
              onClick={onPrevPage}
              aria-label="Página anterior"
            />
            <span className={styles.pageIndicator}>
              Página {activePageIndex + 1} de {pageCount}
            </span>
            <Button
              variant="toolbar"
              size="sm"
              icon="chevronRight"
              disabled={activePageIndex >= pageCount - 1}
              onClick={onNextPage}
              aria-label="Próxima página"
            />
            <ToolbarDivider />
            <Button
              variant="toolbar"
              size="sm"
              icon="filePlus"
              onClick={onAddPage}
              aria-label="Adicionar nova página"
            >
              Adicionar Página
            </Button>
            <Button
              variant="toolbar"
              size="sm"
              icon="copy"
              onClick={onDuplicatePage}
              aria-label="Duplicar página atual"
            />
            {pageCount > 1 ? (
              <Button
                variant="toolbar"
                size="sm"
                icon="trash"
                onClick={() => onDeletePage?.(page.id)}
                aria-label="Excluir página atual"
              />
            ) : null}
          </ToolbarGroup>
        </div>
      ) : null}
    </footer>
  );
}
