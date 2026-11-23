import type { ArtDirectionBlueprint } from './ai.designKnowledge.js';
import type { CanvasLayoutElementDto } from './ai.types.js';

export interface SocialCompositionPalette {
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

export interface SocialCompositionCopy {
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

function clampFont(size: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(size)));
}

/**
 * POSTER IMPACT - Authentic full-bleed social poster (events, promos, bold product drops).
 * Grounded in Weingart (syntactic scale tension), Maeda (simplicity), and Oliveira & Coutinho (visible lines + depth).
 * Zero website wrapper cards or HTML pill buttons.
 */
export function buildPosterImpactElements(
  w: number,
  h: number,
  palette: SocialCompositionPalette,
  copy: SocialCompositionCopy,
  blueprint: ArtDirectionBlueprint,
): CanvasLayoutElementDto[] {
  const { grid } = blueprint;
  const minDim = Math.min(w, h);
  const contentW = w - grid.marginX * 2;
  const elements: CanvasLayoutElementDto[] = [];

  // 1. Graphic Plane / Swiss Structural Spine (full-bleed edge color band)
  elements.push({
    id: 'poster-edge-spine',
    type: 'rect',
    name: 'Faixa Estrutural Lateral',
    left: 0,
    top: 0,
    width: Math.max(10, Math.round(w * 0.015)),
    height: h,
    fill: palette.accent,
  });

  // 2. Optical ambient glow or subtle graphic circle for depth
  const glowR = Math.round(minDim * 0.38);
  elements.push({
    id: 'poster-depth-circle',
    type: 'circle',
    name: 'Plano Atmosférico',
    left: Math.round(w * 0.64 - glowR * 0.4),
    top: Math.round(h * 0.14 - glowR * 0.35),
    radius: glowR,
    fill: palette.accent,
    opacity: palette.isDark ? 0.14 : 0.08,
  });

  // 3. Architectural giant low-opacity watermark numeral / monogram (figure-ground tension)
  const watermarkText = copy.calloutStat.slice(0, 4);
  const watermarkSize = clampFont(minDim * 0.34, 140, 320);
  elements.push({
    id: 'poster-bg-watermark',
    type: 'textbox',
    name: 'Marca Dágua Tipográfica',
    left: Math.round(w * 0.38),
    top: Math.round(h * (grid.isLandscape ? 0.18 : 0.48)),
    width: Math.round(w * 0.58),
    text: watermarkText,
    fontSize: watermarkSize,
    fontWeight: 900,
    fontFamily: palette.displayFont,
    lineHeight: 0.9,
    fill: palette.textPrimary,
    opacity: palette.isDark ? 0.07 : 0.06,
    textAlign: 'right',
  });

  // 4. Swiss Top Masthead (category left + @brand right + 1px hairline)
  const mastheadTop = grid.safeTop;
  elements.push(
    {
      id: 'badge-text',
      type: 'textbox',
      name: 'Texto Badge',
      left: grid.marginX,
      top: mastheadTop,
      width: Math.round(contentW * 0.58),
      text: copy.badge,
      fontSize: grid.microFontSize,
      fontWeight: 700,
      fontFamily: palette.monoFont,
      charSpacing: 190,
      fill: palette.isDark ? palette.highlight : palette.accent,
      textAlign: 'left',
    },
    {
      id: 'header-brand',
      type: 'textbox',
      name: 'Marca Cabeçalho',
      left: grid.marginX + Math.round(contentW * 0.58),
      top: mastheadTop,
      width: Math.round(contentW * 0.42),
      text: copy.brand.toUpperCase(),
      fontSize: grid.microFontSize,
      fontWeight: 600,
      fontFamily: palette.monoFont,
      charSpacing: 160,
      fill: palette.textSecondary,
      textAlign: 'right',
    },
    {
      id: 'masthead-hairline',
      type: 'line',
      name: 'Fio Cabeçalho',
      left: grid.marginX,
      top: mastheadTop + Math.round(grid.microFontSize * 1.9),
      width: contentW,
      height: 1,
      fill: palette.textSecondary,
      opacity: 0.3,
    },
  );

  // 5. Monumental Display Headline aligned to Swiss Grid
  const headlineSize = clampFont(
    copy.headline.length > 34 ? minDim * 0.064 : minDim * 0.082,
    46,
    96,
  );
  const headlineTop = Math.round(
    mastheadTop + Math.max(54, (grid.safeBottom - mastheadTop) * (grid.isLandscape ? 0.14 : 0.17)),
  );
  const headlineW = Math.round(contentW * (grid.isLandscape ? 0.68 : 0.9));

  elements.push({
    id: 'title-headline',
    type: 'textbox',
    name: 'Título Principal',
    left: grid.marginX,
    top: headlineTop,
    width: headlineW,
    text: copy.headline,
    fontSize: headlineSize,
    fontWeight: 900,
    fontFamily: palette.displayFont,
    lineHeight: 0.98,
    fill: palette.textPrimary,
    textAlign: 'left',
  });

  // 6. Visible Accent Underline Bar (Oliveira & Coutinho: visible line for visual emphasis)
  const approxLines = Math.max(
    1,
    Math.min(
      3,
      Math.ceil(copy.headline.length / Math.max(8, Math.floor(headlineW / (headlineSize * 0.56)))),
    ),
  );
  const ruleTop = headlineTop + Math.round(approxLines * headlineSize * 1.02) + 22;
  elements.push({
    id: 'headline-accent-bar',
    type: 'line',
    name: 'Sublinhado de Destaque',
    left: grid.marginX,
    top: ruleTop,
    width: Math.round(contentW * 0.24),
    height: 6,
    rx: 2,
    ry: 2,
    fill: palette.accent,
  });

  // 7. Concise Supporting Copy
  const subTop = ruleTop + 28;
  elements.push({
    id: 'subtitle-copy',
    type: 'textbox',
    name: 'Subtítulo',
    left: grid.marginX,
    top: subTop,
    width: Math.round(contentW * (grid.isLandscape ? 0.58 : 0.72)),
    text: copy.subtitle,
    fontSize: grid.bodyFontSize,
    fontWeight: 400,
    fontFamily: palette.bodyFont,
    lineHeight: 1.4,
    fill: palette.textSecondary,
    textAlign: 'left',
  });

  // 8. Rotated Graphic Starburst Seal (Offer / Highlight / Event Stamp)
  const sealR = clampFont(minDim * 0.088, 58, 92);
  const sealLeft = w - grid.marginX - sealR * 2;
  const sealTop = grid.isLandscape
    ? Math.round(h * 0.32)
    : Math.min(grid.safeBottom - sealR * 2 - 76, Math.max(subTop + 12, Math.round(h * 0.6)));

  elements.push(
    {
      id: 'poster-star-seal',
      type: 'polygon',
      name: 'Selo Gráfico Destaque',
      left: sealLeft,
      top: sealTop,
      width: sealR * 2,
      height: sealR * 2,
      radius: sealR,
      sides: 10,
      isStar: true,
      fill: palette.accent,
      angle: -10,
      shadow: {
        color: 'rgba(0, 0, 0, 0.28)',
        blur: 18,
        offsetX: 0,
        offsetY: 8,
      },
    },
    {
      id: 'poster-seal-text',
      type: 'textbox',
      name: 'Texto Selo',
      left: sealLeft + 10,
      top: sealTop + Math.round(sealR - 18),
      width: sealR * 2 - 20,
      text: copy.calloutStat,
      fontSize: clampFont(sealR * 0.34, 18, 30),
      fontWeight: 900,
      fontFamily: palette.displayFont,
      fill: palette.textOnAccent,
      textAlign: 'center',
      angle: -10,
    },
  );

  // 9. Clean Editorial Bottom Strip (NO fake HTML pill <button>!)
  const footerRuleTop = grid.safeBottom - 54;
  const footerTextTop = footerRuleTop + 18;
  elements.push(
    {
      id: 'footer-hairline',
      type: 'line',
      name: 'Fio Rodapé',
      left: grid.marginX,
      top: footerRuleTop,
      width: contentW,
      height: 1,
      fill: palette.textSecondary,
      opacity: 0.28,
    },
    {
      id: 'footer-proof',
      type: 'textbox',
      name: 'Metadados Rodapé',
      left: grid.marginX,
      top: footerTextTop,
      width: Math.round(contentW * 0.56),
      text: `${copy.proofLeft} · ${copy.proofRight}`,
      fontSize: grid.microFontSize,
      fontWeight: 600,
      fontFamily: palette.monoFont,
      charSpacing: 130,
      fill: palette.textSecondary,
      textAlign: 'left',
    },
    {
      id: 'footer-action',
      type: 'textbox',
      name: 'Chamada Editorial',
      left: grid.marginX + Math.round(contentW * 0.56),
      top: footerTextTop - 2,
      width: Math.round(contentW * 0.44),
      text: copy.cta,
      fontSize: grid.microFontSize + 2,
      fontWeight: 800,
      fontFamily: palette.monoFont,
      charSpacing: 140,
      fill: palette.isDark ? palette.highlight : palette.accent,
      textAlign: 'right',
    },
  );

  return elements;
}

