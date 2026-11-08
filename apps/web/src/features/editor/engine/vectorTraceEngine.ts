/**
 * Vector Trace Engine Adapter for Fabric.js.
 *
 * Connects the in-browser WebAssembly VTracer SVG output with the
 * visual Fabric.js canvas stage. Adheres to ADR 0029 and AGENTS.md.
 */

import {
  Group as FabricGroup,
  Image as FabricImage,
  loadSVGFromString,
  type Canvas as FabricCanvas,
  type FabricObject,
} from 'fabric';
import { createElementId } from '../../../shared/lib/idUtils.js';

export interface TargetImageMetadata {
  readonly object: FabricObject;
  readonly src: string;
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly angle: number;
  readonly flipX: boolean;
  readonly flipY: boolean;
}

/**
 * Extracts target image metadata from the currently active Fabric.js canvas object.
 */
export function getActiveImageForVectorize(fabricCanvas: FabricCanvas): TargetImageMetadata | null {
  const active = fabricCanvas.getActiveObject();
  if (!active) {
    return null;
  }

  // Check if object is a FabricImage or has an image element source
  const isImage = active instanceof FabricImage || active.type === 'image';
  if (!isImage) {
    return null;
  }

  let src = '';
  if ('getSrc' in active && typeof (active as { getSrc: () => string }).getSrc === 'function') {
    src = (active as { getSrc: () => string }).getSrc();
  } else if (
    '_element' in active &&
    active._element &&
    'src' in (active._element as HTMLImageElement)
  ) {
    src = ((active._element as HTMLImageElement).src as string) || '';
  }

  if (!src && 'toDataURL' in active && typeof active.toDataURL === 'function') {
    src = active.toDataURL({ format: 'png' });
  }

  if (!src) {
    return null;
  }

  return {
    object: active,
    src,
    left: active.left ?? 0,
    top: active.top ?? 0,
    width: active.width ?? 100,
    height: active.height ?? 100,
    scaleX: active.scaleX ?? 1,
    scaleY: active.scaleY ?? 1,
    angle: active.angle ?? 0,
    flipX: Boolean(active.flipX),
    flipY: Boolean(active.flipY),
  };
}

export type VectorizeApplyMode = 'replace' | 'insert';

/**
 * Strips the full-coverage background rectangle or path from an SVG string.
 */
export function stripSvgBackground(svgString: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');
    if (!svgEl) return svgString;

    const viewBox = svgEl.getAttribute('viewBox');
    let vbW = 0;
    let vbH = 0;
    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/).map(Number);
      vbW = parts[2] || 0;
      vbH = parts[3] || 0;
    }

    const children = Array.from(svgEl.children).filter(
      (el) => el.tagName.toLowerCase() !== 'defs' && el.tagName.toLowerCase() !== 'metadata',
    );

    if (children.length > 1) {
      const first = children[0] as SVGElement;
      const tag = first.tagName.toLowerCase();
      if (tag === 'rect') {
        const w = parseFloat(first.getAttribute('width') || '0');
        const h = parseFloat(first.getAttribute('height') || '0');
        if (w >= (vbW || 100) * 0.95 && h >= (vbH || 100) * 0.95) {
          first.remove();
        }
      } else if (tag === 'path') {
        const d = first.getAttribute('d') || '';
        if (/^M\s*0[\s,]0/i.test(d.trim())) {
          first.remove();
        }
      }
    }

    return new XMLSerializer().serializeToString(doc);
  } catch {
    return svgString;
  }
}

/**
 * Ingests a raw SVG string from VTracer and inserts it into the Fabric.js canvas
 * as a structured, selectable, editable FabricGroup.
 */
export async function applyVectorizedSvgToCanvas(
  fabricCanvas: FabricCanvas,
  target: TargetImageMetadata,
  svgString: string,
  mode: VectorizeApplyMode,
  onComplete: () => void,
  removeBackground = false,
): Promise<{ success: boolean; error?: string }> {
  try {
    const processedSvg = removeBackground ? stripSvgBackground(svgString) : svgString;
    const { objects } = await loadSVGFromString(processedSvg);
    let validObjects = objects.filter((o): o is FabricObject => o !== null);

    if (validObjects.length === 0) {
      return { success: false, error: 'O motor vetorial não gerou nenhum caminho válido.' };
    }

    const first = validObjects[0];
    if (removeBackground && validObjects.length > 1 && first) {
      const maxW = Math.max(...validObjects.map((o) => (o.width ?? 0) * (o.scaleX ?? 1)));
      const maxH = Math.max(...validObjects.map((o) => (o.height ?? 0) * (o.scaleY ?? 1)));
      const firstW = (first.width ?? 0) * (first.scaleX ?? 1);
      const firstH = (first.height ?? 0) * (first.scaleY ?? 1);

      if (firstW >= maxW * 0.95 && firstH >= maxH * 0.95) {
        validObjects = validObjects.slice(1);
      }
    }

    const groupName = createElementId('vector-trace-group');

    // Tag each inner path and enable caching to guarantee 60 FPS performance on complex vectors
    validObjects.forEach((obj, idx) => {
      obj.set('name', createElementId(`vector-path-${idx + 1}`));
      obj.set('groupName', groupName);
      obj.set('objectCaching', true);
    });

    const isComplex = validObjects.length > 500;

    const vectorGroup = new FabricGroup(validObjects, {
      originX: 'left',
      originY: 'top',
      left: target.left,
      top: target.top,
      angle: target.angle,
      flipX: target.flipX,
      flipY: target.flipY,
      subTargetCheck: !isComplex,
      objectCaching: true,
    });
    vectorGroup.set('name', groupName);

    // Compute original visual displayed bounding dimensions
    const displayWidth = Math.abs(target.width * target.scaleX);
    const displayHeight = Math.abs(target.height * target.scaleY);

    if (vectorGroup.width > 0 && vectorGroup.height > 0) {
      vectorGroup.set({
        scaleX: displayWidth / vectorGroup.width,
        scaleY: displayHeight / vectorGroup.height,
      });
    }

    vectorGroup.setCoords();

    if (mode === 'replace') {
      fabricCanvas.remove(target.object);
    }

    fabricCanvas.add(vectorGroup);
    fabricCanvas.setActiveObject(vectorGroup);
    fabricCanvas.requestRenderAll();

    onComplete();
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Falha ao importar caminhos vetoriais: ${message}` };
  }
}
