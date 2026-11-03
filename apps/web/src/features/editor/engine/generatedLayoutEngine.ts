import type { Dimensions } from '@pencel/shared-types';
import {
  Circle as FabricCircle,
  Rect as FabricRect,
  Textbox as FabricTextbox,
  Triangle as FabricTriangle,
  type Canvas as FabricCanvas,
  type FabricObject,
} from 'fabric';
import type { GeneratedLayoutDto } from '../services/aiLayoutService.js';

/**
 * Materializes an autonomous AI-generated layout directly onto the Fabric.js canvas.
 * Clears prior objects, updates the background, and attaches editable vector and text elements.
 */
export function applyGeneratedLayoutToCanvas(
  fabricCanvas: FabricCanvas,
  _pageDimensions: Dimensions,
  layout: GeneratedLayoutDto,
  onClearObjects: () => void,
  onCommit: () => void,
): void {
  onClearObjects();

  if (layout.backgroundColor) {
    fabricCanvas.backgroundColor = layout.backgroundColor;
  }

  const fabricObjects: FabricObject[] = [];

  for (const el of layout.elements) {
    switch (el.type) {
      case 'rect': {
        const rect = new FabricRect({
          left: el.left,
          top: el.top,
          width: el.width ?? 100,
          height: el.height ?? 100,
          rx: el.rx ?? 0,
          ry: el.ry ?? 0,
          fill: el.fill ?? '#000000',
          stroke: el.stroke,
          strokeWidth: el.strokeWidth ?? 0,
          opacity: el.opacity ?? 1,
          name: el.name,
        });
        fabricObjects.push(rect);
        break;
      }
      case 'circle': {
        const circle = new FabricCircle({
          left: el.left,
          top: el.top,
          radius: el.radius ?? 50,
          fill: el.fill ?? '#000000',
          stroke: el.stroke,
          strokeWidth: el.strokeWidth ?? 0,
          opacity: el.opacity ?? 1,
          name: el.name,
        });
        fabricObjects.push(circle);
        break;
      }
      case 'triangle': {
        const triangle = new FabricTriangle({
          left: el.left,
          top: el.top,
          width: el.width ?? 100,
          height: el.height ?? 100,
          fill: el.fill ?? '#000000',
          stroke: el.stroke,
          strokeWidth: el.strokeWidth ?? 0,
          opacity: el.opacity ?? 1,
          name: el.name,
        });
        fabricObjects.push(triangle);
        break;
      }
      case 'textbox': {
        const textbox = new FabricTextbox(el.text ?? '', {
          left: el.left,
          top: el.top,
          width: el.width ?? 300,
          fontSize: el.fontSize ?? 24,
          fontFamily: el.fontFamily ?? 'Inter',
          fontWeight: el.fontWeight ?? 'normal',
          fill: el.fill ?? '#000000',
          textAlign: el.textAlign ?? 'left',
          name: el.name,
        });
        fabricObjects.push(textbox);
        break;
      }
    }
  }

  if (fabricObjects.length > 0) {
    fabricCanvas.add(...fabricObjects);
  }

  fabricCanvas.requestRenderAll();
  onCommit();
}