/**
 * SWISS EDITORIAL - Modernist magazine / quote / luxury / botanical composition.
 * Grounded in Muller-Brockmann grid, Emil Ruder active negative space (35-45%), and Tschichold's 5 principles.
 */
export function buildSwissEditorialElements(
  w: number,
  h: number,
  palette: SocialCompositionPalette,
  copy: SocialCompositionCopy,
  blueprint: ArtDirectionBlueprint,
  includeImagery: boolean,
): CanvasLayoutElementDto[] {
  const { grid } = blueprint;
  const minDim = Math.min(w, h);
  const contentW = w - grid.marginX * 2;
  const elements: CanvasLayoutElementDto[] = [];

  // 1. Subtle editorial inset hairline frame for luxury, or vertical Swiss accent rail
  if (blueprint.domain === 'fashion-luxury') {
    const inset = Math.round(grid.marginX * 0.52);
    elements.push({
      id: 'editorial-inset-frame',
      type: 'rect',
      name: 'Moldura Editorial Fina',
      left: inset,
      top: inset,
      width: w - inset * 2,
      height: h - inset * 2,
      fill: palette.background,
      opacity: 0.04,
      stroke: palette.accent,
      strokeWidth: 1,
    });
  } else {
    elements.push({
      id: 'swiss-vertical-rail',
      type: 'line',
      name: 'Régua Vertical Suíça',
      left: grid.marginX,
      top: grid.safeTop + 56,
      width: 4,
      height: Math.round((grid.safeBottom - grid.safeTop) * 0.16),
      fill: palette.accent,
    });
  }

  // 2. Top Masthead (Category left + @Brand right + 1px hairline)
  const mastheadTop = grid.safeTop;
  elements.push(
    {
      id: 'badge-text',
      type: 'textbox',
      name: 'Texto Badge',
      left: grid.marginX,
      top: mastheadTop,
      width: Math.round(contentW * 0.55),
      text: copy.badge,
      fontSize: grid.microFontSize,
      fontWeight: 700,
      fontFamily: palette.monoFont,
      charSpacing: 220,
      fill: palette.accent,
      textAlign: 'left',
    },
    {
      id: 'header-brand',
      type: 'textbox',
      name: 'Marca Editorial',
      left: grid.marginX + Math.round(contentW * 0.55),
      top: mastheadTop,
      width: Math.round(contentW * 0.45),
      text: copy.brand.toUpperCase(),
      fontSize: grid.microFontSize,
      fontWeight: 600,
      fontFamily: palette.monoFont,
      charSpacing: 180,
      fill: palette.textSecondary,
      textAlign: 'right',
    },
    {
      id: 'top-editorial-rule',
      type: 'line',
      name: 'Fio Superior Editorial',
      left: grid.marginX,
      top: mastheadTop + Math.round(grid.microFontSize * 2),
      width: contentW,
      height: 1,
      fill: palette.border,
      opacity: 0.85,
    },
  );

  // 3. Asymmetric Photo Plate OR Sculptural Oversized Quote/Monogram Watermark
  const hasSidePhoto = includeImagery && !grid.isStoryVertical;
  const hasTopPhoto = includeImagery && grid.isStoryVertical;

  if (hasSidePhoto) {
    const photoW = Math.round(contentW * 0.42);
    const photoH = Math.round((grid.safeBottom - grid.safeTop) * 0.72);
    elements.push({
      id: 'editorial-photo',
      type: 'image',
      name: 'Fotografia Editorial',
      left: w - grid.marginX - photoW,
      top: mastheadTop + 56,
      width: photoW,
      height: photoH,
      borderRadius: 6,
      objectFit: 'cover',
      imageQuery: copy.imageQuery,
      fill: palette.subCardBg,
    });
  } else if (hasTopPhoto) {
    const photoH = Math.round((grid.safeBottom - grid.safeTop) * 0.36);
    elements.push({
      id: 'editorial-photo',
      type: 'image',
      name: 'Fotografia Editorial',
      left: grid.marginX,
      top: mastheadTop + 52,
      width: contentW,
      height: photoH,
      borderRadius: 6,
      objectFit: 'cover',
      imageQuery: copy.imageQuery,
      fill: palette.subCardBg,
    });
  } else {
    // Sculptural oversized quotation mark or editorial index behind text (active figure/ground)
    elements.push({
      id: 'editorial-glyph-accent',
      type: 'textbox',
      name: 'Glifo Escultórico',
      left: grid.marginX - 10,
      top: mastheadTop + 44,
      width: Math.round(contentW * 0.35),
      text: blueprint.domain === 'editorial-quote' ? '“' : copy.carouselNumber,
      fontSize: clampFont(minDim * 0.24, 120, 240),
      fontWeight: 700,
      fontFamily: palette.displayFont,
      lineHeight: 0.85,
      fill: palette.accent,
      opacity: 0.14,
      textAlign: 'left',
    });
  }

  // 4. Sculptural Typographic Block with generous active negative space
  const textColLeft = hasSidePhoto ? grid.marginX : grid.marginX + 22;
  const textColW = hasSidePhoto ? Math.round(contentW * 0.52) : Math.round(contentW * 0.84);
  const headlineSize = clampFont(hasSidePhoto ? minDim * 0.058 : minDim * 0.072, 42, 82);
  const headlineTop = hasTopPhoto
    ? mastheadTop + Math.round((grid.safeBottom - grid.safeTop) * 0.44)
    : Math.round(mastheadTop + (grid.safeBottom - mastheadTop) * 0.24);

  elements.push({
    id: 'title-headline',
    type: 'textbox',
    name: 'Título Principal',
    left: textColLeft,
    top: headlineTop,
    width: textColW,
    text: copy.headline,
    fontSize: headlineSize,
    fontWeight: 700,
    fontFamily: palette.displayFont,
    lineHeight: 1.08,
    fill: palette.textPrimary,
    textAlign: 'left',
  });

  const approxLines = Math.max(
    1,
    Math.min(
      4,
      Math.ceil(copy.headline.length / Math.max(8, Math.floor(textColW / (headlineSize * 0.56)))),
    ),
  );
  const dividerTop = headlineTop + Math.round(approxLines * headlineSize * 1.12) + 26;

  elements.push(
    {
      id: 'editorial-short-rule',
      type: 'line',
      name: 'Traço Separador',
      left: textColLeft,
      top: dividerTop,
      width: Math.round(textColW * 0.18),
      height: 3,
      fill: palette.accent,
    },
    {
      id: 'subtitle-copy',
      type: 'textbox',
      name: 'Subtítulo',
      left: textColLeft,
      top: dividerTop + 26,
      width: Math.round(textColW * 0.92),
      text: copy.subtitle,
      fontSize: grid.bodyFontSize,
      fontWeight: 400,
      fontFamily: palette.bodyFont,
      fontStyle: blueprint.domain === 'editorial-quote' ? 'italic' : 'normal',
      lineHeight: 1.48,
      fill: palette.textSecondary,
      textAlign: 'left',
    },
  );

  // 5. Refined Bottom Attribution Bar
  const footerRuleTop = grid.safeBottom - 50;
  elements.push(
    {
      id: 'editorial-footer-rule',
      type: 'line',
      name: 'Fio Rodapé Editorial',
      left: grid.marginX,
      top: footerRuleTop,
      width: contentW,
      height: 1,
      fill: palette.border,
      opacity: 0.85,
    },
    {
      id: 'footer-proof',
      type: 'textbox',
      name: 'Crédito Editorial',
      left: grid.marginX,
      top: footerRuleTop + 16,
      width: Math.round(contentW * 0.52),
      text: copy.calloutLabel,
      fontSize: grid.microFontSize,
      fontWeight: 600,
      fontFamily: palette.monoFont,
      charSpacing: 160,
      fill: palette.textSecondary,
      textAlign: 'left',
    },
    {
      id: 'footer-cta-editorial',
      type: 'textbox',
      name: 'Assinatura Editorial',
      left: grid.marginX + Math.round(contentW * 0.52),
      top: footerRuleTop + 16,
      width: Math.round(contentW * 0.48),
      text: copy.cta,
      fontSize: grid.microFontSize,
      fontWeight: 700,
      fontFamily: palette.monoFont,
      charSpacing: 160,
      fill: palette.accent,
      textAlign: 'right',
    },
  );

  return elements;
}

