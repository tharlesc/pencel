import { analyzeDesignBrief, type ArtDirectionBlueprint } from './ai.designKnowledge.js';
import { normalizeHexColor, pickHighContrastTextColor } from './ai.postprocess.js';
import {
  buildCarouselCoverElements,
  buildPosterImpactElements,
  buildProductSpotlightElements,
  buildSwissEditorialElements,
} from './ai.socialCompositions.js';
import type {
  CanvasLayoutElementDto,
  GeneratedLayoutDto,
  GenerateLayoutOptions,
  LayoutCompositionArchetype,
  LayoutGradientSpec,
  LayoutStyleTheme,
} from './ai.types.js';

type CanonicalStyle =
  'tech' | 'promo' | 'minimal' | 'elegant' | 'vibrant' | 'editorial' | 'organic';

type ResolvedArchetype = Exclude<LayoutCompositionArchetype, 'auto'>;

interface CreativePalette {
  readonly background: string;
  readonly backgroundEnd: string;
  readonly cardBg: string;
  readonly subCardBg: string;
  readonly accent: string;
  readonly accentSecondary: string;
  readonly highlight: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textOnAccent: string;
  readonly border: string;
  readonly isDark: boolean;
  readonly displayFont: string;
  readonly bodyFont: string;
  readonly monoFont: string;
}

const PALETTES: Readonly<Record<CanonicalStyle, CreativePalette>> = {
  tech: {
    background: '#0B0D13',
    backgroundEnd: '#13192B',
    cardBg: '#151922',
    subCardBg: '#1C2230',
    accent: '#0A84FF',
    accentSecondary: '#38BDF8',
    highlight: '#64D2FF',
    textPrimary: '#FBFBFD',
    textSecondary: '#9CA3AF',
    textOnAccent: '#FFFFFF',
    border: '#2A3142',
    isDark: true,
    displayFont: 'Space Grotesk',
    bodyFont: 'Inter',
    monoFont: 'JetBrains Mono',
  },
  promo: {
    background: '#121214',
    backgroundEnd: '#261116',
    cardBg: '#1C1C20',
    subCardBg: '#272025',
    accent: '#FF3B30',
    accentSecondary: '#FF6B35',
    highlight: '#FFD60A',
    textPrimary: '#FFFFFF',
    textSecondary: '#C4C4CF',
    textOnAccent: '#FFFFFF',
    border: '#3A3A40',
    isDark: true,
    displayFont: 'Bebas Neue',
    bodyFont: 'Plus Jakarta Sans',
    monoFont: 'Space Mono',
  },
  minimal: {
    background: '#F5F5F7',
    backgroundEnd: '#EAEAEF',
    cardBg: '#FFFFFF',
    subCardBg: '#F0F1F5',
    accent: '#1D1D1F',
    accentSecondary: '#0066CC',
    highlight: '#0066CC',
    textPrimary: '#1D1D1F',
    textSecondary: '#52525B',
    textOnAccent: '#FFFFFF',
    border: '#D4D4D8',
    isDark: false,
    displayFont: 'Outfit',
    bodyFont: 'Inter',
    monoFont: 'Space Mono',
  },
  elegant: {
    background: '#16161D',
    backgroundEnd: '#23202D',
    cardBg: '#21212B',
    subCardBg: '#2A2835',
    accent: '#D4AF37',
    accentSecondary: '#E8C872',
    highlight: '#F3E5AB',
    textPrimary: '#FAF7F0',
    textSecondary: '#B0AAB8',
    textOnAccent: '#16161D',
    border: '#3D3B48',
    isDark: true,
    displayFont: 'Cormorant Garamond',
    bodyFont: 'Montserrat',
    monoFont: 'Space Mono',
  },
  vibrant: {
    background: '#0D0E15',
    backgroundEnd: '#221038',
    cardBg: '#181A26',
    subCardBg: '#241E3A',
    accent: '#BF5AF2',
    accentSecondary: '#FF2D55',
    highlight: '#30D158',
    textPrimary: '#FFFFFF',
    textSecondary: '#B8B5C9',
    textOnAccent: '#FFFFFF',
    border: '#3A3554',
    isDark: true,
    displayFont: 'Syne',
    bodyFont: 'DM Sans',
    monoFont: 'Space Mono',
  },
  editorial: {
    background: '#F6F2EA',
    backgroundEnd: '#ECE5D8',
    cardBg: '#FFFDF9',
    subCardBg: '#EDE7DB',
    accent: '#C84B31',
    accentSecondary: '#1D4ED8',
    highlight: '#C84B31',
    textPrimary: '#17171A',
    textSecondary: '#4E4B45',
    textOnAccent: '#FFFFFF',
    border: '#D6CEC0',
    isDark: false,
    displayFont: 'Playfair Display',
    bodyFont: 'DM Sans',
    monoFont: 'JetBrains Mono',
  },
  organic: {
    background: '#F3F1EC',
    backgroundEnd: '#E5E7DE',
    cardBg: '#FAF9F5',
    subCardBg: '#E6EBE3',
    accent: '#1E4D3B',
    accentSecondary: '#C96F4B',
    highlight: '#C96F4B',
    textPrimary: '#1D2521',
    textSecondary: '#4A5750',
    textOnAccent: '#FAF9F5',
    border: '#CFD6CC',
    isDark: false,
    displayFont: 'Lora',
    bodyFont: 'Plus Jakarta Sans',
    monoFont: 'Space Mono',
  },
};

function inferCategoryFromPrompt(prompt: string): CanonicalStyle {
  const p = prompt.toLowerCase();
  if (/promo|black friday|desconto|sale|oferta|\d+%\s*off|queima|liquidaci|flash sale/.test(p)) {
    return 'promo';
  }
  if (
    /luxo|elegante|ouro|joia|imóve|arquitet|gourmet|café|coffee|brunch|menu|cardápio|wine/.test(p)
  ) {
    return 'elegant';
  }
  if (/orgânic|organic|natural|botânic|wellness|saúde|eco|sustent|skincare|yoga|matcha/.test(p)) {
    return 'organic';
  }
  if (
    /editorial|revista|magazine|artigo|monografia|exposição|exhibition|quote|citação|cita/.test(p)
  ) {
    return 'editorial';
  }
  if (/clean|minimal|simples|frase|livro|suíç|swiss/.test(p)) {
    return 'minimal';
  }
  if (
    /festa|show|festival|verão|carnaval|vibrante|masterclass|workshop|evento|event|live/.test(p)
  ) {
    return 'vibrant';
  }
  return 'tech';
}

function normalizeStyleCategory(style?: LayoutStyleTheme, prompt = ''): CanonicalStyle {
  if (style === 'bold' || style === 'promo') return 'promo';
  if (style === 'dark' || style === 'tech') return 'tech';
  if (style === 'minimal') return 'minimal';
  if (style === 'elegant') return 'elegant';
  if (style === 'vibrant') return 'vibrant';
  if (style === 'editorial') return 'editorial';
  if (style === 'organic') return 'organic';
  return inferCategoryFromPrompt(prompt);
}

function detectLanguage(prompt: string, hint?: 'en' | 'pt' | 'es'): 'en' | 'pt' | 'es' {
  const p = prompt.toLowerCase();
  const ptScore = (
    p.match(
      /\b(para|com|lançamento|oferta|desconto|novo|nova|crie|gere|sobre|cafeteria|site|todo|design|estúdio|ao vivo|gratuit)\b/g,
    ) ?? []
  ).length;
  const esScore = (
    p.match(
      /\b(para|con|lanzamiento|descuento|nuevo|nueva|publicación|liquidación|invitación|cafetería|sitio|tiempo|en vivo)\b/g,
    ) ?? []
  ).length;
  const enScore = (
    p.match(
      /\b(for|with|launch|sale|discount|new|create|banner|post|instagram|modern|dark|event|coffee|masterclass|items|limited)\b/g,
    ) ?? []
  ).length;

  if (ptScore > enScore && ptScore >= esScore) return 'pt';
  if (esScore > enScore && esScore > ptScore) return 'es';
  if (enScore > ptScore && enScore > esScore) return 'en';
  return hint ?? 'pt';
}

interface ExtractedCopy {
  readonly badge: string;
  readonly headline: string;
  readonly subtitle: string;
  readonly cta: string;
  readonly hasExplicitCta: boolean;
  readonly brand: string;
  readonly calloutStat: string;
  readonly calloutLabel: string;
  readonly proofLeft: string;
  readonly proofRight: string;
  readonly imageQuery: string;
  readonly carouselNumber: string;
  readonly swipeLabel: string;
}

function buildPaletteFromDomain(blueprint: ArtDirectionBlueprint): CreativePalette {
  const { palette, displayFont, secondaryFont, microFont } = blueprint.grammar;
  return {
    background: palette.ground,
    backgroundEnd: palette.groundEnd,
    cardBg: palette.surface,
    subCardBg: palette.surface,
    accent: palette.accent,
    accentSecondary: palette.accentAlt,
    highlight: palette.accentAlt,
    textPrimary: palette.ink,
    textSecondary: palette.inkMuted,
    textOnAccent: pickHighContrastTextColor(palette.accent),
    border: palette.isDark ? '#3A3542' : '#D4CEC2',
    isDark: palette.isDark,
    displayFont,
    bodyFont: secondaryFont,
    monoFont: microFont,
  };
}

