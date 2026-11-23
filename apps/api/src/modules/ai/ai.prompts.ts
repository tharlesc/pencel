import { analyzeDesignBrief } from './ai.designKnowledge.js';
import type {
  GenerateLayoutOptions,
  LayoutCompositionArchetype,
  LayoutStyleTheme,
} from './ai.types.js';

export const CURATED_AI_FONTS: readonly string[] = [
  'Inter',
  'Space Grotesk',
  'Syne',
  'Outfit',
  'Plus Jakarta Sans',
  'DM Sans',
  'Montserrat',
  'Poppins',
  'Playfair Display',
  'Cormorant Garamond',
  'Lora',
  'Merriweather',
  'Bebas Neue',
  'Oswald',
  'Anton',
  'JetBrains Mono',
  'Space Mono',
  'Caveat',
];

interface StyleDirectionSpec {
  readonly mood: string;
  readonly displayFont: string;
  readonly bodyFont: string;
  readonly monoFont: string;
  readonly paletteGuide: string;
  readonly visualMotifs: string;
}

const STYLE_DIRECTIONS: Readonly<Record<string, StyleDirectionSpec>> = {
  tech: {
    mood: 'Industrial-grade product graphic poster (Braun/Apple editorial sensibility), deep graphite surfaces, focused optical light, surgical clarity.',
    displayFont: 'Space Grotesk',
    bodyFont: 'Inter',
    monoFont: 'JetBrains Mono',
    paletteGuide:
      'Deep obsidian/graphite canvas (#0B0D13 to #141B2D), electric azure/cyan accent (#0A84FF / #64D2FF), crisp off-white primary ink (#F8FAFC), cool slate secondary (#94A3B8).',
    visualMotifs:
      'Focused low-opacity optical radial glow (0.14-0.20), razor-thin 1px Swiss hairline rules, bold asymmetric display scale, crisp technical mono metadata.',
  },
  promo: {
    mood: 'High-impact advertising poster, unmistakable visual hierarchy in < 1.5s, urgent focal number, bold chromatic contrast.',
    displayFont: 'Anton',
    bodyFont: 'Plus Jakarta Sans',
    monoFont: 'Space Mono',
    paletteGuide:
      'Deep charcoal/crimson ground (#121214 to #261014), signal red (#FF3B30) and electric amber (#FFD60A) accents, crisp warm-white ink (#FFFDF9).',
    visualMotifs:
      'Full-bleed color blocking or dramatic dark ground, monumental offer numeral, rotated starburst polygon seal, visible underline bar, clean bottom ticker rule.',
  },
  minimal: {
    mood: 'Swiss modernist graphic design (Muller-Brockmann / Emil Ruder), generous active negative space (35-45%), mathematical alignment, zero visual noise.',
    displayFont: 'Outfit',
    bodyFont: 'Inter',
    monoFont: 'Space Mono',
    paletteGuide:
      'Warm alabaster/off-white paper (#F5F5F7 to #EAEAEF), carbon ink (#1D1D1F), zinc secondary (#52525B), single functional accent (#0066CC or #1D1D1F).',
    visualMotifs:
      '1px hairline horizontal and vertical grid rules, tracked uppercase micro-labels (charSpacing 160-240), sculptural typography with abundant breathing room.',
  },
  elegant: {
    mood: 'Luxury magazine lookbook / fine atelier editorial, restrained prestige, high-contrast serif poise, warm champagne refinement.',
    displayFont: 'Cormorant Garamond',
    bodyFont: 'Montserrat',
    monoFont: 'Space Mono',
    paletteGuide:
      'Midnight ink or deep espresso canvas (#16161D to #23202D), antique champagne gold (#D4AF37 / #F3E5AB), warm ivory ink (#FAF7F0), muted stone secondary (#BEB8AD).',
    visualMotifs:
      'Fine 1px inset hairline frame, Roman + Italic serif contrast, wide-tracked uppercase captions (charSpacing 220-280), generous vertical air.',
  },
  vibrant: {
    mood: 'Contemporary cultural poster / music & creative festival (Weingart / Paula Scher energy), expressive scale, rhythmic planes and movement.',
    displayFont: 'Syne',
    bodyFont: 'DM Sans',
    monoFont: 'Space Mono',
    paletteGuide:
      'Deep indigo/void ground (#0E0F1D to #24113D), luminous violet/magenta/lime accents (#C056F7, #FF2D55, #30D158), crisp white ink (#FBFBFD).',
    visualMotifs:
      'Overlapping graphic circles/rings, angled accent stripes, monumental typography as image, crisp Swiss event metadata strip (date, time, venue).',
  },
  editorial: {
    mood: 'Contemporary print monograph & magazine art direction, tactile newsprint warmth, authoritative serif voice, documentary grid.',
    displayFont: 'Playfair Display',
    bodyFont: 'DM Sans',
    monoFont: 'JetBrains Mono',
    paletteGuide:
      'Warm newsprint cream (#F6F2EA to #ECE5D8) or rich editorial charcoal (#151618), deep ink (#17171A), vermilion or cobalt accent (#C84B31 / #1D4ED8).',
    visualMotifs:
      'Top masthead strip + 1px hairline divider, oversized low-opacity numeral or quote glyph, serif headline with italic accent line, clean attribution bar.',
  },
  organic: {
    mood: 'Artisan botanical, wellness, or gastronomy brand with tactile linen warmth, honest nature tones, and serene balance.',
    displayFont: 'Lora',
    bodyFont: 'Plus Jakarta Sans',
    monoFont: 'Space Mono',
    paletteGuide:
      'Soft tactile linen (#F3F1EC to #E5E8DF), deep forest green (#1E4D3B), warm terracotta/amber accent (#C96F4B), deep charcoal ink (#1D2722).',
    visualMotifs:
      'Organic curved ellipses/arches, airy negative space, cleanly cropped natural photography when enabled, humanist serif headline with italic emphasis.',
  },
};

