import type {
  ArtDirectionSummaryDto,
  CreativePieceType,
  GenerateLayoutOptions,
  LayoutCompositionArchetype,
  LayoutStyleTheme,
} from './ai.types.js';

export type GraphicDomain =
  | 'food-gastronomy'
  | 'retail-promo'
  | 'culture-event'
  | 'education-carousel'
  | 'fashion-luxury'
  | 'wellness-organic'
  | 'tech-product'
  | 'editorial-quote'
  | 'web-banner';

export interface ComputedGraphicGrid {
  readonly formatLabel: string;
  readonly isStoryVertical: boolean;
  readonly isLandscape: boolean;
  readonly isWideBanner: boolean;
  readonly columns: number;
  readonly marginX: number;
  readonly marginY: number;
  readonly safeTop: number;
  readonly safeBottom: number;
  readonly gutter: number;
  readonly colWidth: number;
  readonly columnX: readonly number[];
  readonly goldenX: number;
  readonly goldenY: number;
  readonly displayFontMin: number;
  readonly displayFontMax: number;
  readonly bodyFontSize: number;
  readonly microFontSize: number;
}

export interface DomainVisualGrammar {
  readonly domain: GraphicDomain;
  readonly labelPt: string;
  readonly colorPsychology: string;
  readonly gestaltFocus: string;
  readonly typographyVoice: string;
  readonly displayFont: string;
  readonly secondaryFont: string;
  readonly microFont: string;
  readonly defaultArchetype: Exclude<LayoutCompositionArchetype, 'auto'>;
  readonly favorsPhotography: boolean;
  readonly compositionCues: string;
  readonly copyTone: string;
  readonly palette: {
    readonly ground: string;
    readonly groundEnd: string;
    readonly surface: string;
    readonly ink: string;
    readonly inkMuted: string;
    readonly accent: string;
    readonly accentAlt: string;
    readonly isDark: boolean;
  };
}

export interface ArtDirectionBlueprint {
  readonly domain: GraphicDomain;
  readonly pieceType: Exclude<CreativePieceType, 'auto'>;
  readonly isWebInterface: boolean;
  readonly grid: ComputedGraphicGrid;
  readonly grammar: DomainVisualGrammar;
  readonly summary: ArtDirectionSummaryDto;
}

/**
 * Domain visual grammar grounded in graphic design theory:
 * - Oliveira & Coutinho (2021): warm appetizing color sensation, framing, depth, symmetry, visible/invisible lines, Gestalt pregnancia
 * - Bomeny (2009): Swiss grid (Muller-Brockmann/Gerstner), figure/ground & negative space (Hofmann/Ruder),
 *   Weingart triple typographic dimension (syntactic, semantic, pragmatic), Tschichold's 5 principles,
 *   Maeda's Laws of Simplicity, Kalman's nuance, Jury's conscious rule-breaking
 */