function inferImageQuery(prompt: string, style: CanonicalStyle): string {
  const p = prompt.toLowerCase();
  if (/café|coffee|cafeteria|brunch|espresso/.test(p)) return 'specialty coffee aesthetic';
  if (/restaurante|food|burger|pizza|gourmet|menu|cardápio|comida/.test(p))
    return 'artisan food photography';
  if (/moda|fashion|roupa|coleção|collection|look/.test(p)) return 'minimal fashion editorial';
  if (/arquitet|imóve|interior|casa|design de interiores/.test(p))
    return 'modern architecture interior';
  if (/fitness|yoga|saúde|wellness|academia|corrida/.test(p)) return 'wellness fitness studio';
  if (/festa|show|festival|música|concert|dj/.test(p)) return 'neon concert lighting';
  if (/app|ia|ai|software|tech|saas|inteligência artificial/.test(p))
    return 'abstract futuristic 3d dark';
  if (/skincare|beleza|cosmét|organic|natural|botânic/.test(p)) return 'botanical skincare minimal';

  switch (style) {
    case 'promo':
      return 'minimal studio product spotlight';
    case 'elegant':
      return 'luxury minimal dark texture';
    case 'organic':
      return 'botanical natural sunlight';
    case 'editorial':
      return 'modern architecture daylight';
    case 'vibrant':
      return 'colorful abstract gradient art';
    case 'minimal':
      return 'minimalist geometric studio';
    case 'tech':
    default:
      return 'modern technology abstract dark';
  }
}

function buildCopyFromOptions(
  options: GenerateLayoutOptions,
  style: CanonicalStyle,
  blueprint: ArtDirectionBlueprint,
): ExtractedCopy {
  const lang = detectLanguage(options.prompt, options.brief?.language);
  const rawPrompt = options.prompt.trim();
  const stripped = rawPrompt
    .replace(
      /^(crie|gere|fazer|faça|quero|desenhe|create|make|design|generate|genera|crea|haz)\s+(um|uma|o|a|an|a|un|una)?\s*(post|banner|arte|criativo|flyer|poster|cartaz|carrossel|carousel|story|anúncio|design|publicación)?\s*(para|de|for|of|about|sobre)?\s*/i,
      '',
    )
    .replace(/\s+/g, ' ')
    .trim();

  const percentMatch = rawPrompt.match(/(\d{1,2}\s*%(\s*off)?)/i);
  const priceMatch = rawPrompt.match(/(R\$\s*\d+(?:[.,]\d{2})?|\$\d+(?:\.\d{2})?)/i);
  const countMatch = rawPrompt.match(
    /\b(0?[3-9]|1[0-2])\s*(dicas|passos|erros|segredos|princ[íi]pios|tips|steps|ways|rules|claves|pasos)\b/i,
  );
  const handleMatch = rawPrompt.match(/(@[a-z0-9._-]{2,24})/i);

  const defaultBrand = options.brief?.brandName?.trim() || handleMatch?.[1] || '@PENCEL.STUDIO';
  const hasExplicitHeadline = Boolean(options.brief?.headline?.trim());
  const hasExplicitCta = Boolean(options.brief?.ctaText?.trim());
  const carouselNumber = countMatch?.[1] ? countMatch[1].padStart(2, '0') : '05';
  const swipeLabel = lang === 'en' ? 'SWIPE ->' : lang === 'es' ? 'DESLIZA ->' : 'ARRASTE ->';

  const conciseHeadline =
    options.brief?.headline?.trim() ||
    (stripped.length > 4
      ? stripped.slice(0, 64).replace(/[.,;:]+$/, '')
      : lang === 'en'
        ? 'Design That Commands Attention'
        : lang === 'es'
          ? 'Diseño que Captura Miradas'
          : 'Design que Transforma Resultados');

  const localizedDefaults: Readonly<
    Record<
      CanonicalStyle,
      Record<
        'pt' | 'en' | 'es',
        Omit<
          ExtractedCopy,
          'headline' | 'brand' | 'imageQuery' | 'hasExplicitCta' | 'carouselNumber' | 'swipeLabel'
        >
      >
    >
  > = {
    promo: {
      pt: {
        badge: 'OFERTA EXCLUSIVA',
        subtitle: 'Condição especial por tempo limitado. Garanta antes que acabe.',
        cta: 'GARANTIR OFERTA',
        calloutStat: percentMatch?.[1]?.toUpperCase() ?? '50% OFF',
        calloutLabel: 'POR TEMPO LIMITADO',
        proofLeft: 'ENVIO IMEDIATO',
        proofRight: 'ESTOQUE LIMITADO',
      },
      en: {
        badge: 'LIMITED DROP',
        subtitle: 'Exclusive seasonal savings available while supplies last.',
        cta: 'CLAIM OFFER',
        calloutStat: percentMatch?.[1]?.toUpperCase() ?? '50% OFF',
        calloutLabel: 'LIMITED WINDOW',
        proofLeft: 'FAST SHIPPING',
        proofRight: 'LIMITED STOCK',
      },
      es: {
        badge: 'OFERTA EXCLUSIVA',
        subtitle: 'Descuento especial por tiempo limitado. Aprovecha hoy mismo.',
        cta: 'VER OFERTA',
        calloutStat: percentMatch?.[1]?.toUpperCase() ?? '50% OFF',
        calloutLabel: 'TIEMPO LIMITADO',
        proofLeft: 'ENVÍO RÁPIDO',
        proofRight: 'STOCK LIMITADO',
      },
    },
    tech: {
      pt: {
        badge: 'NOVA GERAÇÃO',
        subtitle: 'Fluxo inteligente, precisão visual e performance real no seu dia a dia.',
        cta: 'COMEÇAR AGORA',
        calloutStat: '10X',
        calloutLabel: 'MAIS VELOCIDADE',
        proofLeft: 'AUTOMAÇÃO IA',
        proofRight: 'TEMPO REAL',
      },
      en: {
        badge: 'NEXT RELEASE',
        subtitle: 'Intelligent workflow, optical precision, and studio-grade performance.',
        cta: 'GET STARTED',
        calloutStat: '10X',
        calloutLabel: 'FASTER OUTPUT',
        proofLeft: 'AI WORKFLOW',
        proofRight: 'REAL TIME',
      },
      es: {
        badge: 'NUEVA VERSIÓN',
        subtitle: 'Flujo inteligente, precisión visual y rendimiento real cada día.',
        cta: 'EMPEZAR AHORA',
        calloutStat: '10X',
        calloutLabel: 'MÁS VELOCIDAD',
        proofLeft: 'FLUJO IA',
        proofRight: 'TIEMPO REAL',
      },
    },
    minimal: {
      pt: {
        badge: 'DESIGN ESSENCIAL',
        subtitle: 'Harmonia entre forma, espaço negativo e clareza tipográfica.',
        cta: 'EXPLORAR MAIS',
        calloutStat: '01',
        calloutLabel: 'EDIÇÃO CURADA',
        proofLeft: 'GRID SUÍÇO',
        proofRight: 'ALTA CLAREZA',
      },
      en: {
        badge: 'ESSENTIAL CRAFT',
        subtitle: 'Quiet balance between proportion, negative space, and clarity.',
        cta: 'EXPLORE MORE',
        calloutStat: '01',
        calloutLabel: 'CURATED ISSUE',
        proofLeft: 'SWISS GRID',
        proofRight: 'PURE CLARITY',
      },
      es: {
        badge: 'DISEÑO ESENCIAL',
        subtitle: 'Equilibrio entre forma, espacio en blanco y claridad editorial.',
        cta: 'EXPLORAR MÁS',
        calloutStat: '01',
        calloutLabel: 'EDICIÓN CURADA',
        proofLeft: 'GRID SUIZO',
        proofRight: 'ALTA CLARIDAD',
      },
    },
    elegant: {
      pt: {
        badge: 'EDIÇÃO RESERVA',
        subtitle: 'Curadoria refinada para quem valoriza detalhes atemporais.',
        cta: 'CONHECER COLEÇÃO',
        calloutStat: '2026',
        calloutLabel: 'COLEÇÃO ATELIER',
        proofLeft: 'CURADORIA',
        proofRight: 'EXCLUSIVO',
      },
      en: {
        badge: 'PRIVATE EDITION',
        subtitle: 'Refined craft curated for discerning taste and timeless presence.',
        cta: 'VIEW COLLECTION',
        calloutStat: '2026',
        calloutLabel: 'ATELIER SERIES',
        proofLeft: 'BESPOKE',
        proofRight: 'SIGNATURE',
      },
      es: {
        badge: 'EDICIÓN RESERVA',
        subtitle: 'Curaduría refinada para quienes valoran los detalles atemporales.',
        cta: 'VER COLECCIÓN',
        calloutStat: '2026',
        calloutLabel: 'SERIE ATELIER',
        proofLeft: 'CURADURÍA',
        proofRight: 'EXCLUSIVO',
      },
    },
    vibrant: {
      pt: {
        badge: 'EXPERIÊNCIA AO VIVO',
        subtitle: 'Ideias ousadas, energia criativa e conexões que marcam presença.',
        cta: 'GARANTIR VAGA',
        calloutStat: 'AO VIVO',
        calloutLabel: 'INSCRIÇÕES ABERTAS',
        proofLeft: '100% PRÁTICO',
        proofRight: 'VAGAS LIMITADAS',
      },
      en: {
        badge: 'LIVE EXPERIENCE',
        subtitle: 'Bold ideas, creative momentum, and hands-on sessions built to inspire.',
        cta: 'RESERVE SEAT',
        calloutStat: 'LIVE',
        calloutLabel: 'OPEN REGISTRATION',
        proofLeft: 'HANDS-ON',
        proofRight: 'LIMITED SEATS',
      },
      es: {
        badge: 'EXPERIENCIA EN VIVO',
        subtitle: 'Ideas audaces, energía creativa y sesiones prácticas en directo.',
        cta: 'RESERVAR LUGAR',
        calloutStat: 'EN VIVO',
        calloutLabel: 'REGISTRO ABIERTO',
        proofLeft: '100% PRÁCTICO',
        proofRight: 'CUPOS LIMITADOS',
      },
    },
    editorial: {
      pt: {
        badge: 'MONOGRAPH • EDIÇÃO 04',
        subtitle: 'Perspectiva editorial contemporânea sobre direção de arte e forma.',
        cta: 'LER MATÉRIA',
        calloutStat: 'N° 04',
        calloutLabel: 'DESTAQUE EDITORIAL',
        proofLeft: 'DIREÇÃO DE ARTE',
        proofRight: 'ESTÚDIO',
      },
      en: {
        badge: 'MONOGRAPH • ISSUE 04',
        subtitle: 'Contemporary art direction examining proportion, voice, and visual craft.',
        cta: 'READ STORY',
        calloutStat: 'NO. 04',
        calloutLabel: 'FEATURE ESSAY',
        proofLeft: 'ART DIRECTION',
        proofRight: 'MONOGRAPH',
      },
      es: {
        badge: 'MONOGRAPH • EDICIÓN 04',
        subtitle: 'Perspectiva editorial contemporánea sobre dirección de arte y forma.',
        cta: 'LEER ARTÍCULO',
        calloutStat: 'N.° 04',
        calloutLabel: 'DESTACADO EDITORIAL',
        proofLeft: 'DIRECCIÓN DE ARTE',
        proofRight: 'ESTUDIO',
      },
    },
    organic: {
      pt: {
        badge: 'ORIGEM NATURAL',
        subtitle: 'Ingredientes selecionados e rotina consciente com equilíbrio real.',
        cta: 'DESCOBRIR AGORA',
        calloutStat: '100%',
        calloutLabel: 'BOTÂNICO & PURO',
        proofLeft: 'ARTESANAL',
        proofRight: 'SUSTENTÁVEL',
      },
      en: {
        badge: 'BOTANICAL CRAFT',
        subtitle: 'Thoughtfully sourced ingredients shaped for calm, everyday rituals.',
        cta: 'DISCOVER NOW',
        calloutStat: '100%',
        calloutLabel: 'PURE ORIGIN',
        proofLeft: 'SMALL BATCH',
        proofRight: 'SUSTAINABLE',
      },
      es: {
        badge: 'ORIGEN NATURAL',
        subtitle: 'Ingredientes seleccionados y rituales conscientes en equilibrio.',
        cta: 'DESCUBRIR AHORA',
        calloutStat: '100%',
        calloutLabel: 'PURO Y BOTÁNICO',
        proofLeft: 'ARTESANAL',
        proofRight: 'SOSTENIBLE',
      },
    },
  };

  const preset = localizedDefaults[style][lang];
  const headline = hasExplicitHeadline
    ? conciseHeadline
    : style === 'promo' || style === 'vibrant' || blueprint.domain === 'food-gastronomy'
      ? conciseHeadline.toUpperCase()
      : conciseHeadline;

  // Domain-authentic social defaults (prevents generic SaaS copy on gastronomy/carousel posts)
  const isFood = blueprint.domain === 'food-gastronomy';
  const isCarousel = blueprint.domain === 'education-carousel';
  const domainBadge = isFood
    ? lang === 'en'
      ? 'HOUSE SPECIAL'
      : lang === 'es'
        ? 'ESPECIAL DE LA CASA'
        : 'ESPECIAL DA CASA'
    : isCarousel
      ? lang === 'en'
        ? 'VISUAL GUIDE'
        : lang === 'es'
          ? 'GUÍA PRÁCTICA'
          : 'GUIA PRÁTICO'
      : preset.badge;
  const domainSubtitle = isFood
    ? lang === 'en'
      ? 'Crafted fresh to order with bold flavor and artisan ingredients.'
      : lang === 'es'
        ? 'Preparado al momento con ingredientes frescos y sabor artesanal.'
        : 'Preparado na hora com ingredientes selecionados e sabor artesanal.'
    : isCarousel
      ? lang === 'en'
        ? 'Practical principles you can apply immediately to elevate every piece.'
        : lang === 'es'
          ? 'Principios prácticos para aplicar hoy mismo en cada publicación.'
          : 'Princípios práticos para aplicar hoje mesmo e elevar o nível das suas artes.'
      : preset.subtitle;
  const domainCta = isFood
    ? lang === 'en'
      ? 'ORDER NOW'
      : lang === 'es'
        ? 'PEDIR AHORA'
        : 'PEÇA NO DELIVERY'
    : isCarousel
      ? swipeLabel
      : preset.cta;

  return {
    badge: domainBadge,
    headline,
    subtitle: domainSubtitle,
    cta: options.brief?.ctaText?.trim() || domainCta,
    hasExplicitCta,
    brand: defaultBrand,
    calloutStat:
      priceMatch?.[1]?.toUpperCase() ??
      percentMatch?.[1]?.toUpperCase() ??
      (isFood ? 'NOVO' : preset.calloutStat),
    calloutLabel: preset.calloutLabel,
    proofLeft: isFood ? (lang === 'en' ? 'FRESH DAILY' : 'FEITO NA HORA') : preset.proofLeft,
    proofRight: isFood ? (lang === 'en' ? 'DELIVERY' : 'DELIVERY') : preset.proofRight,
    imageQuery: inferImageQuery(rawPrompt, style),
    carouselNumber,
    swipeLabel,
  };
}