const ARCHETYPE_INSTRUCTIONS: Readonly<Record<LayoutCompositionArchetype, string>> = {
  auto: 'Select the strongest graphic design composition for this piece type and domain (prefer poster-impact, swiss-editorial, carousel-cover, or product-spotlight for social posts; reserve framed-card/editorial-split with CTA buttons for web banners).',
  'poster-impact':
    'POSTER IMPACT (Social Poster / Promo / Event): Full-bleed edge-to-edge graphic artboard (NO outer floating SaaS card!). Place 1 giant low-opacity background numeral/monogram (opacity 0.07-0.12) or bold geometric color block, a dramatic 2-layer stacked display headline (huge main line + contrasting accent/underlined or hollow stroked line with tight lineHeight 0.94-1.05), a rotated starburst polygon seal for the key offer/date, and a razor-sharp bottom metadata strip separated by a 1px hairline (NO HTML pill button).',
  'swiss-editorial':
    'SWISS EDITORIAL GRID (Quote / Magazine / Luxury / Minimal): Built strictly on the computed Swiss columns with 35-45% active negative space (Hofmann/Ruder). Top masthead (category left + @brand right + 1px hairline rule), vertical 3-4px accent margin rail, sculptural serif or geometric display headline anchored asymmetrically, optional italic or accent-colored emphasis phrase, short crisp divider rule, concise 1-2 line reflection/caption, and refined attribution footer.',
  'carousel-cover':
    'INSTAGRAM CAROUSEL COVER / CONTENT SLIDE: Designed for immediate scroll-stopping mobile legibility. Top editorial header ("01 / 05" slide index left + "@brand" right + 1px hairline), monumental low-opacity slide numeral in the background (opacity 0.06-0.10), bold left-aligned display headline with a keyword emphasized via `textBackgroundColor` marker strip or colored underline bar, crisp 1-sentence hook below, and a clean bottom directional cue ("ARRASTE ->" / "SWIPE ->").',
  'product-spotlight':
    'PRODUCT & GASTRONOMY SPOTLIGHT (Food / Retail / Craft): Grounded in Oliveira & Coutinho (2021) Instagram criteria. Dominant tightly-cropped appetizing product/food photo (`type: "image"`, 55-100% area, `objectFit: "cover"`) paired with a warm/dark directional gradient scrim for crisp layering and depth, oversized condensed display headline with a visible underline accent bar beneath it, optional rotated price/special seal, 1 short sensory line, and a clean bottom `@brand · delivery/address` strip.',
  'photo-overlay':
    'FULL-BLEED PHOTO OVERLAY: Edge-to-edge editorial photograph (`type: "image"` with specific English `imageQuery` and `objectFit: "cover"`) with a smooth directional tonal scrim so top editorial metadata and lower-third bold display typography achieve effortless WCAG AA+ contrast.',
  'editorial-split':
    'ASYMMETRIC EDITORIAL SPLIT: Two distinct visual zones aligned to the Swiss grid (~55% typographic column + ~40% contrasting photography or solid graphic plane). Stack vertically on portrait/story formats.',
  'bold-typo':
    'TYPOGRAPHIC MANIFESTO: Oversized edge-to-edge display lettering as the central visual architecture, combining filled + hollow stroked (`fill: "transparent"`, `stroke`, `strokeWidth`) or highlighted (`textBackgroundColor`) lines with tight leading (0.94-1.04) and Swiss metadata strips.',
  'framed-card':
    'FRAMED EDITORIAL PLATE: Use an inset hairline magazine plate or structured card frame ONLY when fitting an invitation, menu plate, or web banner. Keep margins airy and avoid generic SaaS dashboard widgets.',
  'hero-bento':
    'MODULAR SWISS BENTO: Strictly aligned modular rectangles sharing 16-24px gutters and crisp 1px strokes, highlighting 1 focal headline tile + 1-2 visual/data panels (best for product specs or multi-point web banners).',
};