/**
 * CAROUSEL COVER - Instagram Carousel Cover / Content Slide.
 * Grounded in Swiss Grid + Weingart Pragmatic mobile readability + highlighter emphasis strip.
 */
export function buildCarouselCoverElements(
  w: number,
  h: number,
  palette: SocialCompositionPalette,
  copy: SocialCompositionCopy,
  blueprint: ArtDirectionBlueprint,
): CanvasLayoutElementDto[] {
  const { grid } = blueprint;
  const minDim = Math.min(w, h);
  const contentW = w - grid.marginX * 2;
  const elements: CanvasLayoutElementDto[] = [];

  // 1. Monumental Architectural Slide Number Watermark (bottom-right)
  elements.push({
    id: 'carousel-bg-number',
    type: 'textbox',
    name: 'Numeral Arquitetônico',
    left: Math.round(w * 0.46),
    top: Math.round(h * 0.5),
    width: Math.round(w * 0.5),
    text: copy.carouselNumber,
    fontSize: clampFont(minDim * 0.38, 160, 340),
    fontWeight: 900,
    fontFamily: palette.displayFont,
    lineHeight: 0.85,
    fill: palette.accent,
    opacity: palette.isDark ? 0.1 : 0.08,
    textAlign: 'right',
  });

  // 2. Top Carousel Masthead ("01 / 05" left + "@brand" right + 1px hairline)
  const mastheadTop = grid.safeTop;
  elements.push(
    {
      id: 'badge-text',
      type: 'textbox',
      name: 'Texto Badge',
      left: grid.marginX,
      top: mastheadTop,
      width: Math.round(contentW * 0.58),
      text: `01 / ${copy.carouselNumber} · ${copy.badge}`,
      fontSize: grid.microFontSize,
      fontWeight: 700,
      fontFamily: palette.monoFont,
      charSpacing: 170,
      fill: palette.accent,
      textAlign: 'left',
    },
    {
      id: 'carousel-brand',
      type: 'textbox',
      name: 'Perfil Carrossel',
      left: grid.marginX + Math.round(contentW * 0.58),
      top: mastheadTop,
      width: Math.round(contentW * 0.42),
      text: copy.brand.toUpperCase(),
      fontSize: grid.microFontSize,
      fontWeight: 600,
      fontFamily: palette.monoFont,
      charSpacing: 150,
      fill: palette.textSecondary,
      textAlign: 'right',
    },
    {
      id: 'carousel-top-rule',
      type: 'line',
      name: 'Fio Cabeçalho Carrossel',
      left: grid.marginX,
      top: mastheadTop + Math.round(grid.microFontSize * 2),
      width: contentW,
      height: 1,
      fill: palette.border,
      opacity: 0.85,
    },
  );

  // 3. Focal Entry Pillar + Highlight Marker Tag (`textBackgroundColor`)
  const contentStartTop = Math.round(mastheadTop + (grid.safeBottom - mastheadTop) * 0.16);
  elements.push(
    {
      id: 'carousel-accent-pillar',
      type: 'rect',
      name: 'Marcador Vertical',
      left: grid.marginX,
      top: contentStartTop,
      width: 6,
      height: 36,
      rx: 2,
      ry: 2,
      fill: palette.accent,
    },
    {
      id: 'carousel-highlight-tag',
      type: 'textbox',
      name: 'Etiqueta Marca-Texto',
      left: grid.marginX + 18,
      top: contentStartTop + 4,
      width: Math.round(contentW * 0.65),
      text: ` ${copy.calloutLabel} `,
      fontSize: grid.microFontSize + 1,
      fontWeight: 700,
      fontFamily: palette.monoFont,
      charSpacing: 130,
      fill: palette.textOnAccent,
      textBackgroundColor: palette.accent,
      textAlign: 'left',
    },
  );

  // 4. Scroll-Stopping Display Headline
  const headlineSize = clampFont(
    copy.headline.length > 36 ? minDim * 0.062 : minDim * 0.076,
    44,
    86,
  );
  const headlineTop = contentStartTop + 62;
  elements.push({
    id: 'title-headline',
    type: 'textbox',
    name: 'Título Principal',
    left: grid.marginX,
    top: headlineTop,
    width: Math.round(contentW * 0.92),
    text: copy.headline,
    fontSize: headlineSize,
    fontWeight: 800,
    fontFamily: palette.displayFont,
    lineHeight: 1.04,
    fill: palette.textPrimary,
    textAlign: 'left',
  });

  // 5. Concise 1-Sentence Takeaway Hook
  const approxLines = Math.max(
    1,
    Math.min(
      4,
      Math.ceil(
        copy.headline.length / Math.max(8, Math.floor((contentW * 0.92) / (headlineSize * 0.56))),
      ),
    ),
  );
  const subTop = headlineTop + Math.round(approxLines * headlineSize * 1.08) + 28;
  elements.push({
    id: 'subtitle-copy',
    type: 'textbox',
    name: 'Subtítulo',
    left: grid.marginX,
    top: subTop,
    width: Math.round(contentW * 0.8),
    text: copy.subtitle,
    fontSize: grid.bodyFontSize,
    fontWeight: 400,
    fontFamily: palette.bodyFont,
    lineHeight: 1.44,
    fill: palette.textSecondary,
    textAlign: 'left',
  });

  // 6. Bottom Pagination Dots + Swipe Continuity Cue
  const footerRuleTop = grid.safeBottom - 54;
  const dotY = footerRuleTop + 20;
  elements.push(
    {
      id: 'carousel-footer-rule',
      type: 'line',
      name: 'Fio Rodapé Carrossel',
      left: grid.marginX,
      top: footerRuleTop,
      width: contentW,
      height: 1,
      fill: palette.border,
      opacity: 0.85,
    },
    {
      id: 'slide-dot-1',
      type: 'rect',
      name: 'Indicador Slide Ativo',
      left: grid.marginX,
      top: dotY,
      width: 28,
      height: 8,
      rx: 4,
      ry: 4,
      fill: palette.accent,
    },
    {
      id: 'slide-dot-2',
      type: 'circle',
      name: 'Indicador Slide 2',
      left: grid.marginX + 38,
      top: dotY,
      radius: 4,
      fill: palette.textSecondary,
      opacity: 0.35,
    },
    {
      id: 'slide-dot-3',
      type: 'circle',
      name: 'Indicador Slide 3',
      left: grid.marginX + 54,
      top: dotY,
      radius: 4,
      fill: palette.textSecondary,
      opacity: 0.25,
    },
    {
      id: 'carousel-swipe-cue',
      type: 'textbox',
      name: 'Indicador Arraste',
      left: grid.marginX + Math.round(contentW * 0.45),
      top: footerRuleTop + 16,
      width: Math.round(contentW * 0.55),
      text: copy.hasExplicitCta ? copy.cta : copy.swipeLabel,
      fontSize: grid.microFontSize + 1,
      fontWeight: 800,
      fontFamily: palette.monoFont,
      charSpacing: 150,
      fill: palette.accent,
      textAlign: 'right',
    },
  );

  return elements;
}