function applyBrandColorOverride(palette: CreativePalette, brandColor?: string): CreativePalette {
  const normalized = normalizeHexColor(brandColor);
  if (!normalized) return palette;
  return {
    ...palette,
    accent: normalized,
    highlight: normalized,
    textOnAccent: pickHighContrastTextColor(normalized),
  };
}

function buildBackgroundGradient(palette: CreativePalette): LayoutGradientSpec {
  return {
    type: 'linear',
    angle: 140,
    stops: [
      { offset: 0, color: palette.background },
      { offset: 1, color: palette.backgroundEnd },
    ],
  };
}

function buildFramedCardElements(
  w: number,
  h: number,
  palette: CreativePalette,
  copy: ExtractedCopy,
  includeImagery: boolean,
): CanvasLayoutElementDto[] {
  const elements: CanvasLayoutElementDto[] = [];
  const centerX = Math.round(w / 2);
  const minDim = Math.min(w, h);
  const isLandscape = w / Math.max(1, h) > 1.3;

  // Ambient decorative glows
  if (palette.isDark) {
    const glowR = Math.round(minDim * 0.4);
    elements.push({
      id: 'bg-accent-glow',
      type: 'circle',
      name: 'Brilho Decorativo',
      left: Math.round(centerX - glowR),
      top: Math.round(h * 0.12 - glowR * 0.45),
      radius: glowR,
      fill: palette.accent,
      opacity: 0.16,
    });
    const glowR2 = Math.round(minDim * 0.24);
    elements.push({
      id: 'bg-secondary-glow',
      type: 'circle',
      name: 'Brilho Secundário',
      left: Math.round(w * 0.78 - glowR2),
      top: Math.round(h * 0.76 - glowR2 * 0.5),
      radius: glowR2,
      fill: palette.accentSecondary,
      opacity: 0.12,
    });
  }

  const cardW = Math.round(w * (isLandscape ? 0.86 : 0.88));
  const cardH = Math.round(h * (isLandscape ? 0.8 : 0.78));
  const cardLeft = Math.round((w - cardW) / 2);
  const cardTop = Math.round((h - cardH) / 2);

  elements.push({
    id: 'container-card',
    type: 'rect',
    name: 'Cartão Estrutural',
    left: cardLeft,
    top: cardTop,
    width: cardW,
    height: cardH,
    rx: 28,
    ry: 28,
    fill: palette.cardBg,
    stroke: palette.border,
    strokeWidth: 1.5,
    opacity: 0.96,
    shadow: {
      color: palette.isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(15, 23, 42, 0.1)',
      blur: 36,
      offsetX: 0,
      offsetY: 16,
    },
  });

  // Top hairline accent stripe inside card
  const ruleW = Math.round(cardW * 0.18);
  elements.push({
    id: 'card-top-rule',
    type: 'line',
    name: 'Linha de Destaque',
    left: Math.round(centerX - ruleW / 2),
    top: cardTop + Math.round(cardH * 0.055),
    width: ruleW,
    height: 4,
    rx: 2,
    ry: 2,
    fillGradient: {
      type: 'linear',
      angle: 90,
      stops: [
        { offset: 0, color: palette.accent },
        { offset: 1, color: palette.accentSecondary },
      ],
    },
    fill: palette.accent,
  });

  if (isLandscape) {
    // Balanced 2-column inside elevated card
    const padX = Math.round(cardW * 0.065);
    const leftColW = Math.round(cardW * (includeImagery ? 0.54 : 0.6));
    const colLeft = cardLeft + padX;

    const badgeW = Math.min(260, Math.max(168, copy.badge.length * 10 + 36));
    const badgeH = 36;
    const badgeTop = cardTop + Math.round(cardH * 0.13);

    elements.push(
      {
        id: 'badge-pill',
        type: 'rect',
        name: 'Pílula Badge',
        left: colLeft,
        top: badgeTop,
        width: badgeW,
        height: badgeH,
        rx: 18,
        ry: 18,
        fill: palette.accent,
        opacity: 0.16,
        stroke: palette.accent,
        strokeWidth: 1,
      },
      {
        id: 'badge-text',
        type: 'textbox',
        name: 'Texto Badge',
        left: colLeft,
        top: badgeTop + 10,
        width: badgeW,
        text: copy.badge,
        fontSize: 13,
        fontWeight: 700,
        fontFamily: palette.monoFont,
        charSpacing: 110,
        fill: palette.isDark ? palette.highlight : palette.accent,
        textAlign: 'center',
      },
    );

    const headlineFontSize = Math.max(40, Math.min(72, Math.round(minDim * 0.068)));
    const headlineTop = badgeTop + badgeH + Math.round(cardH * 0.055);
    elements.push({
      id: 'title-headline',
      type: 'textbox',
      name: 'Título Principal',
      left: colLeft,
      top: headlineTop,
      width: leftColW,
      text: copy.headline,
      fontSize: headlineFontSize,
      fontWeight: 800,
      fontFamily: palette.displayFont,
      lineHeight: 1.08,
      fill: palette.textPrimary,
      textAlign: 'left',
    });

    const subtitleTop = headlineTop + Math.round(headlineFontSize * 2.45) + 18;
    const subtitleFontSize = Math.max(18, Math.min(26, Math.round(minDim * 0.025)));
    elements.push({
      id: 'subtitle-copy',
      type: 'textbox',
      name: 'Subtítulo',
      left: colLeft,
      top: subtitleTop,
      width: Math.round(leftColW * 0.92),
      text: copy.subtitle,
      fontSize: subtitleFontSize,
      fontWeight: 400,
      fontFamily: palette.bodyFont,
      lineHeight: 1.42,
      fill: palette.textSecondary,
      textAlign: 'left',
    });

    const ctaW = Math.min(310, Math.round(leftColW * 0.56));
    const ctaH = 58;
    const ctaTop = Math.min(
      cardTop + cardH - ctaH - 44,
      subtitleTop + Math.round(subtitleFontSize * 3.4) + 28,
    );
    elements.push(
      {
        id: 'cta-btn-shape',
        type: 'rect',
        name: 'Botão CTA',
        left: colLeft,
        top: ctaTop,
        width: ctaW,
        height: ctaH,
        rx: 29,
        ry: 29,
        fill: palette.accent,
        fillGradient: {
          type: 'linear',
          angle: 90,
          stops: [
            { offset: 0, color: palette.accent },
            { offset: 1, color: palette.accentSecondary },
          ],
        },
        shadow: {
          color: 'rgba(0, 0, 0, 0.28)',
          blur: 20,
          offsetX: 0,
          offsetY: 8,
        },
      },
      {
        id: 'cta-btn-text',
        type: 'textbox',
        name: 'Texto CTA',
        left: colLeft,
        top: ctaTop + 18,
        width: ctaW,
        text: copy.cta,
        fontSize: 17,
        fontWeight: 700,
        fontFamily: palette.bodyFont,
        charSpacing: 60,
        fill: palette.textOnAccent,
        textAlign: 'center',
      },
    );

    // Right spotlight panel (Image or Metric Highlight Tile)
    const rightLeft = colLeft + leftColW + Math.round(cardW * 0.04);
    const rightW = cardLeft + cardW - padX - rightLeft;
    const rightTop = cardTop + Math.round(cardH * 0.13);
    const rightH = Math.round(cardH * 0.74);

    if (includeImagery) {
      elements.push({
        id: 'spotlight-photo',
        type: 'image',
        name: 'Fotografia Destaque',
        left: rightLeft,
        top: rightTop,
        width: rightW,
        height: rightH,
        borderRadius: 20,
        objectFit: 'cover',
        imageQuery: copy.imageQuery,
        fill: palette.subCardBg,
      });
    } else {
      elements.push(
        {
          id: 'spotlight-tile',
          type: 'rect',
          name: 'Painel Destaque',
          left: rightLeft,
          top: rightTop,
          width: rightW,
          height: rightH,
          rx: 22,
          ry: 22,
          fill: palette.subCardBg,
          stroke: palette.border,
          strokeWidth: 1,
        },
        {
          id: 'spotlight-stat',
          type: 'textbox',
          name: 'Métrica Destaque',
          left: rightLeft + 24,
          top: rightTop + Math.round(rightH * 0.3),
          width: rightW - 48,
          text: copy.calloutStat,
          fontSize: Math.max(48, Math.round(rightW * 0.22)),
          fontWeight: 900,
          fontFamily: palette.displayFont,
          fill: palette.isDark ? palette.highlight : palette.accent,
          textAlign: 'center',
        },
        {
          id: 'spotlight-label',
          type: 'textbox',
          name: 'Legenda Métrica',
          left: rightLeft + 24,
          top: rightTop + Math.round(rightH * 0.56),
          width: rightW - 48,
          text: copy.calloutLabel,
          fontSize: 15,
          fontWeight: 600,
          fontFamily: palette.monoFont,
          charSpacing: 120,
          fill: palette.textSecondary,
          textAlign: 'center',
        },
      );
    }
  } else {
    // Square or Portrait centered vertical hierarchy
    const badgeW = Math.min(Math.round(cardW * 0.68), Math.max(190, copy.badge.length * 11 + 40));
    const badgeH = 38;
    const badgeTop = cardTop + Math.round(cardH * 0.1);

    elements.push(
      {
        id: 'badge-pill',
        type: 'rect',
        name: 'Pílula Badge',
        left: Math.round(centerX - badgeW / 2),
        top: badgeTop,
        width: badgeW,
        height: badgeH,
        rx: 19,
        ry: 19,
        fill: palette.accent,
        opacity: 0.16,
        stroke: palette.accent,
        strokeWidth: 1,
      },
      {
        id: 'badge-text',
        type: 'textbox',
        name: 'Texto Badge',
        left: Math.round(centerX - badgeW / 2),
        top: badgeTop + 10,
        width: badgeW,
        text: copy.badge,
        fontSize: 14,
        fontWeight: 700,
        fontFamily: palette.monoFont,
        charSpacing: 120,
        fill: palette.isDark ? palette.highlight : palette.accent,
        textAlign: 'center',
      },
    );

    const headlineW = Math.round(cardW * 0.84);
    const headlineTop = badgeTop + badgeH + Math.round(cardH * 0.055);
    const headlineFontSize = Math.max(40, Math.min(76, Math.round(w * 0.064)));

    elements.push({
      id: 'title-headline',
      type: 'textbox',
      name: 'Título Principal',
      left: Math.round(centerX - headlineW / 2),
      top: headlineTop,
      width: headlineW,
      text: copy.headline,
      fontSize: headlineFontSize,
      fontWeight: 800,
      fontFamily: palette.displayFont,
      lineHeight: 1.08,
      fill: palette.textPrimary,
      textAlign: 'center',
    });

    const subtitleW = Math.round(cardW * 0.76);
    const subtitleFontSize = Math.max(17, Math.min(26, Math.round(w * 0.024)));
    const subtitleTop = headlineTop + Math.round(headlineFontSize * 2.5) + 20;

    elements.push({
      id: 'subtitle-copy',
      type: 'textbox',
      name: 'Subtítulo',
      left: Math.round(centerX - subtitleW / 2),
      top: subtitleTop,
      width: subtitleW,
      text: copy.subtitle,
      fontSize: subtitleFontSize,
      fontWeight: 400,
      fontFamily: palette.bodyFont,
      lineHeight: 1.42,
      fill: palette.textSecondary,
      textAlign: 'center',
    });

    if (includeImagery) {
      const imgW = Math.round(cardW * 0.8);
      const imgH = Math.round(cardH * 0.26);
      const imgTop = subtitleTop + Math.round(subtitleFontSize * 3) + 22;
      elements.push({
        id: 'card-photo-banner',
        type: 'image',
        name: 'Imagem de Apoio',
        left: Math.round(centerX - imgW / 2),
        top: imgTop,
        width: imgW,
        height: imgH,
        borderRadius: 18,
        objectFit: 'cover',
        imageQuery: copy.imageQuery,
        fill: palette.subCardBg,
      });
    } else {
      // Twin proof chips for visual richness
      const chipW = Math.round(cardW * 0.34);
      const chipH = 38;
      const chipGap = 16;
      const chipTop = Math.min(
        cardTop + cardH - 175,
        subtitleTop + Math.round(subtitleFontSize * 3.2) + 26,
      );
      const leftChipX = centerX - chipW - Math.round(chipGap / 2);
      const rightChipX = centerX + Math.round(chipGap / 2);

      elements.push(
        {
          id: 'proof-chip-left',
          type: 'rect',
          name: 'Chip Destaque 1',
          left: leftChipX,
          top: chipTop,
          width: chipW,
          height: chipH,
          rx: 10,
          ry: 10,
          fill: palette.subCardBg,
          stroke: palette.border,
          strokeWidth: 1,
        },
        {
          id: 'proof-chip-left-text',
          type: 'textbox',
          name: 'Texto Destaque 1',
          left: leftChipX,
          top: chipTop + 11,
          width: chipW,
          text: copy.proofLeft,
          fontSize: 13,
          fontWeight: 600,
          fontFamily: palette.monoFont,
          charSpacing: 80,
          fill: palette.textPrimary,
          textAlign: 'center',
        },
        {
          id: 'proof-chip-right',
          type: 'rect',
          name: 'Chip Destaque 2',
          left: rightChipX,
          top: chipTop,
          width: chipW,
          height: chipH,
          rx: 10,
          ry: 10,
          fill: palette.subCardBg,
          stroke: palette.border,
          strokeWidth: 1,
        },
        {
          id: 'proof-chip-right-text',
          type: 'textbox',
          name: 'Texto Destaque 2',
          left: rightChipX,
          top: chipTop + 11,
          width: chipW,
          text: copy.proofRight,
          fontSize: 13,
          fontWeight: 600,
          fontFamily: palette.monoFont,
          charSpacing: 80,
          fill: palette.textPrimary,
          textAlign: 'center',
        },
      );
    }

    const ctaW = Math.round(Math.min(360, cardW * 0.64));
    const ctaH = 60;
    const ctaTop = cardTop + cardH - ctaH - Math.round(cardH * 0.08);
    elements.push(
      {
        id: 'cta-btn-shape',
        type: 'rect',
        name: 'Botão CTA',
        left: Math.round(centerX - ctaW / 2),
        top: ctaTop,
        width: ctaW,
        height: ctaH,
        rx: 30,
        ry: 30,
        fill: palette.accent,
        fillGradient: {
          type: 'linear',
          angle: 90,
          stops: [
            { offset: 0, color: palette.accent },
            { offset: 1, color: palette.accentSecondary },
          ],
        },
        shadow: {
          color: 'rgba(0, 0, 0, 0.25)',
          blur: 22,
          offsetX: 0,
          offsetY: 8,
        },
      },
      {
        id: 'cta-btn-text',
        type: 'textbox',
        name: 'Texto CTA',
        left: Math.round(centerX - ctaW / 2),
        top: ctaTop + 19,
        width: ctaW,
        text: copy.cta,
        fontSize: 18,
        fontWeight: 700,
        fontFamily: palette.bodyFont,
        charSpacing: 60,
        fill: palette.textOnAccent,
        textAlign: 'center',
      },
    );
  }

  // Brand footer outside card
  elements.push({
    id: 'footer-brand',
    type: 'textbox',
    name: 'Rodapé Marca',
    left: Math.round(centerX - 180),
    top: Math.min(h - 32, cardTop + cardH + Math.round(h * 0.025)),
    width: 360,
    text: copy.brand.toUpperCase(),
    fontSize: 12,
    fontWeight: 600,
    fontFamily: palette.monoFont,
    charSpacing: 160,
    fill: palette.textSecondary,
    textAlign: 'center',
  });

  return elements;
}

