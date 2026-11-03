import type { Dimensions } from '@pencel/shared-types';
import {
  FabricImage,
  loadSVGFromString,
  loadSVGFromURL,
  util,
  type Canvas as FabricCanvas,
  type FabricObject,
} from 'fabric';
import { createElementId } from '../../../shared/lib/idUtils.js';
import {
  decodeSvgDataUri,
  encodeSvgDataUri,
  isSvgSource,
  normalizeSvgMarkup,
} from '../../../shared/lib/imageLoader.js';
import { httpClient } from '../services/httpClient.js';
import { loadFabricImageSafely, loadHtmlImage } from './imageLoadingUtils.js';

export async function addImageFromUrlToCanvas(
  fabricCanvas: FabricCanvas,
  pageDimensions: Dimensions,
  managedObjectUrls: Set<string>,
  url: string,
  altText: string,
  onSelect: () => void,
  fallbackUrl?: string,
): Promise<void> {
  if (!url) return;

  const placeAndSelectObject = (obj: FabricObject, prefix: string, targetMaxRatio = 0.55): void => {
    const artboardW = pageDimensions.width;
    const artboardH = pageDimensions.height;
    const maxDim = Math.min(artboardW, artboardH) * targetMaxRatio;

    const rawW = Math.max(1, obj.width || 256);
    const rawH = Math.max(1, obj.height || 256);
    const scale = Math.min(maxDim / rawW, maxDim / rawH, 1.5);

    obj.scale(scale);
    const scaledW = rawW * scale;
    const scaledH = rawH * scale;

    obj.set({
      originX: 'left',
      originY: 'top',
      left: Math.round((artboardW - scaledW) / 2),
      top: Math.round((artboardH - scaledH) / 2),
      name: createElementId(prefix),
      altText,
      naturalWidth: rawW,
      naturalHeight: rawH,
    });
    obj.setCoords();

    fabricCanvas.add(obj);
    fabricCanvas.setActiveObject(obj);
    fabricCanvas.requestRenderAll();
    onSelect();
  };

  try {
    if (isSvgSource(url)) {
      let normalizedSvgText: string | null = null;
      try {
        if (url.startsWith('data:image/svg+xml')) {
          normalizedSvgText = decodeSvgDataUri(url);
        } else {
          const resp = await httpClient.getText(url);
          if (resp.ok) {
            normalizedSvgText = resp.data;
          }
        }

        if (normalizedSvgText && normalizedSvgText.includes('<svg')) {
          normalizedSvgText = normalizeSvgMarkup(normalizedSvgText, '#18181B');

          try {
            const svgOutput = await loadSVGFromString(normalizedSvgText);
            const validObjects = (svgOutput.objects || []).filter(
              (o): o is FabricObject => o !== null,
            );
            if (validObjects.length > 0) {
              const groupedSvg = util.groupSVGElements(validObjects, svgOutput.options);
              if ((groupedSvg.width ?? 0) > 0 && (groupedSvg.height ?? 0) > 0) {
                placeAndSelectObject(groupedSvg, 'svg', 0.38);
                return;
              }
            }
          } catch {
            // Proceed to data-uri rasterized SVG fallback
          }

          const svgDataUrl = encodeSvgDataUri(normalizedSvgText);
          try {
            const domImg = await loadHtmlImage(svgDataUrl, null, 3000);
            const svgImg = new FabricImage(domImg);
            if ((svgImg.width ?? 0) > 0) {
              placeAndSelectObject(svgImg, 'svg', 0.38);
              return;
            }
          } catch {
            // Proceed to URL fallback
          }
        } else {
          const svgOutput = await loadSVGFromURL(url, undefined, { crossOrigin: 'anonymous' });
          const validObjects = (svgOutput.objects || []).filter(
            (o): o is FabricObject => o !== null,
          );
          if (validObjects.length > 0) {
            const groupedSvg = util.groupSVGElements(validObjects, svgOutput.options);
            placeAndSelectObject(groupedSvg, 'svg', 0.38);
            return;
          }
        }
      } catch (svgErr) {
        console.warn('SVG vector parse fallback triggered:', svgErr);
      }
    }

    const img = await loadFabricImageSafely(url, managedObjectUrls);

    if (img && (img.width ?? 0) > 0) {
      placeAndSelectObject(img, 'img', 0.55);
    } else if (fallbackUrl && fallbackUrl !== url) {
      await addImageFromUrlToCanvas(
        fabricCanvas,
        pageDimensions,
        managedObjectUrls,
        fallbackUrl,
        altText,
        onSelect,
      );
    }
  } catch (err) {
    console.warn('Could not load image onto canvas:', err);
  }
}

export { applyCuratedTemplateToCanvas } from './curatedTemplateEngine.js';