const DOMAIN_GRAMMARS: Readonly<Record<GraphicDomain, DomainVisualGrammar>> = {
  'food-gastronomy': {
    domain: 'food-gastronomy',
    labelPt: 'Gastronomia & Desejo Sensorial',
    colorPsychology:
      'Cores quentes e apetitosas (terracota, vermelho-tomate, mostarda/âmbar, espresso e creme) ativam desejo e apetite no feed (Pedrosa; Oliveira & Coutinho).',
    gestaltFocus:
      'Alta pregnância com enquadramento fechado do produto/alimento, profundidade por camadas e linha visível de destaque sob a chamada.',
    typographyVoice:
      'Semântica apetitosa e direta: display condensado de alto impacto (Anton/Bebas Neue) ou serifa artesanal (Playfair Display) com micro-legenda nítida.',
    displayFont: 'Bebas Neue',
    secondaryFont: 'Plus Jakarta Sans',
    microFont: 'Space Mono',
    defaultArchetype: 'product-spotlight',
    favorsPhotography: true,
    compositionCues:
      'Full-bleed or boldly cropped appetizing food/drink photo taking 55-70% of visual weight, warm directional tonal scrim, oversized 2-4 word display title with visible underline bar or highlight strip, rotated price/special stamp seal, clean @brand/delivery footer. ZERO website cards or pill HTML buttons.',
    copyTone:
      'Sensory, ultra-short, immediate craving (2-5 word headline, 1 crisp ingredient/offer line, natural delivery/visit cue).',
    palette: {
      ground: '#1B110D',
      groundEnd: '#2F1710',
      surface: '#2A1913',
      ink: '#FFF7ED',
      inkMuted: '#E5CBB5',
      accent: '#E8452C',
      accentAlt: '#F5B82E',
      isDark: true,
    },
  },
  'retail-promo': {
    domain: 'retail-promo',
    labelPt: 'Promocional & Conversão Visual',
    colorPsychology:
      'Alto contraste quente/escuro ou bloco cromático puro (vermelho sinal, amarelo âmbar, carvão profundo) para atrair, reter atenção e fixar a oferta em < 1.5s.',
    gestaltFocus:
      'Pregnância máxima: um único número ou oferta dominante (ex: 50% OFF) em escala monumental, apoiado por blocos geométricos e selo rotacionado.',
    typographyVoice:
      'Sintaxe de cartaz publicitário: manchete condensada ultra-bold com entrelinha apertada (0.94-1.02) e contraforma forte.',
    displayFont: 'Anton',
    secondaryFont: 'Plus Jakarta Sans',
    microFont: 'Space Mono',
    defaultArchetype: 'poster-impact',
    favorsPhotography: false,
    compositionCues:
      'Edge-to-edge poster color blocking or dark dramatic canvas, massive numeric/offer centerpiece (90-140px), rotated starburst polygon seal, sharp diagonal accent stripe or horizontal rule, clean bottom ticker strip with condition & @handle. Avoid rounded SaaS UI cards.',
    copyTone:
      'Urgent, crisp, zero filler: punchy offer headline + concrete condition (dates/stock) + direct action phrase.',
    palette: {
      ground: '#121214',
      groundEnd: '#261014',
      surface: '#1F1A1D',
      ink: '#FFFDF9',
      inkMuted: '#D6CDD0',
      accent: '#FF3B30',
      accentAlt: '#FFD60A',
      isDark: true,
    },
  },
  'culture-event': {
    domain: 'culture-event',
    labelPt: 'Cartaz Cultural, Música & Eventos',
    colorPsychology:
      'Contraste cromático vibrante e expressivo (índigo profundo, magenta/violeta, lima ou laranja vivo) evocando energia, ritmo e presença.',
    gestaltFocus:
      'Tensão assimétrica e planos sobrepostos (Weingart / Paula Scher): tipografia como imagem, movimento diagonal e ritmo de grade visível.',
    typographyVoice:
      'Tipografia expressiva de vanguarda (Syne / Oswald) com quebra de escala dramática entre título de cartaz e dados práticos (dia, hora, local) em mono.',
    displayFont: 'Syne',
    secondaryFont: 'DM Sans',
    microFont: 'Space Mono',
    defaultArchetype: 'poster-impact',
    favorsPhotography: false,
    compositionCues:
      'Contemporary graphic poster aesthetic: bold oversized overlapping type, rhythmic geometric forms (concentric circles, architectural stripes, angled accent bands), structured Swiss metadata grid at top/bottom with date, time, venue, and @handle.',
    copyTone:
      'Magnetic, cultural, rhythmic: iconic event title + speaker/lineup + structured date/time/location line.',
    palette: {
      ground: '#0E0F1D',
      groundEnd: '#24113D',
      surface: '#1B1733',
      ink: '#FBFBFD',
      inkMuted: '#C7C1DF',
      accent: '#C056F7',
      accentAlt: '#30D158',
      isDark: true,
    },
  },
  'education-carousel': {
    domain: 'education-carousel',
    labelPt: 'Carrossel & Conteúdo Editorial Social',
    colorPsychology:
      'Base limpa de alta legibilidade (papel off-white ou grafite profundo) com uma única cor de destaque funcional para guiar a leitura linear no celular.',
    gestaltFocus:
      'Grid Suíço de 4 colunas (Müller-Brockmann): organização rigorosa, índice numérico no cabeçalho, número monumental em baixo contraste e seta/fio de continuidade.',
    typographyVoice:
      'Clareza pragmática para leitura móvel: título forte alinhado à esquerda (Space Grotesk / Outfit), linha de destaque sob palavra-chave e texto conciso.',
    displayFont: 'Space Grotesk',
    secondaryFont: 'Inter',
    microFont: 'JetBrains Mono',
    defaultArchetype: 'carousel-cover',
    favorsPhotography: false,
    compositionCues:
      'Instagram carousel cover / content post: crisp top editorial masthead (slide index "01 / 05" left + "@handle" right + 1px hairline rule), oversized architectural background numeral or bold colored accent stripe, strong left-aligned headline with highlighted keyword, short 1-sentence hook, bottom swipe/continuity indicator.',
    copyTone:
      'Clear, authoritative, scroll-stopping hook in 4-8 words + single sharp takeaway line.',
    palette: {
      ground: '#F4F1EA',
      groundEnd: '#EAE5DA',
      surface: '#FFFFFF',
      ink: '#16161A',
      inkMuted: '#4B4B55',
      accent: '#0057FF',
      accentAlt: '#FF4D2D',
      isDark: false,
    },
  },
  'fashion-luxury': {
    domain: 'fashion-luxury',
    labelPt: 'Moda, Luxo & Editorial Sofisticado',
    colorPsychology:
      'Tons nobres contidos (preto azeviche, marfim quente, champagne dourado ou areia) transmitindo prestígio, atemporalidade e curadoria.',
    gestaltFocus:
      'Relação figura/fundo generosa com 35-45% de espaço negativo ativo, molduras de fios finos (1px) e simetria ou assimetria editorial calculada.',
    typographyVoice:
      'Contraste clássico entre serifa de alto contraste (Cormorant Garamond / Playfair Display, explorando itálico) e microtipografia sans espaçada (Montserrat).',
    displayFont: 'Cormorant Garamond',
    secondaryFont: 'Montserrat',
    microFont: 'Space Mono',
    defaultArchetype: 'swiss-editorial',
    favorsPhotography: true,
    compositionCues:
      'Luxury magazine / lookbook post: generous breathing space, razor-thin 1px inset hairline border or vertical margin rail, editorial cropped photography or refined monochrome plate, contrasting Roman + Italic serif display title, wide-tracked uppercase micro-labels (charSpacing 200-280).',
    copyTone:
      'Poetic, restrained, prestigious: 2-5 word refined title + brief collection/season line + subtle brand signature.',
    palette: {
      ground: '#16161D',
      groundEnd: '#221F2B',
      surface: '#201F29',
      ink: '#FAF7F0',
      inkMuted: '#BEB8AD',
      accent: '#D4AF37',
      accentAlt: '#F3E5AB',
      isDark: true,
    },
  },
  'wellness-organic': {
    domain: 'wellness-organic',
    labelPt: 'Orgânico, Bem-Estar & Botânico',
    colorPsychology:
      'Tons terrosos e naturais (linho, sálvia, verde floresta, argila/terracota) comunicando calma, origem pura e sustentabilidade.',
    gestaltFocus:
      'Equilíbrio sereno entre formas orgânicas suaves (arcos/elipses/bordas doces) e amplo respiro visual (Lei da Redução de John Maeda).',
    typographyVoice:
      'Serifa humanista acolhedora (Lora) combinada com sans limpa (Plus Jakarta Sans) e espaçamento generoso.',
    displayFont: 'Lora',
    secondaryFont: 'Plus Jakarta Sans',
    microFont: 'Space Mono',
    defaultArchetype: 'swiss-editorial',
    favorsPhotography: true,
    compositionCues:
      'Calm botanical social post: warm tactile linen ground, soft organic ellipse/arch accents, cleanly framed natural photography when enabled, refined serif headline with italic accent word, airy vertical rhythm, minimalist bottom brand mark.',
    copyTone:
      'Calm, honest, grounded: mindful 3-6 word headline + gentle benefit phrase + pure brand signature.',
    palette: {
      ground: '#F3F1EC',
      groundEnd: '#E5E8DF',
      surface: '#FAF9F5',
      ink: '#1D2722',
      inkMuted: '#4A5951',
      accent: '#1E4D3B',
      accentAlt: '#C96F4B',
      isDark: false,
    },
  },
  'editorial-quote': {
    domain: 'editorial-quote',
    labelPt: 'Editorial, Frase & Manifesto Visual',
    colorPsychology:
      'Papel quente de revista ou grafite editorial com tinta profunda e um único traço cromático marcante (vermelhão/cobalto) para foco intelectual.',
    gestaltFocus:
      'Espaço negativo como elemento ativo do desenho (Emil Ruder / Jan Tschichold): a tipografia ocupa o palco principal como forma escultórica.',
    typographyVoice:
      'Presença autoral: serifa editorial marcante (Playfair Display) ou sans geométrica limpa (Outfit), com pontuação/aspas em escala arquitetônica.',
    displayFont: 'Playfair Display',
    secondaryFont: 'DM Sans',
    microFont: 'JetBrains Mono',
    defaultArchetype: 'swiss-editorial',
    favorsPhotography: false,
    compositionCues:
      'Editorial magazine / quote post: crisp top masthead + horizontal rule, sculptural oversized quotation mark or monogram accent, strong expressive headline/quote anchored on asymmetric Swiss grid, clear author/source credit separated by short accent rule, 40%+ open space.',
    copyTone:
      'Memorable, thoughtful, crisp: impactful statement or insight + attribution/brand context.',
    palette: {
      ground: '#F6F2EA',
      groundEnd: '#ECE5D8',
      surface: '#FFFDF9',
      ink: '#17171A',
      inkMuted: '#514D46',
      accent: '#C84B31',
      accentAlt: '#1D4ED8',
      isDark: false,
    },
  },
  'tech-product': {
    domain: 'tech-product',
    labelPt: 'Produto Digital, Tech & Inovação',
    colorPsychology:
      'Grafite/obsidiana profundo com luz óptica direcionada (azul elétrico/ciano) sugerindo precisão industrial, futuro e confiabilidade.',
    gestaltFocus:
      'Estrutura modular limpa (Escola de Ulm / Dieter Rams): geometria exata, contraste luminoso nítido e zero ornamento supérfluo.',
    typographyVoice:
      'Geométrica contemporânea (Space Grotesk) com metadados técnicos precisos em JetBrains Mono e forte contraste de escala.',
    displayFont: 'Space Grotesk',
    secondaryFont: 'Inter',
    microFont: 'JetBrains Mono',
    defaultArchetype: 'poster-impact',
    favorsPhotography: false,
    compositionCues:
      'Modern product launch post (Apple/Braun-inspired graphic poster, NOT a cluttered web UI): deep sculpted gradient ground with focused optical glow, strong bold display headline, crisp architectural rule lines, 1 single standout metric/feature callout, clean minimal product/brand footer.',
    copyTone:
      'Sharp, confident, minimalist: bold 3-6 word innovation statement + concise 1-line capability + brand mark.',
    palette: {
      ground: '#0B0D13',
      groundEnd: '#141B2D',
      surface: '#151922',
      ink: '#F8FAFC',
      inkMuted: '#94A3B8',
      accent: '#0A84FF',
      accentAlt: '#64D2FF',
      isDark: true,
    },
  },
  'web-banner': {
    domain: 'web-banner',
    labelPt: 'Banner Digital / Web Hero',
    colorPsychology:
      'Alto contraste focado em leitura instantânea em telas desktop e clique claro no CTA.',
    gestaltFocus:
      'Fluxo horizontal esquerda->direita com separação clara entre proposta de valor, elemento visual e chamada de ação.',
    typographyVoice:
      'Sans-serif geométrica de alta legibilidade em tela (Space Grotesk + Inter) com hierarquia imediata.',
    displayFont: 'Space Grotesk',
    secondaryFont: 'Inter',
    microFont: 'JetBrains Mono',
    defaultArchetype: 'editorial-split',
    favorsPhotography: false,
    compositionCues:
      'Horizontal digital banner: left-aligned headline + brief value prop + clean high-contrast CTA button, balanced against a right-side visual spotlight or product frame.',
    copyTone: 'Direct value proposition + concise action CTA.',
    palette: {
      ground: '#0B0D13',
      groundEnd: '#131A2B',
      surface: '#151922',
      ink: '#FBFBFD',
      inkMuted: '#9CA3AF',
      accent: '#0A84FF',
      accentAlt: '#38BDF8',
      isDark: true,
    },
  },
};