function buildEditorialSplitElements(
  w: number,
  h: number,
  palette: CreativePalette,
  copy: ExtractedCopy,
  includeImagery: boolean,
): CanvasLayoutElementDto[] {
  const elements: CanvasLayoutElementDto[] = [];
  const isPortrait = h / Math.max(1, w) > 1.25;
  const padX = Math.round(w * 0.07);
  const padY = Math.round(h * 0.075);

  if (isPortrait) {
    // Upper visual showcase + lower editorial copy block
    const visualH = Math.round(h * 0.38);
    if (includeImagery) {
      elements.push({
        id: 'split-hero-photo',
        type: 'image',
        name: 'Foto Editorial',
        left: padX,
        top: padY,
        width: w - padX * 2,
        height: visualH,
        borderRadius: 24,
        objectFit: 'cover',
        imageQuery: copy.imageQuery,
        fill: palette.cardBg,
      });
    } else {
      elements.push(
        {
          id: 'split-hero-panel',
          type: 'rect',
          name: 'Painel Visual',
          left: padX,
          top: padY,
          width: w - padX * 2,
          height: visualH,
          rx: 24,
          ry: 24,
          fill: palette.cardBg,
          fillGradient: {
            type: 'linear',
            angle: 135,
            stops: [
              { offset: 0, color: palette.cardBg },
              { offset: 1, color: palette.subCardBg },
            ],
          },
          stroke: palette.border,
          strokeWidth: 1.5,
        },
        {
          id: 'split-hero-orb',
          type: 'circle',
          name: 'Forma Geométrica',
          left: Math.round(w * 0.56),
          top: padY + Math.round(visualH * 0.14),
          radius: Math.round(visualH * 0.34),
          fill: palette.accent,
          opacity: 0.25,
        },
        {
          id: 'split-hero-stat',
          type: 'textbox',
          name: 'Número Destaque',
          left: padX + 36,
          top: padY + Math.round(visualH * 0.3),
          width: w - padX * 2 - 72,
          text: copy.calloutStat,
          fontSize: Math.round(w * 0.14),
          fontWeight: 900,
          fontFamily: palette.displayFont,
          fill: palette.isDark ? palette.highlight : palette.accent,
          textAlign: 'left',
        },
        {
          id: 'split-hero-stat-label',
          type: 'textbox',
          name: 'Rótulo Destaque',
          left: padX + 36,
          top: padY + Math.round(visualH * 0.68),
          width: w - padX * 2 - 72,
          text: copy.calloutLabel,
          fontSize: 16,
          fontWeight: 700,
          fontFamily: palette.monoFont,
          charSpacing: 150,
          fill: palette.textSecondary,
          textAlign: 'left',
        },
      );
    }

    const textTop = padY + visualH + Math.round(h * 0.045);
    const contentW = w - padX * 2;
    const headlineSize = Math.max(46, Math.round(w * 0.068));

    elements.push(
      {
        id: 'split-accent-bar',
        type: 'line',
        name: 'Barra Editorial',
        left: padX,
        top: textTop,
        width: 72,
        height: 5,
        rx: 3,
        ry: 3,
        fill: palette.accent,
      },
      {
        id: 'badge-text',
        type: 'textbox',
        name: 'Texto Badge',
        left: padX,
        top: textTop + 20,
        width: contentW,
        text: copy.badge,
        fontSize: 15,
        fontWeight: 700,
        fontFamily: palette.monoFont,
        charSpacing: 160,
        fill: palette.isDark ? palette.highlight : palette.accent,
        textAlign: 'left',
      },
      {
        id: 'title-headline',
        type: 'textbox',
        name: 'Título Principal',
        left: padX,
        top: textTop + 58,
        width: contentW,
        text: copy.headline,
        fontSize: headlineSize,
        fontWeight: 800,
        fontFamily: palette.displayFont,
        lineHeight: 1.06,
        fill: palette.textPrimary,
        textAlign: 'left',
      },
      {
        id: 'subtitle-copy',
        type: 'textbox',
        name: 'Subtítulo',
        left: padX,
        top: textTop + 58 + Math.round(headlineSize * 3.1) + 20,
        width: Math.round(contentW * 0.9),
        text: copy.subtitle,
        fontSize: Math.max(20, Math.round(w * 0.026)),
        fontWeight: 400,
        fontFamily: palette.bodyFont,
        lineHeight: 1.45,
        fill: palette.textSecondary,
        textAlign: 'left',
      },
      {
        id: 'cta-btn-shape',
        type: 'rect',
        name: 'Botão CTA',
        left: padX,
        top: h - padY - 110,
        width: Math.min(360, contentW),
        height: 64,
        rx: 14,
        ry: 14,
        fill: palette.accent,
      },
      {
        id: 'cta-btn-text',
        type: 'textbox',
        name: 'Texto CTA',
        left: padX,
        top: h - padY - 90,
        width: Math.min(360, contentW),
        text: copy.cta,
        fontSize: 19,
        fontWeight: 700,
        fontFamily: palette.bodyFont,
        charSpacing: 80,
        fill: palette.textOnAccent,
        textAlign: 'center',
      },
      {
        id: 'footer-brand',
        type: 'textbox',
        name: 'Rodapé Marca',
        left: padX,
        top: h - padY - 26,
        width: contentW,
        text: copy.brand.toUpperCase(),
        fontSize: 13,
        fontWeight: 600,
        fontFamily: palette.monoFont,
        charSpacing: 160,
        fill: palette.textSecondary,
        textAlign: 'left',
      },
    );
    return elements;
  }

  // Asymmetric 2-column split for square & landscape
  const leftW = Math.round(w * 0.52);
  const rightLeft = padX + leftW + Math.round(w * 0.04);
  const rightW = w - rightLeft - padX;
  const headlineSize = Math.max(40, Math.min(72, Math.round(Math.min(w, h) * 0.068)));

  // Vertical editorial accent spine on left margin
  elements.push({
    id: 'editorial-spine',
    type: 'rect',
    name: 'Linha Vertical Editorial',
    left: Math.round(padX * 0.45),
    top: padY,
    width: 6,
    height: h - padY * 2,
    rx: 3,
    ry: 3,
    fill: palette.accent,
  });

  // Left typographic column
  elements.push(
    {
      id: 'badge-text',
      type: 'textbox',
      name: 'Texto Badge',
      left: padX,
      top: padY + 8,
      width: leftW,
      text: copy.badge,
      fontSize: 14,
      fontWeight: 700,
      fontFamily: palette.monoFont,
      charSpacing: 160,
      fill: palette.isDark ? palette.highlight : palette.accent,
      textAlign: 'left',
    },
    {
      id: 'title-headline',
      type: 'textbox',
      name: 'Título Principal',
      left: padX,
      top: padY + Math.round(h * 0.09),
      width: leftW,
      text: copy.headline,
      fontSize: headlineSize,
      fontWeight: 800,
      fontFamily: palette.displayFont,
      lineHeight: 1.06,
      fill: palette.textPrimary,
      textAlign: 'left',
    },
    {
      id: 'editorial-divider',
      type: 'line',
      name: 'Divisor Editorial',
      left: padX,
      top: padY + Math.round(h * 0.48),
      width: Math.round(leftW * 0.4),
      height: 2,
      fill: palette.border,
    },
    {
      id: 'subtitle-copy',
      type: 'textbox',
      name: 'Subtítulo',
      left: padX,
      top: padY + Math.round(h * 0.52),
      width: Math.round(leftW * 0.94),
      text: copy.subtitle,
      fontSize: Math.max(17, Math.min(24, Math.round(Math.min(w, h) * 0.024))),
      fontWeight: 400,
      fontFamily: palette.bodyFont,
      lineHeight: 1.45,
      fill: palette.textSecondary,
      textAlign: 'left',
    },
    {
      id: 'cta-btn-shape',
      type: 'rect',
      name: 'Botão CTA',
      left: padX,
      top: h - padY - 96,
      width: Math.min(300, Math.round(leftW * 0.72)),
      height: 56,
      rx: 12,
      ry: 12,
      fill: palette.accent,
      shadow: {
        color: 'rgba(0, 0, 0, 0.22)',
        blur: 18,
        offsetX: 0,
        offsetY: 8,
      },
    },
    {
      id: 'cta-btn-text',
      type: 'textbox',
      name: 'Texto CTA',
      left: padX,
      top: h - padY - 78,
      width: Math.min(300, Math.round(leftW * 0.72)),
      text: copy.cta,
      fontSize: 16,
      fontWeight: 700,
      fontFamily: palette.bodyFont,
      charSpacing: 60,
      fill: palette.textOnAccent,
      textAlign: 'center',
    },
    {
      id: 'footer-brand',
      type: 'textbox',
      name: 'Rodapé Marca',
      left: padX,
      top: h - padY - 20,
      width: leftW,
      text: copy.brand.toUpperCase(),
      fontSize: 12,
      fontWeight: 600,
      fontFamily: palette.monoFont,
      charSpacing: 150,
      fill: palette.textSecondary,
      textAlign: 'left',
    },
  );

  // Right visual showcase column
  if (includeImagery) {
    elements.push({
      id: 'split-right-photo',
      type: 'image',
      name: 'Fotografia Lateral',
      left: rightLeft,
      top: padY,
      width: rightW,
      height: h - padY * 2,
      borderRadius: 22,
      objectFit: 'cover',
      imageQuery: copy.imageQuery,
      fill: palette.cardBg,
    });
  } else {
    const panelH = h - padY * 2;
    elements.push(
      {
        id: 'split-visual-card',
        type: 'rect',
        name: 'Bloco Visual Direito',
        left: rightLeft,
        top: padY,
        width: rightW,
        height: panelH,
        rx: 24,
        ry: 24,
        fill: palette.cardBg,
        fillGradient: {
          type: 'linear',
          angle: 160,
          stops: [
            { offset: 0, color: palette.cardBg },
            { offset: 1, color: palette.subCardBg },
          ],
        },
        stroke: palette.border,
        strokeWidth: 1.5,
      },
      {
        id: 'split-accent-circle',
        type: 'circle',
        name: 'Esfera Decorativa',
        left: rightLeft + Math.round(rightW * 0.18),
        top: padY + Math.round(panelH * 0.14),
        radius: Math.round(Math.min(rightW, panelH) * 0.34),
        fill: palette.accent,
        opacity: 0.22,
      },
      {
        id: 'split-stat-big',
        type: 'textbox',
        name: 'Destaque Numérico',
        left: rightLeft + 20,
        top: padY + Math.round(panelH * 0.38),
        width: rightW - 40,
        text: copy.calloutStat,
        fontSize: Math.max(44, Math.min(84, Math.round(rightW * 0.24))),
        fontWeight: 900,
        fontFamily: palette.displayFont,
        fill: palette.isDark ? palette.highlight : palette.accent,
        textAlign: 'center',
      },
      {
        id: 'split-stat-caption',
        type: 'textbox',
        name: 'Legenda Destaque',
        left: rightLeft + 20,
        top: padY + Math.round(panelH * 0.6),
        width: rightW - 40,
        text: copy.calloutLabel,
        fontSize: 14,
        fontWeight: 700,
        fontFamily: palette.monoFont,
        charSpacing: 130,
        fill: palette.textSecondary,
        textAlign: 'center',
      },
      {
        id: 'split-bottom-tag',
        type: 'rect',
        name: 'Etiqueta Inferior',
        left: rightLeft + Math.round(rightW * 0.14),
        top: padY + panelH - 72,
        width: Math.round(rightW * 0.72),
        height: 40,
        rx: 20,
        ry: 20,
        fill: palette.accent,
        opacity: 0.18,
      },
      {
        id: 'split-bottom-tag-text',
        type: 'textbox',
        name: 'Texto Etiqueta',
        left: rightLeft + Math.round(rightW * 0.14),
        top: padY + panelH - 61,
        width: Math.round(rightW * 0.72),
        text: copy.proofLeft,
        fontSize: 12,
        fontWeight: 700,
        fontFamily: palette.monoFont,
        charSpacing: 100,
        fill: palette.isDark ? palette.highlight : palette.accent,
        textAlign: 'center',
      },
    );
  }

  return elements;
}

