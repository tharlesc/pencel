import type { GuideLine } from '@pencel/editor-core';
import type { Dimensions } from '@pencel/shared-types';
import type { Canvas as FabricCanvas } from 'fabric';

export interface GuideLayoutConfig {
  readonly preset?: 'custom' | 'instagram-3' | 'instagram-5' | 'columns-12' | 'grid-3x3';
  readonly columns: number;
  readonly columnGutter: number;
  readonly rows: number;
  readonly rowGutter: number;
  readonly marginTop: number;
  readonly marginBottom: number;
  readonly marginLeft: number;
  readonly marginRight: number;
  readonly clearExisting: boolean;
}

export const DEFAULT_GUIDE_LAYOUT_CONFIG: GuideLayoutConfig = {
  preset: 'columns-12',
  columns: 12,
  columnGutter: 20,
  rows: 0,
  rowGutter: 0,
  marginTop: 0,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
  clearExisting: true,
};

export const PRESET_OPTIONS = [
  {
    id: 'columns-12',
    name: '12 Colunas Web',
    desc: 'Grid moderno com espaçamento de 20px',
    cols: 12,
    colGutter: 20,
    rows: 0,
    rowGutter: 0,
  },
  {
    id: 'instagram-3',
    name: 'Carrossel 3 Telas',
    desc: 'Instagram 3 fatias contínuas perfeitas',
    cols: 3,
    colGutter: 0,
    rows: 0,
    rowGutter: 0,
  },
  {
    id: 'instagram-5',
    name: 'Carrossel 5 Telas',
    desc: 'Instagram 5 fatias panorâmicas contínuas',
    cols: 5,
    colGutter: 0,
    rows: 0,
    rowGutter: 0,
  },
  {
    id: 'grid-3x3',
    name: 'Regra dos Terços (3x3)',
    desc: 'Enquadramento fotográfico harmonioso',
    cols: 3,
    colGutter: 0,
    rows: 3,
    rowGutter: 0,
  },
] as const;

export const MARGIN_INPUTS = [
  { key: 'marginTop', label: 'Superior' },
  { key: 'marginRight', label: 'Direita' },
  { key: 'marginBottom', label: 'Inferior' },
  { key: 'marginLeft', label: 'Esquerda' },
] as const;

export interface CanvasSlice {
  readonly id: string;
  readonly index: number;
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export function generateGuideLayout(
  pageDimensions: Dimensions,
  config: GuideLayoutConfig,
): readonly GuideLine[] {
  const result: GuideLine[] = [];
  const now = Date.now();
  let counter = 0;

  const addGuide = (orientation: 'horizontal' | 'vertical', pos: number): void => {
    const rounded = Math.round(pos);
    if (orientation === 'vertical' && (rounded <= 0 || rounded >= pageDimensions.width)) return;
    if (orientation === 'horizontal' && (rounded <= 0 || rounded >= pageDimensions.height)) return;
    if (result.some((g) => g.orientation === orientation && Math.abs(g.position - rounded) < 1))
      return;

    result.push({
      id: `guide-layout-${now}-${++counter}`,
      orientation,
      position: rounded,
    });
  };

  // Margins
  if (config.marginLeft > 0) addGuide('vertical', config.marginLeft);
  if (config.marginRight > 0) addGuide('vertical', pageDimensions.width - config.marginRight);
  if (config.marginTop > 0) addGuide('horizontal', config.marginTop);
  if (config.marginBottom > 0) addGuide('horizontal', pageDimensions.height - config.marginBottom);

  // Columns
  if (config.columns > 0) {
    const usableW =
      pageDimensions.width -
      config.marginLeft -
      config.marginRight -
      (config.columns - 1) * config.columnGutter;
    if (usableW > 0) {
      const colWidth = usableW / config.columns;
      let currX = config.marginLeft;
      for (let i = 0; i < config.columns; i++) {
        if (i > 0) {
          addGuide('vertical', currX); // Column left edge
        }
        currX += colWidth;
        if (i < config.columns - 1) {
          addGuide('vertical', currX); // Column right edge
          currX += config.columnGutter;
        }
      }
    }
  }

  // Rows
  if (config.rows > 0) {
    const usableH =
      pageDimensions.height -
      config.marginTop -
      config.marginBottom -
      (config.rows - 1) * config.rowGutter;
    if (usableH > 0) {
      const rowHeight = usableH / config.rows;
      let currY = config.marginTop;
      for (let j = 0; j < config.rows; j++) {
        if (j > 0) {
          addGuide('horizontal', currY);
        }
        currY += rowHeight;
        if (j < config.rows - 1) {
          addGuide('horizontal', currY);
          currY += config.rowGutter;
        }
      }
    }
  }

  return result;
}

export function computeSlicesFromGuides(
  pageDimensions: Dimensions,
  guides: readonly GuideLine[],
): readonly CanvasSlice[] {
  const vPos = Array.from(
    new Set([
      0,
      ...guides.filter((g) => g.orientation === 'vertical').map((g) => g.position),
      pageDimensions.width,
    ]),
  )
    .filter((x) => x >= 0 && x <= pageDimensions.width)
    .sort((a, b) => a - b);

  const hPos = Array.from(
    new Set([
      0,
      ...guides.filter((g) => g.orientation === 'horizontal').map((g) => g.position),
      pageDimensions.height,
    ]),
  )
    .filter((y) => y >= 0 && y <= pageDimensions.height)
    .sort((a, b) => a - b);

  const slices: CanvasSlice[] = [];
  let index = 1;

  for (let r = 0; r < hPos.length - 1; r++) {
    const top = hPos[r]!;
    const bottom = hPos[r + 1]!;
    const height = bottom - top;
    if (height <= 2) continue;

    for (let c = 0; c < vPos.length - 1; c++) {
      const left = vPos[c]!;
      const right = vPos[c + 1]!;
      const width = right - left;
      if (width <= 2) continue;

      slices.push({
        id: `slice-${r}-${c}`,
        index: index++,
        left,
        top,
        width,
        height,
      });
    }
  }

  return slices;
}

export function exportSliceToPng(
  fabricCanvas: FabricCanvas,
  slice: CanvasSlice,
  multiplier = 1,
): string {
  return fabricCanvas.toDataURL({
    format: 'png',
    left: slice.left,
    top: slice.top,
    width: slice.width,
    height: slice.height,
    multiplier,
  });
}

export function exportGuideSlices(
  fabricCanvas: FabricCanvas,
  pageDimensions: Dimensions,
  guides: readonly GuideLine[],
): void {
  const slices = computeSlicesFromGuides(pageDimensions, guides);
  slices.forEach((slice) => {
    const dataUrl = exportSliceToPng(fabricCanvas, slice);
    const link = document.createElement('a');
    link.download = `fatia-${slice.index}-${slice.width}x${slice.height}.png`;
    link.href = dataUrl;
    link.click();
  });
}
