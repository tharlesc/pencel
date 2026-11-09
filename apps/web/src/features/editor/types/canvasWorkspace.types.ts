import type { BooleanPathOperation, DesignPage } from '@pencel/editor-core';
import type { RefObject } from 'react';
import type { SelectedObjectProperties } from '../engine/FabricCanvasAdapter.js';

export type LayerMaskShape = 'circle' | 'rounded' | 'ellipse';
export type CanvasAlignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

export interface CanvasWorkspaceProps {
  readonly page?: DesignPage;
  readonly activePageIndex?: number;
  readonly pageCount?: number;
  readonly onNextPage?: () => void;
  readonly onPrevPage?: () => void;
  readonly onAddPage?: () => void;
  readonly onDuplicatePage?: () => void;
  readonly onDeletePage?: (pageId: string) => void;
  readonly zoom?: number;
  readonly canvasRef?: RefObject<HTMLCanvasElement | null>;
  readonly selectedObject?: SelectedObjectProperties | null;
  readonly elementCount?: number;
  readonly onZoomIn?: () => void;
  readonly onZoomOut?: () => void;
  readonly onResetZoom?: () => void;
  readonly onPageBackgroundChange?: (color: string) => void;
  readonly onUpdateObject?: (props: Partial<SelectedObjectProperties>) => void;
  readonly onDeleteSelected?: () => void;
  readonly onDuplicateSelected?: () => void;
  readonly onBringForward?: () => void;
  readonly onSendBackward?: () => void;
  readonly onClearCanvas?: () => void;
  readonly onSelectSubject?: (mode: 'select' | 'removeBg') => void | Promise<unknown>;
  readonly onDeselectAll?: () => void;
  readonly onAlignSelected?: (
    alignment: CanvasAlignment,
    target?: 'artboard' | 'selection',
  ) => void;
  readonly onDistributeSelected?: (direction: 'horizontal' | 'vertical') => void;
  readonly onSetDrawingMode?: (enabled: boolean, mode?: 'brush' | 'eraser') => void;
  readonly currentDrawingTool?: 'none' | 'brush' | 'eraser';
  readonly onApplyCrop?: (mode: '1:1' | '4:3' | '16:9' | 'inset' | 'reset') => void;
  readonly onToggleLayerMask?: (layerName?: string, shape?: LayerMaskShape) => void;
  readonly onPerformBooleanOperation?: (operation: BooleanPathOperation) => void;
  readonly onSetClipToArtboard?: (enabled: boolean) => void;
}

export const FALLBACK_PAGE: DesignPage = {
  id: 'page-1',
  name: 'Página 1',
  dimensions: { width: 1080, height: 1080 },
  backgroundColor: '#FBFBFD',
  elements: [],
};

export function getSavedToolbarPosition(): 'bottom' | 'left' {
  try {
    const s =
      typeof window !== 'undefined'
        ? window.localStorage?.getItem('pencel_floating_toolbar_position')
        : null;
    return s === 'left' || s === 'bottom' ? s : 'bottom';
  } catch {
    return 'bottom';
  }
}

export function saveToolbarPosition(pos: 'bottom' | 'left'): void {
  try {
    window.localStorage?.setItem('pencel_floating_toolbar_position', pos);
  } catch {
    /* ignore */
  }
}