function buildBoldTypoElements(
  w: number,
  h: number,
  palette: CreativePalette,
  copy: ExtractedCopy,
): CanvasLayoutElementDto[] {
  const minDim = Math.min(w, h);
  const padX = Math.round(w * 0.065);
  const padY = Math.round(h * 0.065);
  const contentW = w - padX * 2;
  const headlineSize = Math.max(52, Math.min(108, Math.round(minDim * 0.095)));

  const starRadius = Math.max(56, Math.round(minDim * 0.1));
  const starLeft = w - padX - starRadius * 2;
  const starTop = padY;

  return [
    {
      id: 'poster-top-band',
      type: 'rect',
      name: 'Faixa Geométrica Superior',
      left: 0,
      top: 0,
      width: w,
      height: 14,
      fill: palette.accent,
    },
    {
      id: 'poster-diagonal-accent',
      type: 'rect',
      name: 'Bloco Diagonal',
      left: Math.round(w * 0.62),
      top: Math.round(h * -0.06),
      width: Math.round(w * 0.46),
      height: Math.round(h * 0.36),
      rx: 24,
      ry: 24,
      fill: palette.accent,
      opacity: 0.14,
      angle: -10,
    },
    {
      id: 'badge-text',
      type: 'textbox',
      name: 'Texto Badge',
      left: padX,
      top: padY + 14,
      width: Math.round(contentW * 0.65),
      text: copy.badge,
      fontSize: 16,
      fontWeight: 700,
      fontFamily: palette.monoFont,
      charSpacing: 180,
      fill: palette.isDark ? palette.highlight : palette.accent,
      textAlign: 'left',
    },
    {
      id: 'promo-star-seal',
      type: 'polygon',
      name: 'Selo Destaque',
      left: starLeft,
      top: starTop,
      width: starRadius * 2,
      height: starRadius * 2,
      radius: starRadius,
      sides: 10,
      isStar: true,
      fill: palette.accent,
      angle: -8,
      shadow: {
        color: 'rgba(0, 0, 0, 0.3)',
        blur: 20,
        offsetX: 0,
        offsetY: 8,
      },
    },
    {
      id: 'promo-star-text',
      type: 'textbox',
      name: 'Texto Selo',
      left: starLeft + 10,
      top: starTop + Math.round(starRadius * 0.72),
      width: starRadius * 2 - 20,
      text: copy.calloutStat,
      fontSize: Math.max(20, Math.round(starRadius * 0.34)),
      fontWeight: 900,
      fontFamily: palette.displayFont,
      fill: palette.textOnAccent,
      textAlign: 'center',
      angle: -8,
    },
    {
      id: 'poster-rule-top',
      type: 'line',
      name: 'Regra Superior',
      left: padX,
      top: padY + Math.round(h * 0.12),
      width: contentW,
      height: 2,
      fill: palette.border,
    },
    {
      id: 'title-headline',
      type: 'textbox',
      name: 'Título Principal',
      left: padX,
      top: padY + Math.round(h * 0.16),
      width: contentW,
      text: copy.headline.toUpperCase(),
      fontSize: headlineSize,
      fontWeight: 900,
      fontFamily: palette.displayFont,
      lineHeight: 0.98,
      fill: palette.textPrimary,
      textAlign: 'left',
    },
    {
      id: 'subtitle-copy',
      type: 'textbox',
      name: 'Subtítulo',
      left: padX,
      top: Math.round(h * 0.62),
      width: Math.round(contentW * 0.78),
      text: copy.subtitle,
      fontSize: Math.max(18, Math.min(28, Math.round(minDim * 0.027))),
      fontWeight: 500,
      fontFamily: palette.bodyFont,
      lineHeight: 1.4,
      fill: palette.textSecondary,
      textAlign: 'left',
    },
    {
      id: 'poster-bottom-bar',
      type: 'rect',
      name: 'Barra Inferior',
      left: padX,
      top: h - padY - 82,
      width: contentW,
      height: 74,
      rx: 18,
      ry: 18,
      fill: palette.cardBg,
      stroke: palette.border,
      strokeWidth: 1.5,
    },
    {
      id: 'footer-brand',
      type: 'textbox',
      name: 'Rodapé Marca',
      left: padX + 24,
      top: h - padY - 54,
      width: Math.round(contentW * 0.48),
      text: copy.brand.toUpperCase(),
      fontSize: 15,
      fontWeight: 700,
      fontFamily: palette.monoFont,
      charSpacing: 140,
      fill: palette.textPrimary,
      textAlign: 'left',
    },
    {
      id: 'cta-btn-shape',
      type: 'rect',
      name: 'Botão CTA',
      left: padX + contentW - Math.min(280, Math.round(contentW * 0.42)) - 12,
      top: h - padY - 70,
      width: Math.min(280, Math.round(contentW * 0.42)),
      height: 50,
      rx: 12,
      ry: 12,
      fill: palette.accent,
    },
    {
      id: 'cta-btn-text',
      type: 'textbox',
      name: 'Texto CTA',
      left: padX + contentW - Math.min(280, Math.round(contentW * 0.42)) - 12,
      top: h - padY - 55,
      width: Math.min(280, Math.round(contentW * 0.42)),
      text: copy.cta,
      fontSize: 16,
      fontWeight: 800,
      fontFamily: palette.bodyFont,
      charSpacing: 60,
      fill: palette.textOnAccent,
      textAlign: 'center',
    },
  ];
}

