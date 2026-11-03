import type { DesignPage } from '@pencel/editor-core';
import type { ReactElement } from 'react';
import { Button, ToolbarDivider, ToolbarGroup } from '../../../../components/ui/index.js';
import { formatZoomPercentage } from '../../utils/zoomUtils.js';
import styles from './CanvasBottomHud.module.css';

export interface CanvasBottomHudProps {
  readonly page: DesignPage;
  readonly activePageIndex: number;
  readonly pageCount: number;
  readonly zoom: number;
  readonly elementCount: number;
  readonly currentDrawingTool?: 'none' | 'brush' | 'eraser';
  readonly currentToolMode?: 'select' | 'directSelect' | 'pen' | 'brush' | 'eraser';
  readonly clipArtboard: boolean;
  readonly onSetClipArtboard: (next: boolean) => void;
  readonly onSetDrawingMode?: (enabled: boolean, mode?: 'brush' | 'eraser') => void;
  readonly onSetToolMode?: (mode: 'select' | 'directSelect' | 'pen' | 'brush' | 'eraser') => void;
  readonly onCombineSelected?: () => void;
  readonly onPageBackgroundChange?: (color: string) => void;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onReset: () => void;
  readonly onNextPage?: () => void;
  readonly onPrevPage?: () => void;
  readonly onAddPage?: () => void;
  readonly onToggleArtboardDrawer?: () => void;
  readonly floatingToolbarPosition?: 'bottom' | 'left';
  readonly onFloatingToolbarPositionChange?: (position: 'bottom' | 'left') => void;
  readonly showRulers?: boolean;
  readonly onToggleRulers?: () => void;
  readonly showGuides?: boolean;
  readonly onToggleGuides?: () => void;
}

export function CanvasBottomHud({
  page,
  activePageIndex,
  pageCount,
  zoom,
  elementCount,
  clipArtboard,
  onSetClipArtboard,
  onZoomIn,
  onZoomOut,
  onReset,
  onNextPage,
  onPrevPage,
  onAddPage,
  onToggleArtboardDrawer,
}: CanvasBottomHudProps): ReactElement {
  return (
    <footer className={styles.bottomBar} data-testid="canvas-bottom-hud">
      <div className={styles.bottomLeft}>
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
            <button
              type="button"
              className={styles.pageIndicator}
              onClick={onToggleArtboardDrawer}
              title="Abrir painel de miniaturas das pranchetas"
              aria-label={`Ver miniaturas das pranchetas: Página ${activePageIndex + 1} de ${pageCount}`}
            >
              Página {activePageIndex + 1} de {pageCount}
            </button>
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
          </ToolbarGroup>
        </div>
      ) : null}
    </footer>
  );
}