function resolveStyleDirection(style?: LayoutStyleTheme): StyleDirectionSpec | undefined {
  if (!style) return undefined;
  if (style === 'bold') return STYLE_DIRECTIONS.promo;
  if (style === 'dark') return STYLE_DIRECTIONS.tech;
  return STYLE_DIRECTIONS[style];
}

/**
 * Builds the unified Principal Graphic Designer & Art Director system prompt
 * grounded in formal graphic design principles (Bomeny 2009; Oliveira & Coutinho 2021; Santos & Claudino)
 * and shared across Gemini, OpenAI, Claude, and DeepSeek.
 */
export function buildCreativeSystemPrompt(options: GenerateLayoutOptions): string {
  const width = options.dimensions?.width ?? 1080;
  const height = options.dimensions?.height ?? 1080;
  const blueprint = analyzeDesignBrief(options);
  const { grid, grammar, pieceType, isWebInterface } = blueprint;
  const explicitStyle = resolveStyleDirection(options.style);

  const effectiveDisplayFont = explicitStyle?.displayFont ?? grammar.displayFont;
  const effectiveBodyFont = explicitStyle?.bodyFont ?? grammar.secondaryFont;
  const effectiveMonoFont = explicitStyle?.monoFont ?? grammar.microFont;
  const effectiveMood = explicitStyle?.mood ?? `${grammar.labelPt}. ${grammar.copyTone}`;
  const effectivePaletteGuide =
    explicitStyle?.paletteGuide ??
    `Ground ${grammar.palette.ground} to ${grammar.palette.groundEnd}, Primary ink ${grammar.palette.ink}, Secondary ink ${grammar.palette.inkMuted}, Accent ${grammar.palette.accent}, Highlight ${grammar.palette.accentAlt}.`;

  const archetype: LayoutCompositionArchetype =
    options.archetype && options.archetype !== 'auto'
      ? options.archetype
      : grammar.defaultArchetype;

  const variationsCount = options.mode === 'refine' ? 1 : (options.variationsCount ?? 1);
  const includeImagery =
    Boolean(options.brief?.includeImagery) ||
    archetype === 'photo-overlay' ||
    archetype === 'product-spotlight';

  const antiWebUiRule = isWebInterface
    ? `WEB BANNER MODE: This piece is an intentional digital/web banner. Use horizontal left-to-right scanning flow with a clear headline, 1-line value proposition, optional visual spotlight, and a crisp high-contrast clickable CTA button.`
    : `STRICT SOCIAL MEDIA GRAPHIC DESIGN DISCIPLINE (ANTI-WEBSITE-UI RULE):
- You are designing an authentic, human-crafted GRAPHIC DESIGN PIECE (${pieceType}) for Instagram/social feeds, NOT a website, SaaS landing page, or mobile app UI!
- FORBIDDEN CLICHÉS (NEVER generate these on social posts):
  * NO full-canvas rounded white/dark "website hero card" floating inside a gradient frame.
  * NO fake HTML pill <button> CTAs with rounded corners and drop shadows (like generic "Saiba Mais" or "Começar Agora" web buttons), UNLESS the user's Creative Brief explicitly supplies an Exact CTA Text.
  * NO SaaS dashboard feature-chip grids or 2-column bullet checklists.
  * NO long 3-4 sentence web paragraphs.
- HUMAN GRAPHIC DESIGN CRAFT (APPLY THESE INSTEAD):
  * Full-bleed edge-to-edge canvas composition (color planes, editorial paper ground, cropped photography, or deep tonal backdrop).
  * Expressive 2-part display typography: split the headline into dramatic scale/weight/color contrast (e.g., uppercase condensed display + accent-colored emphasis word, OR Roman + Italic serif pairing, OR a keyword highlighted with \`textBackgroundColor\`, OR hollow outlined poster type using \`fill: "transparent"\`, \`stroke\`, \`strokeWidth: 2\`).
  * Architectural graphic accents: 1px hairline grid rules, short visible underline bars beneath key words (Oliveira & Coutinho), oversized low-opacity background numerals/monograms (\`opacity: 0.06-0.12\`), or rotated starburst/stamp seals (\`polygon\` + \`angle: -8..-14\`) for offers/prices.
  * Authentic social footer rhythm: clean horizontal strip with \`@brand\`, date/time/venue, \`01 / 05 ->\`, \`ARRASTE ->\`, or \`PEÇA NO DELIVERY\` instead of a fake web button.`;

  const schemaSection = `{
  "title": "Short creative title (max 50 chars)",
  "archetype": "poster-impact" | "swiss-editorial" | "carousel-cover" | "product-spotlight" | "photo-overlay" | "editorial-split" | "bold-typo" | "framed-card" | "hero-bento",
  "backgroundColor": "#RRGGBB",
  "backgroundGradient": {
    "type": "linear" | "radial",
    "angle": 135,
    "stops": [
      { "offset": 0, "color": "#RRGGBB" },
      { "offset": 1, "color": "#RRGGBB" }
    ]
  },
  "explanation": "1-2 concise sentences explaining the graphic design principles applied (grid, color psychology, typography, Gestalt hierarchy).",
  "elements": [
    {
      "id": "unique-kebab-id",
      "type": "rect" | "circle" | "ellipse" | "triangle" | "line" | "polygon" | "path" | "textbox" | "image",
      "name": "Readable layer name",
      "left": number,
      "top": number,
      "width": number,
      "height": number,
      "radius": number,
      "rx": number,
      "ry": number,
      "fill": "#RRGGBB or transparent (for outlined poster text)",
      "fillGradient": { "type": "linear" | "radial", "angle": number, "stops": [{ "offset": 0, "color": "#RRGGBB", "opacity": 1 }] },
      "stroke": "#RRGGBB",
      "strokeWidth": number,
      "strokeDashArray": [6, 4],
      "opacity": number,
      "angle": number,
      "shadow": { "color": "rgba(0,0,0,0.35)", "blur": 24, "offsetX": 0, "offsetY": 10 },
      "text": "Visible copy (for textbox)",
      "fontSize": number,
      "fontFamily": "One of the curated Google Fonts",
      "fontWeight": 300 | 400 | 500 | 600 | 700 | 800 | 900,
      "fontStyle": "normal" | "italic",
      "textAlign": "left" | "center" | "right",
      "lineHeight": number,
      "charSpacing": number,
      "textBackgroundColor": "#RRGGBB (optional highlighter bar behind key words)",
      "sides": number,
      "isStar": boolean,
      "pathData": "SVG path d string (for path)",
      "imageQuery": "Concise 2-4 English keywords for stock photo (ONLY for type: image)",
      "borderRadius": number,
      "objectFit": "cover"
    }
  ]
}`;

  const outputEnvelope =
    variationsCount > 1
      ? `Return EXCLUSIVELY a valid JSON object (no markdown fences, no prose outside JSON) with shape:
{
  "variations": [ <${variationsCount} complete layout objects following the schema below> ]
}
CRITICAL: Each of the ${variationsCount} variations MUST use a genuinely DIFFERENT graphic composition archetype and distinct visual rhythm (e.g. one poster-impact, one swiss-editorial, one carousel-cover or product-spotlight). Never repeat the same layout with only a color tweak.`
      : `Return EXCLUSIVELY a single valid JSON object (no markdown fences, no prose outside JSON) matching the schema below.`;

  return `You are a Master Graphic Designer and Editorial Art Director at Pencel Studio, trained in Swiss Modernism, Gestalt visual perception, and contemporary social media visual communication.
Your job is to compose authentic, human-crafted, 100% editable vector + typography graphic creatives for a ${width}x${height}px artboard.

ARTBOARD FORMAT & MATHEMATICAL SWISS GRID (Muller-Brockmann / Gerstner):
- Piece Type: ${pieceType} | Domain: ${grammar.labelPt}
- Format: ${grid.formatLabel}
- Grid Columns: ${grid.columns} columns (colWidth: ${grid.colWidth}px, gutter: ${grid.gutter}px, column X starts: [${grid.columnX.join(', ')}])
- Safe Area: left >= ${grid.marginX}px, right <= ${width - grid.marginX}px, top >= ${grid.safeTop}px, bottom <= ${grid.safeBottom}px.${grid.isStoryVertical ? ' (Strictly respect 9:16 mobile Story UI safe zones: avoid top 12% profile bar and bottom 15% reply bar.)' : ''}
- Golden Section Focal Coordinates: (${grid.goldenX}px, ${grid.goldenY}px)
- Proportional Type Scale: Display headline ${grid.displayFontMin}px to ${grid.displayFontMax}px (tight lineHeight 0.94-1.10); Supporting copy ${grid.bodyFontSize}px (lineHeight 1.32-1.45); Tracked micro-labels ${grid.microFontSize}px (charSpacing 140-260).

FORMAL GRAPHIC DESIGN PRINCIPLES TO APPLY:
1. Form Follows Message & Simplicity (John Maeda Law 10): Subtract the obvious and add the meaningful. Eliminate decorative filler; every shape, rule, or accent must serve hierarchy or emotion.
2. Gestalt Pregnancia & Immediate Readability (Gomes Filho; Oliveira & Coutinho): Create 1 dominant focal center readable in < 1.5 seconds on a smartphone feed. Use visible lines/underlines and layering depth to guide the eye naturally.
3. Figure/Ground & Active Negative Space (Armin Hofmann; Emil Ruder): Leave 25-45% intentional open breathing space so positive forms carry tension and visual sophistication.
4. Triple Typographic Dimension (Wolfgang Weingart): Balance SYNTACTIC craft (scale contrast, weight shifts, alignments, diagonals, rules), SEMANTIC voice (typeface matching cultural subject), and PRAGMATIC impact (unmistakable mobile legibility that draws the viewer in).
5. Jan Tschichold's Precision: Limit to 2 harmonious typefaces (+ optional mono micro-label), track uppercase micro-labels meticulously, align every block to the computed grid X coordinates.
6. Color Psychology & Sensation (Pedrosa; Oliveira & Coutinho): ${grammar.colorPsychology}
7. Nuance over Cliché (Tibor Kalman & David Jury): Avoid sterile stock templates; craft memorable visual character with restrained, intentional asymmetry.

${antiWebUiRule}

ART DIRECTION & VISUAL GRAMMAR:
- Mood & Tone: ${effectiveMood}
- Gestalt Strategy: ${grammar.gestaltFocus}
- Typography Voice: ${grammar.typographyVoice}
- Recommended Font Pairing: Display "${effectiveDisplayFont}", Secondary "${effectiveBodyFont}", Micro/Meta "${effectiveMonoFont}".
- Palette Direction: ${effectivePaletteGuide}
- Domain Composition Cues: ${grammar.compositionCues}
- Selected Composition Archetype (${archetype}): ${ARCHETYPE_INSTRUCTIONS[archetype]}

CURATED LOADABLE FONTS (use ONLY names from this list):
${CURATED_AI_FONTS.join(', ')}

TECHNICAL EXECUTION RULES:
1. Layer count & order: Produce ${variationsCount > 1 ? '7 to 11 crisp, intentional' : '8 to 14 intentional'} layered elements strictly ordered back-to-front (background graphic planes/watermarks -> framed photo -> tonal scrim -> hairline grid rules/underlines -> masthead/category label -> display headline + emphasis accent -> concise 1-line subcopy -> rotated seal/stamp if relevant -> clean social footer/@brand). Omit unused fields to keep JSON lean and fast.
2. Zero accidental text overlap: Estimate wrapped height conservatively: approxLines = ceil(text.length / max(6, floor(width / (fontSize * 0.56)))), height = approxLines * fontSize * lineHeight. Keep >= 18px clear vertical gap between readable text blocks. (Low-opacity background watermark text at opacity <= 0.14 is allowed behind foreground text.)
3. Contrast & legibility: Every readable textbox MUST have >= 4.5:1 contrast (3.2:1 for display >= 36px) against the exact plane, scrim, or textBackgroundColor behind it. Always place a gradient scrim rect between a photograph and overlapping text.
4. Copywriting: Write punchy, human, domain-authentic social copy in the EXACT language of the user prompt. Keep headlines short (2-7 words) and subcopy to 1 crisp sentence. Never use Lorem Ipsum or em-dash (U+2014).
5. Imagery rule: ${
    includeImagery
      ? 'Include 1 boldly framed `type: "image"` element (with specific 2-4 word English `imageQuery` and `objectFit: "cover"`) integrated seamlessly into the artboard with a readability scrim wherever text sits over it.'
      : 'Focus on pure graphic design typography, geometric planes, hairline rules, seals, and negative space (do NOT emit `type: "image"` unless the user prompt explicitly asks for a photo).'
  }
6. Valid hex colors (#RRGGBB) for fills/strokes (except \`fill: "transparent"\` for hollow stroked text, and \`rgba(...)\` for shadow.color). Never omit left/top coordinates.

${outputEnvelope}

LAYOUT OBJECT SCHEMA:
${schemaSection}`;
}