function buildHeroBentoElements(
  w: number,
  h: number,
  palette: CreativePalette,
  copy: ExtractedCopy,
  includeImagery: boolean,
): CanvasLayoutElementDto[] {
  const pad = Math.round(Math.min(w, h) * 0.055);
  const gap = Math.max(16, Math.round(Math.min(w, h) * 0.022));
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const heroH = Math.round(innerH * 0.58);
  const bottomTop = pad + heroH + gap;
  const bottomH = innerH - heroH - gap;
  const halfW = Math.round((innerW - gap) / 2);

  const headlineSize = Math.max(42, Math.min(74, Math.round(Math.min(w, h) * 0.068)));

  const elements: CanvasLayoutElementDto[] = [
    // Primary Hero Bento Tile
    {
      id: 'bento-hero-tile',
      type: 'rect',
      name: 'Bento Principal',
      left: pad,
      top: pad,
      width: innerW,
      height: heroH,
      rx: 26,
      ry: 26,
      fill: palette.cardBg,
      stroke: palette.border,
      strokeWidth: 1.5,
      shadow: {
        color: palette.isDark ? 'rgba(0, 0, 0, 0.36)' : 'rgba(15, 23, 42, 0.08)',
        blur: 28,
        offsetX: 0,
        offsetY: 12,
      },
    },
    {
      id: 'badge-pill',
      type: 'rect',
      name: 'Pílula Badge',
      left: pad + 36,
      top: pad + 32,
      width: Math.min(260, Math.max(168, copy.badge.length * 10 + 36)),
      height: 36,
      rx: 18,
      ry: 18,
      fill: palette.accent,
      opacity: 0.16,
      stroke: palette.accent,
      strokeWidth: 1,
    },
    {
      id: 'badge-text',
      type: 'textbox',
      name: 'Texto Badge',
      left: pad + 36,
      top: pad + 42,
      width: Math.min(260, Math.max(168, copy.badge.length * 10 + 36)),
      text: copy.badge,
      fontSize: 13,
      fontWeight: 700,
      fontFamily: palette.monoFont,
      charSpacing: 110,
      fill: palette.isDark ? palette.highlight : palette.accent,
      textAlign: 'center',
    },
    {
      id: 'title-headline',
      type: 'textbox',
      name: 'Título Principal',
      left: pad + 36,
      top: pad + 92,
      width: innerW - 72,
      text: copy.headline,
      fontSize: headlineSize,
      fontWeight: 800,
      fontFamily: palette.displayFont,
      lineHeight: 1.06,
      fill: palette.textPrimary,
      textAlign: 'left',
    },
    {
      id: 'subtitle-copy',
      type: 'textbox',
      name: 'Subtítulo',
      left: pad + 36,
      top: pad + heroH - Math.max(90, Math.round(heroH * 0.24)),
      width: Math.round((innerW - 72) * 0.85),
      text: copy.subtitle,
      fontSize: Math.max(17, Math.min(24, Math.round(Math.min(w, h) * 0.023))),
      fontWeight: 400,
      fontFamily: palette.bodyFont,
      lineHeight: 1.4,
      fill: palette.textSecondary,
      textAlign: 'left',
    },
    // Bottom-Left Accent Stat / Visual Tile
    ...(includeImagery
      ? [
          {
            id: 'bento-photo-tile',
            type: 'image' as const,
            name: 'Bento Fotografia',
            left: pad,
            top: bottomTop,
            width: halfW,
            height: bottomH,
            borderRadius: 24,
            objectFit: 'cover' as const,
            imageQuery: copy.imageQuery,
            fill: palette.subCardBg,
          },
        ]
      : [
          {
            id: 'bento-metric-tile',
            type: 'rect' as const,
            name: 'Bento Métrica',
            left: pad,
            top: bottomTop,
            width: halfW,
            height: bottomH,
            rx: 24,
            ry: 24,
            fill: palette.accent,
            fillGradient: {
              type: 'linear' as const,
              angle: 135,
              stops: [
                { offset: 0, color: palette.accent },
                { offset: 1, color: palette.accentSecondary },
              ],
            },
          },
          {
            id: 'bento-metric-value',
            type: 'textbox' as const,
            name: 'Valor Métrica',
            left: pad + 28,
            top: bottomTop + Math.round(bottomH * 0.22),
            width: halfW - 56,
            text: copy.calloutStat,
            fontSize: Math.max(42, Math.min(78, Math.round(halfW * 0.2))),
            fontWeight: 900 as const,
            fontFamily: palette.displayFont,
            fill: palette.textOnAccent,
            textAlign: 'left' as const,
          },
          {
            id: 'bento-metric-label',
            type: 'textbox' as const,
            name: 'Rótulo Métrica',
            left: pad + 28,
            top: bottomTop + Math.round(bottomH * 0.62),
            width: halfW - 56,
            text: copy.calloutLabel,
            fontSize: 14,
            fontWeight: 700 as const,
            fontFamily: palette.monoFont,
            charSpacing: 110,
            fill: palette.textOnAccent,
            textAlign: 'left' as const,
          },
        ]),
    // Bottom-Right Action & Brand Tile
    {
      id: 'bento-cta-tile',
      type: 'rect',
      name: 'Bento Ação',
      left: pad + halfW + gap,
      top: bottomTop,
      width: innerW - halfW - gap,
      height: bottomH,
      rx: 24,
      ry: 24,
      fill: palette.subCardBg,
      stroke: palette.border,
      strokeWidth: 1.5,
    },
    {
      id: 'footer-brand',
      type: 'textbox',
      name: 'Rodapé Marca',
      left: pad + halfW + gap + 28,
      top: bottomTop + 28,
      width: innerW - halfW - gap - 56,
      text: copy.brand.toUpperCase(),
      fontSize: 13,
      fontWeight: 700,
      fontFamily: palette.monoFont,
      charSpacing: 140,
      fill: palette.textSecondary,
      textAlign: 'left',
    },
    {
      id: 'bento-proof-copy',
      type: 'textbox',
      name: 'Destaque Bento',
      left: pad + halfW + gap + 28,
      top: bottomTop + Math.round(bottomH * 0.34),
      width: innerW - halfW - gap - 56,
      text: `${copy.proofLeft} • ${copy.proofRight}`,
      fontSize: 16,
      fontWeight: 600,
      fontFamily: palette.bodyFont,
      fill: palette.textPrimary,
      textAlign: 'left',
    },
    {
      id: 'cta-btn-shape',
      type: 'rect',
      name: 'Botão CTA',
      left: pad + halfW + gap + 28,
      top: bottomTop + bottomH - 80,
      width: innerW - halfW - gap - 56,
      height: 54,
      rx: 14,
      ry: 14,
      fill: palette.accent,
    },
    {
      id: 'cta-btn-text',
      type: 'textbox',
      name: 'Texto CTA',
      left: pad + halfW + gap + 28,
      top: bottomTop + bottomH - 63,
      width: innerW - halfW - gap - 56,
      text: copy.cta,
      fontSize: 16,
      fontWeight: 700,
      fontFamily: palette.bodyFont,
      charSpacing: 60,
      fill: palette.textOnAccent,
      textAlign: 'center',
    },
  ];

  return elements;
}

