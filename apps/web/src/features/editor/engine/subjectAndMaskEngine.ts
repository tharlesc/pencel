import {
  Circle as FabricCircle,
  Ellipse as FabricEllipse,
  FabricImage,
  Rect as FabricRect,
  type Canvas as FabricCanvas,
  type FabricObject,
} from 'fabric';
import { removeBackgroundWithAi } from '../services/aiBackgroundRemovalService.js';
import { removeImageBackgroundViaApi } from '../services/imageProcessingService.js';

export async function selectSubjectOnCanvas(
  fabricCanvas: FabricCanvas,
  mode: 'select' | 'removeBg',
  onSaveHistory: () => void,
  onSelectionUpdate: () => void,
): Promise<{ success: boolean; message: string }> {
  let active = fabricCanvas.getActiveObject();

  if (!active || active.type !== 'image') {
    const objects = fabricCanvas.getObjects();
    const imageObj = [...objects].reverse().find((obj) => obj.type === 'image');
    if (imageObj) {
      fabricCanvas.setActiveObject(imageObj);
      active = imageObj;
    }
  }

  if (!active || active.type !== 'image') {
    return {
      success: false,
      message: 'Selecione uma imagem na prancheta para usar Selecionar Assunto.',
    };
  }

  const fabricImg = active as FabricImage;
  const imgEl = fabricImg.getElement() as HTMLImageElement;
  if (!imgEl) {
    return { success: false, message: 'Elemento da imagem indisponível.' };
  }

  try {
    const offCanvas = document.createElement('canvas');
    const w = imgEl.naturalWidth || imgEl.width || 800;
    const h = imgEl.naturalHeight || imgEl.height || 600;
    offCanvas.width = w;
    offCanvas.height = h;

    const ctx = offCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { success: false, message: 'Contexto de renderização 2D indisponível.' };

    ctx.drawImage(imgEl, 0, 0, w, h);
    const originalDataUrl = offCanvas.toDataURL('image/png');

    if (mode === 'removeBg') {
      try {
        const aiResult = await removeBackgroundWithAi(originalDataUrl);
        if (aiResult.success && aiResult.imageBase64) {
          const newImg = await FabricImage.fromURL(aiResult.imageBase64, {
            crossOrigin: 'anonymous',
          });
          newImg.set({
            left: fabricImg.left,
            top: fabricImg.top,
            scaleX: fabricImg.scaleX,
            scaleY: fabricImg.scaleY,
            angle: fabricImg.angle,
            name: `${(fabricImg.get('name') as string) || 'Imagem'} (Recorte IA RMBG)`,
          });

          const currentIdx = fabricCanvas.getObjects().indexOf(fabricImg);
          fabricCanvas.remove(fabricImg);
          fabricCanvas.add(newImg);
          if (currentIdx >= 0) {
            fabricCanvas.moveObjectTo(newImg, currentIdx);
          }

          fabricCanvas.setActiveObject(newImg);
          fabricCanvas.requestRenderAll();
          onSaveHistory();
          onSelectionUpdate();

          return {
            success: true,
            message: 'Fundo removido com sucesso via IA no navegador (RMBG-1.4)!',
          };
        }
      } catch {
        // Fallback to API if available
      }

      try {
        const json = await removeImageBackgroundViaApi(originalDataUrl);
        if (json?.success && json.imageBase64) {
          const newImg = await FabricImage.fromURL(json.imageBase64, {
            crossOrigin: 'anonymous',
          });
          newImg.set({
            left: fabricImg.left,
            top: fabricImg.top,
            scaleX: fabricImg.scaleX,
            scaleY: fabricImg.scaleY,
            angle: fabricImg.angle,
            name: `${(fabricImg.get('name') as string) || 'Imagem'} (Recorte IA)`,
          });

          const currentIdx = fabricCanvas.getObjects().indexOf(fabricImg);
          fabricCanvas.remove(fabricImg);
          fabricCanvas.add(newImg);
          if (currentIdx >= 0) {
            fabricCanvas.moveObjectTo(newImg, currentIdx);
          }

          fabricCanvas.setActiveObject(newImg);
          fabricCanvas.requestRenderAll();
          onSaveHistory();
          onSelectionUpdate();

          return { success: true, message: 'Fundo removido com sucesso via IA PhotoCraft!' };
        }
      } catch {
        // Fallback to client-side flood-fill
      }
    }

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const visited = new Uint8Array(w * h);
    const queue: number[] = [];
    const seedSamples: Array<[number, number, number]> = [];

    for (let x = 0; x < w; x += 2) {
      const p = 0 * w + x;
      const idx = p * 4;
      seedSamples.push([data[idx]!, data[idx + 1]!, data[idx + 2]!]);
      visited[p] = 1;
      queue.push(p);
    }

    const upperH = Math.floor(h * 0.35);
    for (let y = 1; y < upperH; y += 2) {
      const pL = y * w + 0;
      const idxL = pL * 4;
      seedSamples.push([data[idxL]!, data[idxL + 1]!, data[idxL + 2]!]);
      visited[pL] = 1;
      queue.push(pL);

      const pR = y * w + (w - 1);
      const idxR = pR * 4;
      seedSamples.push([data[idxR]!, data[idxR + 1]!, data[idxR + 2]!]);
      visited[pR] = 1;
      queue.push(pR);
    }

    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    for (const s of seedSamples) {
      sumR += s[0];
      sumG += s[1];
      sumB += s[2];
    }
    const seedCount = seedSamples.length || 1;
    const avgSeedR = sumR / seedCount;
    const avgSeedG = sumG / seedCount;
    const avgSeedB = sumB / seedCount;

    const localTol = 24;
    const globalTol = 68;

    let head = 0;
    while (head < queue.length) {
      const p = queue[head++];
      if (p === undefined) break;

      const px = p % w;
      const py = Math.floor(p / w);

      const curIdx = p * 4;
      const curR = data[curIdx]!;
      const curG = data[curIdx + 1]!;
      const curB = data[curIdx + 2]!;

      const neighbors: number[] = [];
      if (px > 0) neighbors.push(p - 1);
      if (px < w - 1) neighbors.push(p + 1);
      if (py > 0) neighbors.push(p - w);
      if (py < h - 1) neighbors.push(p + w);

      for (const n of neighbors) {
        if (visited[n] === 0) {
          const nIdx = n * 4;
          const nr = data[nIdx]!;
          const ng = data[nIdx + 1]!;
          const nb = data[nIdx + 2]!;

          const localDiff = Math.abs(nr - curR) + Math.abs(ng - curG) + Math.abs(nb - curB);
          const globalDiff =
            Math.abs(nr - avgSeedR) + Math.abs(ng - avgSeedG) + Math.abs(nb - avgSeedB);

          if (localDiff <= localTol && globalDiff <= globalTol) {
            visited[n] = 1;
            queue.push(n);
          }
        }
      }
    }

    let minX = w;
    let maxX = 0;
    let minY = h;
    let maxY = 0;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        const idx = p * 4;

        if (visited[p] === 1) {
          if (mode === 'removeBg') {
            let touchesSubject = false;
            if (x > 0 && visited[p - 1] === 0) touchesSubject = true;
            else if (x < w - 1 && visited[p + 1] === 0) touchesSubject = true;
            else if (y > 0 && visited[p - w] === 0) touchesSubject = true;
            else if (y < h - 1 && visited[p + w] === 0) touchesSubject = true;

            data[idx + 3] = touchesSubject ? 110 : 0;
          }
        } else {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (mode === 'removeBg') {
      ctx.putImageData(imgData, 0, 0);
      const transparentDataUrl = offCanvas.toDataURL('image/png');

      const newImg = await FabricImage.fromURL(transparentDataUrl, { crossOrigin: 'anonymous' });
      newImg.set({
        left: fabricImg.left,
        top: fabricImg.top,
        scaleX: fabricImg.scaleX,
        scaleY: fabricImg.scaleY,
        angle: fabricImg.angle,
        name: `${(fabricImg.get('name') as string) || 'Imagem'} (Recorte)`,
      });

      const currentIdx = fabricCanvas.getObjects().indexOf(fabricImg);
      fabricCanvas.remove(fabricImg);
      fabricCanvas.add(newImg);
      if (currentIdx >= 0) {
        fabricCanvas.moveObjectTo(newImg, currentIdx);
      }

      fabricCanvas.setActiveObject(newImg);
      fabricCanvas.requestRenderAll();
      onSaveHistory();
      onSelectionUpdate();

      return { success: true, message: 'Fundo removido com sucesso!' };
    }

    fabricCanvas.setActiveObject(fabricImg);
    fabricCanvas.requestRenderAll();
    onSelectionUpdate();

    const detectedW = Math.max(0, maxX - minX);
    const detectedH = Math.max(0, maxY - minY);
    return {
      success: true,
      message: `Assunto detectado (${detectedW} × ${detectedH} px)!`,
    };
  } catch (err) {
    console.error('Falha ao executar Selecionar Assunto:', err);
    return {
      success: false,
      message: 'Falha ao ler pixels da imagem (pode estar com proteção de domínio CORS).',
    };
  }
}

export function toggleLayerMaskOnCanvas(
  fabricCanvas: FabricCanvas,
  layerName: string | undefined,
  shape: 'circle' | 'rounded' | 'ellipse',
  onComplete: () => void,
): void {
  const target = layerName
    ? fabricCanvas.getObjects().find((obj) => obj.get('name') === layerName)
    : fabricCanvas.getActiveObject();
  if (!target) return;

  const currentlyHasMask = Boolean(target.get('hasMask'));
  if (currentlyHasMask) {
    const currentlyEnabled = target.get('maskEnabled') !== false;
    if (currentlyEnabled) {
      target.set('_savedMaskClipPath', target.clipPath);
      target.clipPath = undefined;
      target.set('maskEnabled', false);
    } else {
      const saved = target.get('_savedMaskClipPath') as FabricObject | undefined;
      if (saved) {
        target.clipPath = saved;
      }
      target.set('maskEnabled', true);
    }
  } else {
    const objW = Math.max(20, target.width || 200);
    const objH = Math.max(20, target.height || 200);
    let maskObj: FabricObject;

    if (shape === 'rounded') {
      maskObj = new FabricRect({
        originX: 'center',
        originY: 'center',
        left: 0,
        top: 0,
        width: objW * 0.86,
        height: objH * 0.86,
        rx: Math.min(objW, objH) * 0.16,
        ry: Math.min(objW, objH) * 0.16,
      });
    } else if (shape === 'ellipse') {
      maskObj = new FabricEllipse({
        originX: 'center',
        originY: 'center',
        left: 0,
        top: 0,
        rx: objW * 0.44,
        ry: objH * 0.36,
      });
    } else {
      const r = Math.min(objW, objH) * 0.44;
      maskObj = new FabricCircle({
        originX: 'center',
        originY: 'center',
        left: 0,
        top: 0,
        radius: r,
      });
    }

    target.clipPath = maskObj;
    target.set({
      hasMask: true,
      maskEnabled: true,
      maskInverted: false,
      dirty: true,
    });
  }

  target.set('dirty', true);
  fabricCanvas.requestRenderAll();
  onComplete();
}

export function invertLayerMaskOnCanvas(
  fabricCanvas: FabricCanvas,
  layerName: string | undefined,
  onComplete: () => void,
): void {
  const target = layerName
    ? fabricCanvas.getObjects().find((obj) => obj.get('name') === layerName)
    : fabricCanvas.getActiveObject();
  if (!target || !target.clipPath) return;

  const nextInverted = !target.clipPath.inverted;
  target.clipPath.inverted = nextInverted;
  target.set({
    maskInverted: nextInverted,
    dirty: true,
  });

  fabricCanvas.requestRenderAll();
  onComplete();
}

export function removeLayerMaskOnCanvas(
  fabricCanvas: FabricCanvas,
  layerName: string | undefined,
  onComplete: () => void,
): void {
  const target = layerName
    ? fabricCanvas.getObjects().find((obj) => obj.get('name') === layerName)
    : fabricCanvas.getActiveObject();
  if (!target) return;

  target.clipPath = undefined;
  target.set({
    _savedMaskClipPath: undefined,
    hasMask: false,
    maskEnabled: false,
    maskInverted: false,
    isCropped: false,
    dirty: true,
  });

  fabricCanvas.requestRenderAll();
  onComplete();
}

export function applyCropToSelectedOnCanvas(
  fabricCanvas: FabricCanvas,
  mode: '1:1' | '4:3' | '16:9' | 'inset' | 'reset',
  onRemoveMask: () => void,
  onComplete: () => void,
): void {
  const active = fabricCanvas.getActiveObject();
  if (!active) return;

  if (mode === 'reset') {
    onRemoveMask();
    return;
  }

  const objW = Math.max(20, active.width || 200);
  const objH = Math.max(20, active.height || 200);
  let cropW = objW * 0.82;
  let cropH = objH * 0.82;

  if (mode === '1:1') {
    const side = Math.min(objW, objH) * 0.88;
    cropW = side;
    cropH = side;
  } else if (mode === '4:3') {
    cropW = Math.min(objW * 0.9, objH * (4 / 3) * 0.9);
    cropH = cropW * (3 / 4);
  } else if (mode === '16:9') {
    cropW = Math.min(objW * 0.92, objH * (16 / 9) * 0.92);
    cropH = cropW * (9 / 16);
  }

  const cropClip = new FabricRect({
    originX: 'center',
    originY: 'center',
    left: 0,
    top: 0,
    width: Math.round(cropW),
    height: Math.round(cropH),
    rx: 0,
    ry: 0,
  });

  active.clipPath = cropClip;
  active.set({
    isCropped: true,
    hasMask: true,
    maskEnabled: true,
    maskInverted: false,
    dirty: true,
  });

  fabricCanvas.requestRenderAll();
  onComplete();
}
