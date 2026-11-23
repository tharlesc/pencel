import type { CanvasLayoutElementDto, GeneratedLayoutDto } from '@pencel/shared-types';
import type {
  Canvas as FabricCanvas,
  Circle as FabricCircle,
  Ellipse as FabricEllipse,
  Rect as FabricRect,
  Textbox as FabricTextbox,
} from 'fabric';

/**
 * Exports the active Fabric.js canvas into a compact `GeneratedLayoutDto` snapshot
 * used for iterative AI refinement ("Refinar atual").
 */
export function extractLayoutSnapshotFromCanvas(
  fabricCanvas: FabricCanvas,
  backgroundColor: string,
  title = 'Design Atual',
): GeneratedLayoutDto {
  const objects = fabricCanvas.getObjects().slice(0, 40);
  const elements: CanvasLayoutElementDto[] = [];

  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i]!;
    if (obj.get('isAiBackgroundGradient')) continue;

    const rawType = obj.type.toLowerCase();
    const name = (obj.get('name') as string) || `Layer ${i + 1}`;
    const left = Math.round(obj.left ?? 0);
    const top = Math.round(obj.top ?? 0);
    const width = Math.round((obj.width ?? 100) * (obj.scaleX ?? 1));
    const height = Math.round((obj.height ?? 100) * (obj.scaleY ?? 1));
    const fill = typeof obj.fill === 'string' ? obj.fill : '#FFFFFF';
    const stroke =
      typeof obj.stroke === 'string' && obj.stroke !== 'transparent' ? obj.stroke : undefined;
    const strokeWidth =
      typeof obj.strokeWidth === 'number' && obj.strokeWidth > 0 ? obj.strokeWidth : undefined;
    const opacity = typeof obj.opacity === 'number' ? Number(obj.opacity.toFixed(2)) : 1;
    const angle = Math.round(obj.angle ?? 0);

    if (rawType.includes('text')) {
      const tb = obj as FabricTextbox;
      const primaryFont =
        typeof tb.fontFamily === 'string'
          ? tb.fontFamily.split(',')[0]?.replace(/['"]/g, '').trim()
          : 'Inter';
      elements.push({
        id: `snap-${i + 1}`,
        type: 'textbox',
        name,
        left,
        top,
        width,
        height,
        fill,
        ...(stroke ? { stroke } : {}),
        ...(strokeWidth ? { strokeWidth } : {}),
        ...(typeof tb.textBackgroundColor === 'string' && tb.textBackgroundColor
          ? { textBackgroundColor: tb.textBackgroundColor }
          : {}),
        opacity,
        ...(angle !== 0 ? { angle } : {}),
        text: tb.text ?? '',
        fontSize: Math.round(tb.fontSize ?? 24),
        fontFamily: primaryFont || 'Inter',
        fontWeight: (tb.fontWeight as CanvasLayoutElementDto['fontWeight']) ?? 500,
        fontStyle: tb.fontStyle === 'italic' ? 'italic' : 'normal',
        textAlign: (tb.textAlign as CanvasLayoutElementDto['textAlign']) ?? 'left',
        ...(typeof tb.lineHeight === 'number'
          ? { lineHeight: Number(tb.lineHeight.toFixed(2)) }
          : {}),
        ...(typeof tb.charSpacing === 'number' && tb.charSpacing !== 0
          ? { charSpacing: Math.round(tb.charSpacing) }
          : {}),
      });
      continue;
    }

    if (rawType.includes('image')) {
      elements.push({
        id: `snap-${i + 1}`,
        type: 'image',
        name,
        left: Number(obj.get('aiFrameLeft')) || left,
        top: Number(obj.get('aiFrameTop')) || top,
        width: Number(obj.get('aiFrameWidth')) || width,
        height: Number(obj.get('aiFrameHeight')) || height,
        opacity,
        ...(typeof obj.get('aiImageQuery') === 'string' && obj.get('aiImageQuery')
          ? { imageQuery: String(obj.get('aiImageQuery')) }
          : {}),
        ...(typeof obj.get('aiImageUrl') === 'string' && obj.get('aiImageUrl')
          ? { imageUrl: String(obj.get('aiImageUrl')) }
          : {}),
        ...(Number(obj.get('aiBorderRadius')) > 0
          ? { borderRadius: Number(obj.get('aiBorderRadius')) }
          : {}),
      });
      continue;
    }

    if (rawType === 'circle') {
      const c = obj as FabricCircle;
      elements.push({
        id: `snap-${i + 1}`,
        type: 'circle',
        name,
        left,
        top,
        radius: Math.round((c.radius ?? width / 2) * (c.scaleX ?? 1)),
        fill,
        opacity,
        ...(stroke ? { stroke } : {}),
        ...(strokeWidth ? { strokeWidth } : {}),
      });
      continue;
    }

    if (rawType === 'ellipse') {
      const e = obj as FabricEllipse;
      elements.push({
        id: `snap-${i + 1}`,
        type: 'ellipse',
        name,
        left,
        top,
        rx: Math.round((e.rx ?? width / 2) * (e.scaleX ?? 1)),
        ry: Math.round((e.ry ?? height / 2) * (e.scaleY ?? 1)),
        fill,
        opacity,
        ...(stroke ? { stroke } : {}),
        ...(strokeWidth ? { strokeWidth } : {}),
      });
      continue;
    }

    if (rawType === 'triangle' || rawType === 'polygon') {
      elements.push({
        id: `snap-${i + 1}`,
        type: rawType === 'triangle' ? 'triangle' : 'polygon',
        name,
        left,
        top,
        width,
        height,
        fill,
        opacity,
        ...(angle !== 0 ? { angle } : {}),
        ...(stroke ? { stroke } : {}),
        ...(strokeWidth ? { strokeWidth } : {}),
      });
      continue;
    }

    const r = obj as FabricRect;
    elements.push({
      id: `snap-${i + 1}`,
      type: 'rect',
      name,
      left,
      top,
      width,
      height,
      ...(typeof r.rx === 'number' && r.rx > 0
        ? { rx: Math.round(r.rx), ry: Math.round(r.ry ?? r.rx) }
        : {}),
      fill,
      opacity,
      ...(angle !== 0 ? { angle } : {}),
      ...(stroke ? { stroke } : {}),
      ...(strokeWidth ? { strokeWidth } : {}),
    });
  }

  return {
    title,
    backgroundColor,
    elements,
    explanation: 'Snapshot atual da prancheta para refinamento iterativo.',
  };
}