export function inferGraphicDomain(
  prompt: string,
  style?: LayoutStyleTheme,
  pieceType?: CreativePieceType,
  dimensions?: { readonly width: number; readonly height: number },
): GraphicDomain {
  const p = prompt.toLowerCase();

  if (pieceType === 'web-banner') return 'web-banner';
  if (pieceType === 'carousel-slide') return 'education-carousel';
  if (pieceType === 'editorial-quote') return 'editorial-quote';
  if (pieceType === 'promo-flyer') return 'retail-promo';

  // Explicit web/site request
  if (
    /\b(site|website|landing page|hero de site|web banner|leaderboard|cabeçalho de site)\b/.test(p)
  ) {
    return 'web-banner';
  }

  // Wide leaderboard banner dimensions default to web-banner unless food/event
  const ratio = dimensions ? dimensions.width / Math.max(1, dimensions.height) : 1;
  if (ratio >= 2.2) {
    return 'web-banner';
  }

  // Food & Gastronomy (Oliveira & Coutinho: warm appetizing tones + framing + depth)
  if (
    /hamb[úu]rgu|burger|pizza|açaí|acai|sushi|café|coffee|cafeteria|padaria|confeitaria|bolo|doce|restaurante|lanchonete|cardápio|menu|brunch|churrasco|cerveja|vinho|gourmet|delivery|comida|prato|almoço|jantar|sorvete|pastel|food/.test(
      p,
    )
  ) {
    return 'food-gastronomy';
  }

  // Carousel / Educational tips / Listicle
  if (
    /carrossel|carousel|dicas|tips|passos|steps|guia|guide|lista|como fazer|how to|erros|segredos|princípios|princ[íi]pios|slide|aula|conteúdo/.test(
      p,
    )
  ) {
    return 'education-carousel';
  }

  // Promotions / Sales / Discounts
  if (
    /promo|black friday|desconto|sale|oferta|\d+%\s*off|queima|liquidaci|liquidação|frete grátis|cupom|imperdível|flash sale|saldão/.test(
      p,
    )
  ) {
    return 'retail-promo';
  }

  // Culture / Events / Music / Live / Workshops
  if (
    /show|festa|festival|evento|event|concerto|jazz|rock|dj|balada|exposição|teatro|palestra|masterclass|workshop|live|ao vivo|en vivo|convite|ingressos|tickets|vernissage|encontro/.test(
      p,
    )
  ) {
    return 'culture-event';
  }

  // Fashion / Luxury / Beauty / Real Estate / Jewelry
  if (
    /moda|fashion|coleção|collection|luxo|luxury|joia|relógio|perfume|imóve|arquitet|atelier|estética|salão|clínica|elegante|lookbook|capsule/.test(
      p,
    )
  ) {
    return 'fashion-luxury';
  }

  // Organic / Wellness / Health / Fitness / Sustainability
  if (
    /orgânic|organic|natural|botânic|skincare|wellness|yoga|pilates|saúde|fitness|academia|treino|nutri|eco|sustent|matcha|chá|terapia|bem-estar/.test(
      p,
    )
  ) {
    return 'wellness-organic';
  }

  // Quotes / Editorial / Posters / Books
  if (
    /frase|quote|citação|cita|editorial|revista|magazine|manifesto|livro|poema|pensamento|reflexão|minimal|suíç|swiss/.test(
      p,
    )
  ) {
    return 'editorial-quote';
  }

  // Fallback guided by explicit style selector
  if (style === 'promo' || style === 'bold') return 'retail-promo';
  if (style === 'elegant') return 'fashion-luxury';
  if (style === 'organic') return 'wellness-organic';
  if (style === 'editorial' || style === 'minimal') return 'editorial-quote';
  if (style === 'vibrant') return 'culture-event';
  if (pieceType === 'product-showcase') return 'food-gastronomy';

  return 'tech-product';
}