/**
 * PRODUCT & GASTRONOMY SPOTLIGHT - Tightly cropped appetizing photography + directional warm scrim +
 * visible underline bar + rotated price/special seal + natural social footer.
 * Directly grounded in Oliveira & Coutinho (2021) social media graphic design analysis.
 */
export function buildProductSpotlightElements(
  w: number,
  h: number,
  palette: SocialCompositionPalette,
  copy: SocialCompositionCopy,
  blueprint: ArtDirectionBlueprint,
): CanvasLayoutElementDto[] {
  const { grid } = blueprint;
  const minDim = Math.min(w, h);
  const contentW = w - grid.marginX * 2;
  const isLandscape = grid.isLandscape;
  const scrimHex = palette.isDark ? palette.background : '#141110';

  const elements: CanvasLayoutElementDto[] = [
    // 1. Dominant tightly-framed product/food photo
    {
      id: 'product-hero-photo',
      type: 'image',
      name: 'Fotografia Produto',
      left: 0,
      top: 0,
      width: w,
      height: h,
      objectFit: 'cover',
      imageQuery: copy.imageQuery,
      fill: palette.background,
    },
    // 2. Directional warm/dark gradient scrim (depth + WCAG AA+ legibility without hiding the product)
    {
      id: 'product-directional-scrim',
      type: 'rect',
      name: 'Véu Direcional de Contraste',
      left: 0,
      top: 0,
      width: w,
      height: h,
      fill: scrimHex,
      fillGradient: {
        type: 'linear',
        angle: isLandscape ? 90 : 180,
        stops: isLandscape
          ? [
              { offset: 0, color: scrimHex, opacity: 0.92 },
              { offset: 0.55, color: scrimHex, opacity: 0.62 },
              { offset: 1, color: scrimHex, opacity: 0.18 },
            ]
          : [
              { offset: 0, color: scrimHex, opacity: 0.42 },
              { offset: 0.42, color: scrimHex, opacity: 0.24 },
              { offset: 0.68, color: scrimHex, opacity: 0.78 },
              { offset: 1, color: scrimHex, opacity: 0.94 },
            ],
      },
      opacity: 0.92,
    },
    // 3. Top Masthead (minimal, letting photography breathe)
    {
      id: 'badge-text',
      type: 'textbox',
      name: 'Texto Badge',
      left: grid.marginX,
      top: grid.safeTop,
      width: Math.round(contentW * 0.56),
      text: copy.badge,
      fontSize: grid.microFontSize,
      fontWeight: 700,
      fontFamily: palette.monoFont,
      charSpacing: 190,
      fill: palette.highlight,
      textAlign: 'left',
    },
    {
      id: 'spotlight-brand',
      type: 'textbox',
      name: 'Marca Topo',
      left: grid.marginX + Math.round(contentW * 0.56),
      top: grid.safeTop,
      width: Math.round(contentW * 0.44),
      text: copy.brand.toUpperCase(),
      fontSize: grid.microFontSize,
      fontWeight: 700,
      fontFamily: palette.monoFont,
      charSpacing: 160,
      fill: '#FFF7ED',
      textAlign: 'right',
    },
  ];

  // 4. Rotated Accent Seal (Price / Special / Offer)
  const sealR = clampFont(minDim * 0.082, 54, 86);
  const sealLeft = w - grid.marginX - sealR * 2;
  const sealTop = isLandscape
    ? Math.round(h * 0.16)
    : Math.round(grid.safeTop + (grid.safeBottom - grid.safeTop) * 0.12);

  elements.push(
    {
      id: 'spotlight-seal-bg',
      type: 'polygon',
      name: 'Selo Oferta Produto',
      left: sealLeft,
      top: sealTop,
      width: sealR * 2,
      height: sealR * 2,
      radius: sealR,
      sides: 12,
      isStar: true,
      fill: palette.accent,
      angle: -8,
      shadow: {
        color: 'rgba(0, 0, 0, 0.35)',
        blur: 18,
        offsetX: 0,
        offsetY: 8,
      },
    },
    {
      id: 'spotlight-seal-label',
      type: 'textbox',
      name: 'Texto Selo Produto',
      left: sealLeft + 8,
      top: sealTop + Math.round(sealR - 16),
      width: sealR * 2 - 16,
      text: copy.calloutStat,
      fontSize: clampFont(sealR * 0.32, 17, 28),
      fontWeight: 900,
      fontFamily: palette.displayFont,
      fill: palette.textOnAccent,
      textAlign: 'center',
      angle: -8,
    },
  );

  // 5. Lower-third (or Left-side on landscape) Condensed Display Headline + Visible Underline Bar
  const textW = Math.round(contentW * (isLandscape ? 0.58 : 0.92));
  const headlineSize = clampFont(
    copy.headline.length > 34 ? minDim * 0.064 : minDim * 0.08,
    46,
    92,
  );
  const headlineTop = isLandscape
    ? Math.round(h * 0.28)
    : Math.round(grid.safeTop + (grid.safeBottom - grid.safeTop) * 0.54);

  elements.push({
    id: 'title-headline',
    type: 'textbox',
    name: 'Título Principal',
    left: grid.marginX,
    top: headlineTop,
    width: textW,
    text: copy.headline,
    fontSize: headlineSize,
    fontWeight: 900,
    fontFamily: palette.displayFont,
    lineHeight: 0.98,
    fill: '#FFFDF9',
    textAlign: 'left',
    shadow: {
      color: 'rgba(0, 0, 0, 0.45)',
      blur: 18,
      offsetX: 0,
      offsetY: 6,
    },
  });

  const approxLines = Math.max(
    1,
    Math.min(
      3,
      Math.ceil(copy.headline.length / Math.max(8, Math.floor(textW / (headlineSize * 0.56)))),
    ),
  );
  const underlineTop = headlineTop + Math.round(approxLines * headlineSize * 1.02) + 16;

  elements.push(
    {
      id: 'spotlight-underline',
      type: 'line',
      name: 'Linha de Ênfase Visível',
      left: grid.marginX,
      top: underlineTop,
      width: Math.round(textW * 0.3),
      height: 6,
      rx: 2,
      ry: 2,
      fill: palette.highlight,
    },
    {
      id: 'subtitle-copy',
      type: 'textbox',
      name: 'Subtítulo',
      left: grid.marginX,
      top: underlineTop + 22,
      width: Math.round(textW * 0.88),
      text: copy.subtitle,
      fontSize: grid.bodyFontSize,
      fontWeight: 400,
      fontFamily: palette.bodyFont,
      lineHeight: 1.38,
      fill: '#F1E8DE',
      textAlign: 'left',
    },
  );

  // 6. Natural Social Footer Strip
  const footerRuleTop = grid.safeBottom - 50;
  elements.push(
    {
      id: 'spotlight-footer-rule',
      type: 'line',
      name: 'Fio Rodapé Produto',
      left: grid.marginX,
      top: footerRuleTop,
      width: contentW,
      height: 1,
      fill: '#FFF7ED',
      opacity: 0.28,
    },
    {
      id: 'spotlight-footer-proof',
      type: 'textbox',
      name: 'Informação Produto',
      left: grid.marginX,
      top: footerRuleTop + 16,
      width: Math.round(contentW * 0.52),
      text: `${copy.proofLeft} · ${copy.proofRight}`,
      fontSize: grid.microFontSize,
      fontWeight: 600,
      fontFamily: palette.monoFont,
      charSpacing: 130,
      fill: '#E5D5C5',
      textAlign: 'left',
    },
    {
      id: 'spotlight-footer-cta',
      type: 'textbox',
      name: 'Chamada Social',
      left: grid.marginX + Math.round(contentW * 0.52),
      top: footerRuleTop + 14,
      width: Math.round(contentW * 0.48),
      text: copy.cta,
      fontSize: grid.microFontSize + 2,
      fontWeight: 800,
      fontFamily: palette.monoFont,
      charSpacing: 140,
      fill: palette.highlight,
      textAlign: 'right',
    },
  );

  return elements;
}