function buildPhotoOverlayElements(
  w: number,
  h: number,
  palette: CreativePalette,
  copy: ExtractedCopy,
): CanvasLayoutElementDto[] {
  const padX = Math.round(w * 0.075);
  const padY = Math.round(h * 0.075);
  const contentW = w - padX * 2;
  const headlineSize = Math.max(46, Math.min(82, Math.round(Math.min(w, h) * 0.072)));

  return [
    {
      id: 'hero-bg-photo',
      type: 'image',
      name: 'Fotografia Fundo',
      left: 0,
      top: 0,
      width: w,
      height: h,
      objectFit: 'cover',
      imageQuery: copy.imageQuery,
      fill: palette.background,
    },
    {
      id: 'hero-scrim',
      type: 'rect',
      name: 'Gradiente Legibilidade',
      left: 0,
      top: 0,
      width: w,
      height: h,
      fill: '#0A0C12',
      fillGradient: {
        type: 'linear',
        angle: 180,
        stops: [
          { offset: 0, color: '#0A0C12', opacity: 0.32 },
          { offset: 0.45, color: '#0A0C12', opacity: 0.56 },
          { offset: 1, color: '#0A0C12', opacity: 0.92 },
        ],
      },
      opacity: 0.88,
    },
    {
      id: 'badge-pill',
      type: 'rect',
      name: 'Pílula Badge',
      left: padX,
      top: padY,
      width: Math.min(270, Math.max(176, copy.badge.length * 10 + 40)),
      height: 38,
      rx: 19,
      ry: 19,
      fill: palette.accent,
      opacity: 0.92,
    },
    {
      id: 'badge-text',
      type: 'textbox',
      name: 'Texto Badge',
      left: padX,
      top: padY + 10,
      width: Math.min(270, Math.max(176, copy.badge.length * 10 + 40)),
      text: copy.badge,
      fontSize: 13,
      fontWeight: 700,
      fontFamily: palette.monoFont,
      charSpacing: 120,
      fill: palette.textOnAccent,
      textAlign: 'center',
    },
    {
      id: 'footer-brand',
      type: 'textbox',
      name: 'Rodapé Marca',
      left: w - padX - 240,
      top: padY + 10,
      width: 240,
      text: copy.brand.toUpperCase(),
      fontSize: 13,
      fontWeight: 700,
      fontFamily: palette.monoFont,
      charSpacing: 150,
      fill: '#F8FAFC',
      textAlign: 'right',
    },
    {
      id: 'title-headline',
      type: 'textbox',
      name: 'Título Principal',
      left: padX,
      top: Math.round(h * 0.46),
      width: contentW,
      text: copy.headline,
      fontSize: headlineSize,
      fontWeight: 800,
      fontFamily: palette.displayFont,
      lineHeight: 1.06,
      fill: '#FFFFFF',
      textAlign: 'left',
      shadow: {
        color: 'rgba(0, 0, 0, 0.45)',
        blur: 18,
        offsetX: 0,
        offsetY: 6,
      },
    },
    {
      id: 'subtitle-copy',
      type: 'textbox',
      name: 'Subtítulo',
      left: padX,
      top: Math.round(h * 0.71),
      width: Math.round(contentW * 0.82),
      text: copy.subtitle,
      fontSize: Math.max(18, Math.min(26, Math.round(Math.min(w, h) * 0.025))),
      fontWeight: 400,
      fontFamily: palette.bodyFont,
      lineHeight: 1.42,
      fill: '#E2E8F0',
      textAlign: 'left',
    },
    {
      id: 'cta-btn-shape',
      type: 'rect',
      name: 'Botão CTA',
      left: padX,
      top: h - padY - 62,
      width: Math.min(320, Math.round(contentW * 0.55)),
      height: 58,
      rx: 29,
      ry: 29,
      fill: palette.accent,
      shadow: {
        color: 'rgba(0, 0, 0, 0.35)',
        blur: 20,
        offsetX: 0,
        offsetY: 8,
      },
    },
    {
      id: 'cta-btn-text',
      type: 'textbox',
      name: 'Texto CTA',
      left: padX,
      top: h - padY - 43,
      width: Math.min(320, Math.round(contentW * 0.55)),
      text: copy.cta,
      fontSize: 17,
      fontWeight: 700,
      fontFamily: palette.bodyFont,
      charSpacing: 60,
      fill: palette.textOnAccent,
      textAlign: 'center',
    },
  ];
}

