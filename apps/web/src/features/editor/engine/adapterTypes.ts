import type { ShapeVariant } from '@pencel/editor-core';
import type { Dimensions } from '@pencel/shared-types';
import {
  ActiveSelection,
  IText as FabricIText,
  Textbox as FabricTextbox,
  type FabricObject,
} from 'fabric';
import { createElementId } from '../../../shared/lib/idUtils.js';

export interface ElementPositionOptions {
  readonly x?: number;
  readonly y?: number;
  readonly left?: number;
  readonly top?: number;
}

export interface AddTextOptions {
  readonly text: string;
  readonly fontSize?: number;
  readonly fontWeight?: string | number;
  readonly fontFamily?: string;
  readonly fill?: string;
  readonly textAlign?: 'left' | 'center' | 'right' | 'justify';
  readonly charSpacing?: number;
  readonly lineHeight?: number;
  readonly boxMode?: 'point' | 'area';
  readonly position?: { readonly x?: number; readonly y?: number };
}

export interface AddShapeOptions {
  readonly shapeVariant: ShapeVariant;
  readonly fill?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number;
}

export interface CanvasAdapterConfig {
  readonly dimensions: Dimensions;
  readonly displayScale: number;
  readonly backgroundColor: string;
}

export type SelectedObjectType =
  | 'textbox'
  | 'rect'
  | 'circle'
  | 'triangle'
  | 'polygon'
  | 'path'
  | 'image'
  | 'group'
  | 'activeselection'
  | 'unknown';

export interface SelectedObjectProperties {
  readonly id: string;
  readonly type: SelectedObjectType;
  readonly count?: number;
  readonly text?: string;
  readonly boxMode?: 'point' | 'area';
  readonly fill?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly strokeDashArray?: readonly number[] | null;
  readonly strokeLineCap?: 'butt' | 'round' | 'square';
  readonly strokeLineJoin?: 'miter' | 'round' | 'bevel';
  readonly opacity: number;
  readonly fontSize?: number;
  readonly fontFamily?: string;
  readonly fontWeight?: string | number;
  readonly fontStyle?: string;
  readonly underline?: boolean;
  readonly textAlign?: 'left' | 'center' | 'right' | 'justify';
  readonly charSpacing?: number;
  readonly lineHeight?: number;
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly angle: number;
  readonly hasMask?: boolean;
  readonly maskEnabled?: boolean;
  readonly maskInverted?: boolean;
  readonly isCropped?: boolean;
  readonly blendMode?: string;
}

export interface LayerItem {
  readonly id: string;
  readonly name: string;
  readonly text?: string;
  readonly previewUrl?: string;
  readonly type: SelectedObjectType;
  readonly isSelected: boolean;
  readonly visible: boolean;
  readonly locked: boolean;
  readonly opacity: number;
  readonly blendMode: string;
  readonly isGroup?: boolean;
  readonly groupName?: string;
  readonly effects?: readonly string[];
  readonly hasMask?: boolean;
  readonly maskEnabled?: boolean;
  readonly maskInverted?: boolean;
}

export interface CanvasEventCallbacks {
  readonly onSelectionChange: (selectedProps: SelectedObjectProperties | null) => void;
  readonly onCanvasChange: () => void;
}

export function normalizeObjectType(rawType: string): SelectedObjectType {
  const t = rawType.toLowerCase();
  if (t.includes('text')) return 'textbox';
  if (t === 'rect') return 'rect';
  if (t === 'circle' || t === 'ellipse') return 'circle';
  if (t === 'triangle') return 'triangle';
  if (t === 'polygon') return 'polygon';
  if (t === 'path') return 'path';
  if (t.includes('image')) return 'image';
  if (t === 'activeselection') return 'activeselection';
  if (t === 'group') return 'group';
  return 'unknown';
}

export function extractSelectedProperties(active: FabricObject): SelectedObjectProperties {
  const type = normalizeObjectType(active.type);
  const textObj = active as FabricTextbox;
  const isMulti = active.type === 'activeselection';
  const multiCount = isMulti ? (active as ActiveSelection).getObjects().length : undefined;
  const boxMode =
    active instanceof FabricIText && !(active instanceof FabricTextbox)
      ? 'point'
      : active instanceof FabricTextbox
        ? 'area'
        : undefined;

  return {
    id:
      (active.get('name') as string) ||
      (isMulti ? createElementId('multi-selection') : createElementId('obj')),
    type,
    count: multiCount,
    text: typeof textObj.text === 'string' ? textObj.text : undefined,
    boxMode,
    fill: typeof active.fill === 'string' ? active.fill : '#18181B',
    stroke: typeof active.stroke === 'string' ? active.stroke : undefined,
    strokeWidth: typeof active.strokeWidth === 'number' ? active.strokeWidth : undefined,
    strokeDashArray: Array.isArray(active.strokeDashArray) ? active.strokeDashArray : null,
    strokeLineCap: (active.strokeLineCap as 'butt' | 'round' | 'square') || 'butt',
    strokeLineJoin: (active.strokeLineJoin as 'miter' | 'round' | 'bevel') || 'miter',
    opacity: active.opacity ?? 1,
    fontSize: typeof textObj.fontSize === 'number' ? textObj.fontSize : undefined,
    fontFamily: typeof textObj.fontFamily === 'string' ? textObj.fontFamily : undefined,
    fontWeight: textObj.fontWeight,
    fontStyle: textObj.fontStyle,
    underline: Boolean(textObj.underline),
    textAlign: textObj.textAlign as 'left' | 'center' | 'right' | 'justify' | undefined,
    charSpacing: typeof textObj.charSpacing === 'number' ? textObj.charSpacing : 0,
    lineHeight: typeof textObj.lineHeight === 'number' ? textObj.lineHeight : 1.16,
    left: Math.round(active.left || 0),
    top: Math.round(active.top || 0),
    width: Math.round((active.width || 0) * (active.scaleX || 1)),
    height: Math.round((active.height || 0) * (active.scaleY || 1)),
    angle: Math.round(active.angle || 0),
    hasMask: Boolean(active.get('hasMask')),
    maskEnabled: active.get('maskEnabled') !== false,
    maskInverted: Boolean(active.get('maskInverted')),
    isCropped: Boolean(active.get('isCropped')),
    blendMode: (active.get('globalCompositeOperation') as string) || 'source-over',
  };
}
