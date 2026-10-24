import type { Dimensions } from '@pencel/shared-types';
import {
  Circle as FabricCircle,
  FabricImage,
  Rect as FabricRect,
  Textbox as FabricTextbox,
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

export async function addImageFromUrlToCanvas(
  fabricCanvas: FabricCanvas,
  pageDimensions: Dimensions,
  managedObjectUrls: Set<string>,
  url: string,
  altText: string,
  onSelect: () => void,
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
          const svgImg = await FabricImage.fromURL(svgDataUrl);
          if ((svgImg.width ?? 0) > 0) {
            placeAndSelectObject(svgImg, 'svg', 0.38);
            return;
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

    let img: FabricImage | null = null;
    try {
      img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
    } catch {
      img = null;
    }

    if (!img || !img.width || !img.height) {
      try {
        const response = await httpClient.getBlob(url);
        if (response.ok) {
          const blobUrl = URL.createObjectURL(response.data);
          managedObjectUrls.add(blobUrl);
          img = await FabricImage.fromURL(blobUrl);
        }
      } catch {
        // Proceed to Stage 3
      }
    }

    if (!img || !img.width || !img.height) {
      img = await FabricImage.fromURL(url);
    }

    placeAndSelectObject(img, 'img', 0.55);
  } catch (err) {
    console.warn('Could not load image onto canvas:', err);
  }
}

export function applyCuratedTemplateToCanvas(
  fabricCanvas: FabricCanvas,
  pageDimensions: Dimensions,
  templateId: string,
  onClearObjects: () => void,
  onComplete: () => void,
): void {
  onClearObjects();
  const w = pageDimensions.width;
  const h = pageDimensions.height;

  switch (templateId) {
    case 'flash-sale': {
      fabricCanvas.backgroundColor = '#111113';

      const pill = new FabricRect({
        width: 220,
        height: 48,
        rx: 24,
        ry: 24,
        fill: '#FF3B30',
        left: Math.round(w / 2 - 110),
        top: Math.round(h * 0.18),
        name: 'Badge Promo',
      });

      const pillText = new FabricTextbox('EDIÇÃO LIMITADA', {
        fontSize: 18,
        fontWeight: 'bold',
        fill: '#FBFBFD',
        width: 200,
        textAlign: 'center',
        left: Math.round(w / 2 - 100),
        top: Math.round(h * 0.18 + 14),
        name: 'Texto Badge',
      });

      const title = new FabricTextbox('COLEÇÃO 26', {
        fontSize: Math.round(w * 0.13),
        fontWeight: '900',
        fill: '#FFD60A',
        width: Math.round(w * 0.8),
        textAlign: 'center',
        left: Math.round(w * 0.1),
        top: Math.round(h * 0.28),
        name: 'Título Destaque',
      });

      const subtitle = new FabricTextbox('DESIGN ESSENCIAL E ATEMPORAL\nDISPONÍVEL NO ESTÚDIO', {
        fontSize: Math.round(w * 0.04),
        fontWeight: '600',
        fill: '#F5F5F7',
        width: Math.round(w * 0.75),
        textAlign: 'center',
        left: Math.round(w * 0.125),
        top: Math.round(h * 0.52),
        name: 'Subtítulo Promo',
      });

      const ctaBtn = new FabricRect({
        width: 320,
        height: 64,
        rx: 32,
        ry: 32,
        fill: '#0A84FF',
        left: Math.round(w / 2 - 160),
        top: Math.round(h * 0.72),
        name: 'Botão CTA',
      });

      const ctaText = new FabricTextbox('EXPLORAR AGORA', {
        fontSize: 22,
        fontWeight: 'bold',
        fill: '#FBFBFD',
        width: 300,
        textAlign: 'center',
        left: Math.round(w / 2 - 150),
        top: Math.round(h * 0.72 + 20),
        name: 'Texto CTA',
      });

      fabricCanvas.add(pill, pillText, title, subtitle, ctaBtn, ctaText);
      break;
    }

    case 'quote-post': {
      fabricCanvas.backgroundColor = '#F5F5F7';

      const quoteMark = new FabricTextbox('“', {
        fontSize: Math.round(w * 0.25),
        fontWeight: 'bold',
        fill: '#0071E3',
        width: 140,
        textAlign: 'center',
        left: Math.round(w / 2 - 70),
        top: Math.round(h * 0.12),
        name: 'Aspas',
      });

      const quoteText = new FabricTextbox(
        'O design não é apenas o que parece e o que se sente. O design é como funciona.',
        {
          fontSize: Math.round(w * 0.05),
          fontWeight: '600',
          fill: '#1D1D1F',
          width: Math.round(w * 0.76),
          textAlign: 'center',
          lineHeight: 1.35,
          left: Math.round(w * 0.12),
          top: Math.round(h * 0.38),
          name: 'Frase Citação',
        },
      );

      const author = new FabricTextbox('- Steve Jobs', {
        fontSize: Math.round(w * 0.035),
        fontWeight: 'bold',
        fill: '#6E6E73',
        width: Math.round(w * 0.6),
        textAlign: 'center',
        left: Math.round(w * 0.2),
        top: Math.round(h * 0.72),
        name: 'Autor Citação',
      });

      fabricCanvas.add(quoteMark, quoteText, author);
      break;
    }

    case 'product-launch': {
      fabricCanvas.backgroundColor = '#0E0E10';

      const backdropCard = new FabricRect({
        width: Math.round(w * 0.84),
        height: Math.round(h * 0.68),
        rx: 24,
        ry: 24,
        fill: '#1C1C1E',
        stroke: '#3A3A3C',
        strokeWidth: 2,
        left: Math.round(w * 0.08),
        top: Math.round(h * 0.16),
        name: 'Card de Fundo',
      });

      const tag = new FabricTextbox('NOVIDADE', {
        fontSize: 16,
        fontWeight: '800',
        fill: '#30D158',
        width: 200,
        textAlign: 'center',
        left: Math.round(w / 2 - 100),
        top: Math.round(h * 0.22),
        name: 'Tag Novidade',
      });

      const headline = new FabricTextbox('NOVA COLEÇÃO\nPREMIUM', {
        fontSize: Math.round(w * 0.08),
        fontWeight: 'bold',
        fill: '#FBFBFD',
        width: Math.round(w * 0.75),
        textAlign: 'center',
        lineHeight: 1.2,
        left: Math.round(w * 0.125),
        top: Math.round(h * 0.3),
        name: 'Título Coleção',
      });

      const desc = new FabricTextbox('Feito para quem valoriza minimalismo e excelência.', {
        fontSize: Math.round(w * 0.035),
        fontWeight: 'normal',
        fill: '#8E8E93',
        width: Math.round(w * 0.68),
        textAlign: 'center',
        left: Math.round(w * 0.16),
        top: Math.round(h * 0.54),
        name: 'Descrição Produto',
      });

      const action = new FabricRect({
        width: 260,
        height: 56,
        rx: 28,
        ry: 28,
        fill: '#FBFBFD',
        left: Math.round(w / 2 - 130),
        top: Math.round(h * 0.66),
        name: 'Botão Conhecer',
      });

      const actionLabel = new FabricTextbox('CONHECER', {
        fontSize: 18,
        fontWeight: 'bold',
        fill: '#18181B',
        width: 240,
        textAlign: 'center',
        left: Math.round(w / 2 - 120),
        top: Math.round(h * 0.66 + 18),
        name: 'Texto Conhecer',
      });

      fabricCanvas.add(backdropCard, tag, headline, desc, action, actionLabel);
      break;
    }

    case 'event-webinar':
    default: {
      fabricCanvas.backgroundColor = '#192841';

      const shapeAccent = new FabricCircle({
        radius: Math.round(w * 0.35),
        fill: '#0A84FF',
        opacity: 0.25,
        left: Math.round(w * 0.4),
        top: Math.round(-h * 0.1),
        name: 'Circulo Accent',
      });

      const eventTag = new FabricTextbox('AO VIVO • WORKSHOP', {
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#64D2FF',
        width: Math.round(w * 0.7),
        textAlign: 'left',
        left: Math.round(w * 0.12),
        top: Math.round(h * 0.2),
        name: 'Badge Evento',
      });

      const eventTitle = new FabricTextbox('Como Criar Designs\nProfissionais na Web', {
        fontSize: Math.round(w * 0.075),
        fontWeight: 'bold',
        fill: '#FBFBFD',
        width: Math.round(w * 0.76),
        textAlign: 'left',
        lineHeight: 1.25,
        left: Math.round(w * 0.12),
        top: Math.round(h * 0.28),
        name: 'Título Evento',
      });

      const eventDate = new FabricTextbox('Quinta-feira, 20h • Inscrições Gratuitas', {
        fontSize: Math.round(w * 0.038),
        fontWeight: '500',
        fill: '#BF5AF2',
        width: Math.round(w * 0.76),
        textAlign: 'left',
        left: Math.round(w * 0.12),
        top: Math.round(h * 0.58),
        name: 'Data Evento',
      });

      fabricCanvas.add(shapeAccent, eventTag, eventTitle, eventDate);
      break;
    }
  }

  fabricCanvas.requestRenderAll();
  onComplete();
}