/**
 * Builds the structured user prompt including detected graphic domain, piece type,
 * optional creative brief overrides, and iterative refinement context.
 */
export function buildCreativeUserPrompt(options: GenerateLayoutOptions): string {
  const width = options.dimensions?.width ?? 1080;
  const height = options.dimensions?.height ?? 1080;
  const blueprint = analyzeDesignBrief(options);
  const lines: string[] = [
    `Creative Request: "${options.prompt.trim()}"`,
    `Piece Type: ${blueprint.pieceType} | Graphic Domain: ${blueprint.domain} | Style: ${options.style ?? 'auto'} | Archetype: ${options.archetype ?? 'auto'} | Canvas: ${width}x${height}px`,
  ];

  if (options.brief) {
    const briefLines: string[] = [];
    if (options.brief.headline?.trim()) {
      briefLines.push(`- Exact Headline (MUST use verbatim): "${options.brief.headline.trim()}"`);
    }
    if (options.brief.ctaText?.trim()) {
      briefLines.push(
        `- Exact Callout / CTA Text (MUST use verbatim): "${options.brief.ctaText.trim()}"`,
      );
    }
    if (options.brief.brandName?.trim()) {
      briefLines.push(`- Brand / @Handle (include cleanly): "${options.brief.brandName.trim()}"`);
    }
    if (options.brief.brandColor?.trim()) {
      briefLines.push(
        `- Brand Accent Color (anchor palette around this hex): ${options.brief.brandColor.trim()}`,
      );
    }
    if (options.brief.language) {
      const langName =
        options.brief.language === 'pt'
          ? 'Portuguese'
          : options.brief.language === 'es'
            ? 'Spanish'
            : 'English';
      briefLines.push(
        `- Default Language (if prompt language is ambiguous): ${langName} (always prioritize the language of the prompt itself).`,
      );
    }
    if (briefLines.length > 0) {
      lines.push('', 'CREATIVE BRIEF REQUIREMENTS:', ...briefLines);
    }
  }

  if (options.mode === 'refine' && options.currentLayout) {
    const compactCurrent = {
      title: options.currentLayout.title,
      backgroundColor: options.currentLayout.backgroundColor,
      backgroundGradient: options.currentLayout.backgroundGradient,
      elements: options.currentLayout.elements.slice(0, 32),
    };
    lines.push(
      '',
      'REFINEMENT MODE:',
      'Modify the existing layout below according to the Creative Request above. Preserve strong graphic proportions, copy, and brand identity unless the user asks to change them. Return the complete updated layout JSON.',
      JSON.stringify(compactCurrent),
    );
  }

  return lines.join('\n');
}
