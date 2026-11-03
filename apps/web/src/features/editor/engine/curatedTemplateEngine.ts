import type { Dimensions } from '@pencel/shared-types';
import {
  Circle as FabricCircle,
  Rect as FabricRect,
  Textbox as FabricTextbox,
  type Canvas as FabricCanvas,
} from 'fabric';

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
        name: 'Aspas Citação',
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
        name: 'Label Conhecer',
      });

      fabricCanvas.add(backdropCard, tag, headline, desc, action, actionLabel);
      break;
    }

    case 'workshop-banner': {
      fabricCanvas.backgroundColor = '#1C1C1E';

      const circleDecor = new FabricCircle({
        radius: Math.round(w * 0.35),
        fill: '#FF9F0A',
        opacity: 0.15,
        left: Math.round(w * 0.45),
        top: Math.round(h * -0.1),
        name: 'Círculo Gradiente',
      });

      const pillDate = new FabricRect({
        width: 180,
        height: 40,
        rx: 20,
        ry: 20,
        fill: '#BF5AF2',
        left: Math.round(w * 0.12),
        top: Math.round(h * 0.18),
        name: 'Pill Data',
      });

      const pillDateText = new FabricTextbox('ONLINE & AO VIVO', {
        fontSize: 14,
        fontWeight: 'bold',
        fill: '#FFFFFF',
        width: 180,
        textAlign: 'center',
        left: Math.round(w * 0.12),
        top: Math.round(h * 0.18 + 12),
        name: 'Texto Pill Data',
      });

      const eventTitle = new FabricTextbox('Design Systems\nProfissionais na Web', {
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

      const eventInfo = new FabricTextbox('Quinta-feira, 20h • Inscrições Gratuitas', {
        fontSize: Math.round(w * 0.038),
        fontWeight: '500',
        fill: '#BF5AF2',
        width: Math.round(w * 0.76),
        textAlign: 'left',
        left: Math.round(w * 0.12),
        top: Math.round(h * 0.58),
        name: 'Data Evento',
      });

      fabricCanvas.add(circleDecor, pillDate, pillDateText, eventTitle, eventInfo);
      break;
    }

    case 'open-design-hero': {
      fabricCanvas.backgroundColor = '#0B0C10';
      const glow = new FabricCircle({
        radius: Math.round(w * 0.4),
        fill: '#4F46E5',
        opacity: 0.2,
        left: Math.round(w * 0.1),
        top: Math.round(h * 0.05),
        name: 'Glow Hero',
      });
      const badge = new FabricRect({
        width: 240,
        height: 38,
        rx: 19,
        ry: 19,
        fill: '#1F2937',
        stroke: '#374151',
        strokeWidth: 1,
        left: Math.round(w / 2 - 120),
        top: Math.round(h * 0.18),
        name: 'Badge Hero',
      });
      const badgeText = new FabricTextbox('🚀 NOVA PLATAFORMA 2026', {
        fontSize: 13,
        fontWeight: '700',
        fill: '#E0E7FF',
        width: 240,
        textAlign: 'center',
        left: Math.round(w / 2 - 120),
        top: Math.round(h * 0.18 + 11),
        name: 'Texto Badge Hero',
      });
      const title = new FabricTextbox('Construa Interfaces\nSem Fronteiras', {
        fontSize: Math.round(w * 0.085),
        fontWeight: '900',
        fill: '#FFFFFF',
        width: Math.round(w * 0.85),
        textAlign: 'center',
        lineHeight: 1.15,
        left: Math.round(w * 0.075),
        top: Math.round(h * 0.28),
        name: 'Título Hero',
      });
      fabricCanvas.add(glow, badge, badgeText, title);
      break;
    }

    case 'open-design-carousel': {
      fabricCanvas.backgroundColor = '#F2F2F7';
      const indexPill = new FabricTextbox('SLIDE 01 / 05', {
        fontSize: 14,
        fontWeight: '800',
        fill: '#0071E3',
        left: Math.round(w * 0.1),
        top: Math.round(h * 0.1),
        name: 'Indicador Slide',
      });
      const headline = new FabricTextbox('5 Princípios do\nDesign Atômico', {
        fontSize: Math.round(w * 0.09),
        fontWeight: '900',
        fill: '#1D1D1F',
        width: Math.round(w * 0.8),
        lineHeight: 1.1,
        left: Math.round(w * 0.1),
        top: Math.round(h * 0.22),
        name: 'Título Carrossel',
      });
      fabricCanvas.add(indexPill, headline);
      break;
    }

    case 'open-design-poster': {
      fabricCanvas.backgroundColor = '#E5E5EA';
      const bar = new FabricRect({
        width: 16,
        height: Math.round(h * 0.8),
        fill: '#FF2D55',
        left: Math.round(w * 0.08),
        top: Math.round(h * 0.1),
        name: 'Barra Suíça',
      });
      const bigText = new FabricTextbox('HELVETICA\nFORM & ORDER', {
        fontSize: Math.round(w * 0.095),
        fontWeight: '900',
        fill: '#000000',
        width: Math.round(w * 0.75),
        lineHeight: 1.05,
        left: Math.round(w * 0.14),
        top: Math.round(h * 0.12),
        name: 'Tipografia Pôster',
      });
      fabricCanvas.add(bar, bigText);
      break;
    }

    case 'open-design-bento': {
      fabricCanvas.backgroundColor = '#121316';
      const bentoCard = new FabricRect({
        width: Math.round(w * 0.8),
        height: Math.round(h * 0.5),
        rx: 20,
        ry: 20,
        fill: '#1C1D22',
        stroke: '#2C2D35',
        strokeWidth: 1,
        left: Math.round(w * 0.1),
        top: Math.round(h * 0.25),
        name: 'Card Bento',
      });
      const stat = new FabricTextbox('+240%', {
        fontSize: Math.round(w * 0.12),
        fontWeight: '900',
        fill: '#30D158',
        left: Math.round(w * 0.15),
        top: Math.round(h * 0.32),
        name: 'Métrica Crescimento',
      });
      fabricCanvas.add(bentoCard, stat);
      break;
    }
  }

  fabricCanvas.requestRenderAll();
  onComplete();
}