function resolveDefaultArchetype(
  requested: LayoutCompositionArchetype | undefined,
  includeImagery: boolean,
  blueprint: ArtDirectionBlueprint,
): ResolvedArchetype {
  if (requested && requested !== 'auto') return requested;
  if (blueprint.isWebInterface) return 'editorial-split';
  if (includeImagery) {
    return blueprint.domain === 'food-gastronomy' || blueprint.pieceType === 'product-showcase'
      ? 'product-spotlight'
      : 'photo-overlay';
  }
  return blueprint.grammar.defaultArchetype;
}

/**
 * Iteratively refines an existing canvas layout locally when running the Parametric Studio Engine.
 */
export function refineAutonomousLayout(
  current: GeneratedLayoutDto,
  options: GenerateLayoutOptions,
): GeneratedLayoutDto {
  const promptLower = options.prompt.toLowerCase();
  const requestedStyle = options.style
    ? normalizeStyleCategory(options.style, options.prompt)
    : undefined;

  let nextBg = current.backgroundColor;
  let nextBgGrad = current.backgroundGradient;
  const brandOverride = normalizeHexColor(options.brief?.brandColor);

  const wantsDark = /\b(escuro|dark|preto|noturno|black|obsidian)\b/.test(promptLower);
  const wantsLight = /\b(claro|light|branco|minimal|clean|white)\b/.test(promptLower);
  const wantsBiggerTitle = /\b(maior|aumente|aumentar|destaque|bigger|larger|bold)\b/.test(
    promptLower,
  );
  const wantsSmallerTitle = /\b(menor|diminu|smaller|sutil|subtle)\b/.test(promptLower);
  const wantsUppercase = /\b(maiúscul|caixa alta|uppercase|caps)\b/.test(promptLower);

  const refPalette = requestedStyle ? PALETTES[requestedStyle] : undefined;
  if (wantsDark) {
    nextBg = '#0B0D13';
    nextBgGrad = buildBackgroundGradient(PALETTES.tech);
  } else if (wantsLight) {
    nextBg = '#F5F5F7';
    nextBgGrad = buildBackgroundGradient(PALETTES.minimal);
  } else if (refPalette) {
    nextBg = refPalette.background;
    nextBgGrad = buildBackgroundGradient(refPalette);
  }

  const nextElements: CanvasLayoutElementDto[] = current.elements.map((el) => {
    const updated = { ...el };
    const isHeadline =
      el.type === 'textbox' && ((el.fontSize ?? 0) >= 34 || /título|title|headline/i.test(el.name));
    const isCtaShape = el.type === 'rect' && /cta|botão|button/i.test(el.name);
    const isCtaText = el.type === 'textbox' && /cta|botão|button/i.test(el.name);

    if (isHeadline) {
      if (options.brief?.headline?.trim()) {
        updated.text = options.brief.headline.trim();
      }
      if (wantsBiggerTitle && updated.fontSize) {
        updated.fontSize = Math.min(160, Math.round(updated.fontSize * 1.18));
      } else if (wantsSmallerTitle && updated.fontSize) {
        updated.fontSize = Math.max(24, Math.round(updated.fontSize * 0.86));
      }
      if (wantsUppercase && updated.text) {
        updated.text = updated.text.toUpperCase();
      }
    }

    if (isCtaText && options.brief?.ctaText?.trim()) {
      updated.text = options.brief.ctaText.trim();
    }

    if (brandOverride && isCtaShape) {
      updated.fill = brandOverride;
      updated.fillGradient = undefined;
    }

    if (brandOverride && isCtaText) {
      updated.fill = pickHighContrastTextColor(brandOverride);
    }

    if (wantsDark && el.type === 'textbox' && !isCtaText) {
      updated.fill = '#F8FAFC';
    } else if (wantsLight && el.type === 'textbox' && !isCtaText) {
      updated.fill = '#18181B';
    } else if (wantsDark && el.type === 'rect' && /card|cartão|bento|painel/i.test(el.name)) {
      updated.fill = '#181B24';
      updated.stroke = '#2E3444';
    } else if (wantsLight && el.type === 'rect' && /card|cartão|bento|painel/i.test(el.name)) {
      updated.fill = '#FFFFFF';
      updated.stroke = '#D4D4D8';
    }

    return updated;
  });

  return {
    ...current,
    id: `refined-${Date.now().toString(36)}`,
    backgroundColor: nextBg,
    ...(nextBgGrad ? { backgroundGradient: nextBgGrad } : {}),
    elements: nextElements,
    explanation: `Refinamento aplicado ao layout atual: "${options.prompt.trim().slice(0, 90)}".`,
  };
}

/**
 * Autonomous Design Intelligence engine:
 * Synthesizes coordinated typography, multi-stop gradients, balanced geometry, and
 * aspect-ratio-aware compositions strictly from artboard dimensions and creative brief.
 */
export function synthesizeAutonomousLayout(
  options: GenerateLayoutOptions,
  forcedArchetype?: ResolvedArchetype,
  variationIndex = 0,
): GeneratedLayoutDto {
  if (options.mode === 'refine' && options.currentLayout) {
    return refineAutonomousLayout(options.currentLayout, options);
  }

  const width = options.dimensions?.width ?? 1080;
  const height = options.dimensions?.height ?? 1080;

  const blueprint = analyzeDesignBrief(options);
  const styleCategory = normalizeStyleCategory(options.style, options.prompt);
  const basePalette = options.style ? PALETTES[styleCategory] : buildPaletteFromDomain(blueprint);
  const palette = applyBrandColorOverride(basePalette, options.brief?.brandColor);
  const copy = buildCopyFromOptions(options, styleCategory, blueprint);
  const includeImagery = Boolean(options.brief?.includeImagery);
  const archetype =
    forcedArchetype ?? resolveDefaultArchetype(options.archetype, includeImagery, blueprint);

  let elements: CanvasLayoutElementDto[];
  switch (archetype) {
    case 'poster-impact':
      elements = buildPosterImpactElements(width, height, palette, copy, blueprint);
      break;
    case 'swiss-editorial':
      elements = buildSwissEditorialElements(
        width,
        height,
        palette,
        copy,
        blueprint,
        includeImagery,
      );
      break;
    case 'carousel-cover':
      elements = buildCarouselCoverElements(width, height, palette, copy, blueprint);
      break;
    case 'product-spotlight':
      elements = buildProductSpotlightElements(width, height, palette, copy, blueprint);
      break;
    case 'editorial-split':
      elements = buildEditorialSplitElements(width, height, palette, copy, includeImagery);
      break;
    case 'bold-typo':
      elements = buildBoldTypoElements(width, height, palette, copy);
      break;
    case 'hero-bento':
      elements = buildHeroBentoElements(width, height, palette, copy, includeImagery);
      break;
    case 'photo-overlay':
      elements = buildPhotoOverlayElements(width, height, palette, copy);
      break;
    case 'framed-card':
    default:
      elements = buildFramedCardElements(width, height, palette, copy, includeImagery);
      break;
  }

  const backgroundGradient = buildBackgroundGradient(palette);
  const paletteSwatches = [
    palette.background,
    palette.cardBg,
    palette.accent,
    palette.highlight,
    palette.textPrimary,
  ];
  const fontsUsed = Array.from(new Set([palette.displayFont, palette.bodyFont, palette.monoFont]));

  return {
    id: `studio-${archetype}-${Date.now().toString(36)}-${variationIndex + 1}`,
    title: copy.headline.slice(0, 48),
    backgroundColor: palette.background,
    backgroundGradient,
    archetype,
    palette: paletteSwatches,
    fontsUsed,
    artDirection: blueprint.summary,
    elements,
    explanation: `Peça "${blueprint.pieceType}" (${blueprint.grammar.labelPt}) em composição "${archetype}" com ${blueprint.summary.gridSystem} e par ${palette.displayFont} + ${palette.bodyFont}.`,
  };
}

/**
 * Generates 1 to 3 genuinely distinct composition variations using different graphic archetypes.
 */
export function synthesizeAutonomousVariations(
  options: GenerateLayoutOptions,
): GeneratedLayoutDto[] {
  if (options.mode === 'refine' && options.currentLayout) {
    return [refineAutonomousLayout(options.currentLayout, options)];
  }

  const count = Math.max(1, Math.min(3, options.variationsCount ?? 1));
  const blueprint = analyzeDesignBrief(options);
  const includeImagery = Boolean(options.brief?.includeImagery);
  const primary = resolveDefaultArchetype(options.archetype, includeImagery, blueprint);

  const archetypePool: ResolvedArchetype[] = blueprint.isWebInterface
    ? ['editorial-split', 'framed-card', 'hero-bento', 'poster-impact']
    : includeImagery
      ? ['product-spotlight', 'photo-overlay', 'swiss-editorial', 'poster-impact', 'carousel-cover']
      : ['poster-impact', 'swiss-editorial', 'carousel-cover', 'product-spotlight', 'bold-typo'];

  const ordered: ResolvedArchetype[] = [
    primary,
    ...archetypePool.filter((a) => a !== primary),
  ].slice(0, count);

  return ordered.map((archetype, idx) => synthesizeAutonomousLayout(options, archetype, idx));
}
