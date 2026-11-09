import type { BooleanPathOperation } from '@pencel/editor-core';
import type { SelectedObjectProperties } from '../../engine/FabricCanvasAdapter.js';

export interface ContextualToolbarProps {
  readonly selectedObject: SelectedObjectProperties | null;
  readonly pageBackground: string;
  readonly onPageBackgroundChange: (color: string) => void;
  readonly onUpdateObject: (props: Partial<SelectedObjectProperties>) => void;
  readonly onDeleteSelected: () => void;
  readonly onDuplicateSelected: () => void;
  readonly onBringForward?: () => void;
  readonly onSendBackward?: () => void;
  readonly onClearCanvas: () => void;
  readonly onOpenVectorize?: () => void;
  readonly onSelectSubject?: (mode: 'select' | 'removeBg') => void | Promise<unknown>;
  readonly onAlignSelected?: (
    alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom',
    target?: 'artboard' | 'selection',
  ) => void;
  readonly onDistributeSelected?: (direction: 'horizontal' | 'vertical') => void;
  readonly onApplyCrop?: (mode: '1:1' | '4:3' | '16:9' | 'inset' | 'reset') => void;
  readonly onToggleLayerMask?: (
    layerName?: string,
    shape?: 'circle' | 'rounded' | 'ellipse',
  ) => void;
  readonly onPerformBooleanOperation?: (operation: BooleanPathOperation) => void;
  readonly currentDrawingTool?: 'none' | 'brush' | 'eraser';
  readonly currentToolMode?: 'select' | 'directSelect' | 'pen' | 'brush' | 'eraser';
  readonly brushWidth?: number;
  readonly brushHardness?: number;
  readonly brushSmoothness?: number;
  readonly brushColor?: string;
  readonly onBrushWidthChange?: (width: number) => void;
  readonly onBrushHardnessChange?: (hardness: number) => void;
  readonly onBrushSmoothnessChange?: (smoothness: number) => void;
  readonly onBrushColorChange?: (color: string) => void;
  readonly onExitDrawingMode?: () => void;
  readonly onFinishPenPath?: (isClosed?: boolean) => void;
  readonly onExitPenMode?: () => void;
}