export function inferPieceType(
  options: GenerateLayoutOptions,
  domain: GraphicDomain,
): Exclude<CreativePieceType, 'auto'> {
  if (options.pieceType && options.pieceType !== 'auto') {
    return options.pieceType;
  }
  const w = options.dimensions?.width ?? 1080;
  const h = options.dimensions?.height ?? 1080;
  const ratio = w / Math.max(1, h);
  const p = options.prompt.toLowerCase();

  if (domain === 'web-banner' || ratio >= 2.1) return 'web-banner';
  if (ratio < 0.72 || /story|stories|reels|cartaz vertical|tiktok/.test(p)) return 'story-poster';
  if (domain === 'education-carousel') return 'carousel-slide';
  if (domain === 'retail-promo') return 'promo-flyer';
  if (domain === 'editorial-quote') return 'editorial-quote';
  if (domain === 'food-gastronomy') return 'product-showcase';
  return 'social-post';
}

/**
 * Computes a real Swiss/Editorial proportional grid in exact artboard pixels
 * (Muller-Brockmann / Karl Gerstner / Instagram mobile safe zones).
 */
export function computeGraphicGrid(
  width: number,
  height: number,
  pieceType: Exclude<CreativePieceType, 'auto'>,
): ComputedGraphicGrid {
  const ratio = width / Math.max(1, height);
  const minDim = Math.min(width, height);
  const isWideBanner = ratio >= 2.1;
  const isLandscape = ratio > 1.25;
  const isStoryVertical = ratio < 0.72;

  const columns = isWideBanner ? 6 : isLandscape ? 6 : isStoryVertical ? 3 : 4;
  const marginX = Math.max(24, Math.round(width * (isWideBanner ? 0.04 : 0.072)));
  const marginY = Math.max(20, Math.round(height * (isWideBanner ? 0.1 : 0.072)));

  // Instagram Stories / Reels safe zone avoids top profile bar (~12%) and bottom reply bar (~15%)
  const safeTop = isStoryVertical ? Math.round(height * 0.12) : marginY;
  const safeBottom = isStoryVertical ? Math.round(height * 0.85) : height - marginY;

  const gutter = Math.max(14, Math.round(minDim * 0.022));
  const usableW = width - marginX * 2;
  const colWidth = Math.round((usableW - gutter * (columns - 1)) / columns);
  const columnX = Array.from({ length: columns }, (_, i) => marginX + i * (colWidth + gutter));

  // Golden section focal coordinates (0.382 / 0.618)
  const goldenX = Math.round(width * 0.618);
  const goldenY = Math.round(height * 0.382);

  let formatLabel = `Instagram Feed 1:1 (${width}x${height}px)`;
  if (isWideBanner) {
    formatLabel = `Web Banner / Leaderboard (${width}x${height}px)`;
  } else if (isLandscape) {
    formatLabel = `Widescreen / Thumbnail 16:9 (${width}x${height}px)`;
  } else if (isStoryVertical) {
    formatLabel = `Vertical Story / Reel / Poster 9:16 (${width}x${height}px)`;
  } else if (ratio < 0.9) {
    formatLabel = `Instagram Portrait 4:5 (${width}x${height}px)`;
  } else if (pieceType === 'carousel-slide') {
    formatLabel = `Instagram Carousel Slide (${width}x${height}px)`;
  }

  const displayFontMin = isWideBanner
    ? Math.max(24, Math.round(height * 0.24))
    : Math.max(54, Math.round(minDim * 0.068));
  const displayFontMax = isWideBanner
    ? Math.max(36, Math.round(height * 0.42))
    : Math.max(92, Math.round(minDim * 0.125));
  const bodyFontSize = isWideBanner
    ? Math.max(14, Math.round(height * 0.12))
    : Math.max(20, Math.min(30, Math.round(minDim * 0.026)));
  const microFontSize = isWideBanner ? 12 : Math.max(13, Math.min(18, Math.round(minDim * 0.015)));

  return {
    formatLabel,
    isStoryVertical,
    isLandscape,
    isWideBanner,
    columns,
    marginX,
    marginY,
    safeTop,
    safeBottom,
    gutter,
    colWidth,
    columnX,
    goldenX,
    goldenY,
    displayFontMin,
    displayFontMax,
    bodyFontSize,
    microFontSize,
  };
}

/**
 * Synthesizes a complete Art Direction Blueprint bridging the user's request
 * with formal graphic design theory, domain color psychology, and exact pixel grid math.
 */
export function analyzeDesignBrief(options: GenerateLayoutOptions): ArtDirectionBlueprint {
  const width = options.dimensions?.width ?? 1080;
  const height = options.dimensions?.height ?? 1080;
  const domain = inferGraphicDomain(options.prompt, options.style, options.pieceType, {
    width,
    height,
  });
  const pieceType = inferPieceType(options, domain);
  const grid = computeGraphicGrid(width, height, pieceType);
  const grammar = DOMAIN_GRAMMARS[domain];
  const isWebInterface = pieceType === 'web-banner' || domain === 'web-banner';

  return {
    domain,
    pieceType,
    isWebInterface,
    grid,
    grammar,
    summary: {
      domain: grammar.labelPt,
      pieceType,
      gridSystem: `Grid ${grid.columns} col. · margem ${grid.marginX}px · razão áurea`,
      colorPsychology: grammar.colorPsychology,
      gestaltPrinciple: grammar.gestaltFocus,
      typographyVoice: `${grammar.displayFont} + ${grammar.secondaryFont}`,
    },
  };
}
