import type { SupportedLocale } from '../../../../../shared/i18n/index.js';
import type { LayoutStyleTheme } from '../../../services/aiLayoutService.js';

export type StyleOption = Extract<
  LayoutStyleTheme,
  'tech' | 'promo' | 'minimal' | 'elegant' | 'vibrant'
>;

export interface LocalizedStyle {
  readonly id: StyleOption;
  readonly label: string;
  readonly desc: string;
}

export const STYLE_OPTIONS_BY_LOCALE: Record<SupportedLocale, readonly LocalizedStyle[]> = {
  en: [
    { id: 'tech', label: 'Tech & Dark', desc: 'Futuristic with neon and high contrast' },
    { id: 'promo', label: 'Promotion', desc: 'Urgency, warm colors and bold callouts' },
    { id: 'minimal', label: 'Minimalist', desc: 'Clean white space and Swiss typography' },
    { id: 'elegant', label: 'Elegant', desc: 'Refined noble tones and editorial prestige' },
    { id: 'vibrant', label: 'Vibrant', desc: 'Dynamic energetic colors and strong presence' },
  ],
  pt: [
    { id: 'tech', label: 'Tech & Dark', desc: 'Futurista com neon e alto contraste' },
    { id: 'promo', label: 'Promoção', desc: 'Urgência, cores quentes e destaque' },
    { id: 'minimal', label: 'Minimalista', desc: 'Espaço em branco e tipografia suíça' },
    { id: 'elegant', label: 'Elegante', desc: 'Tons nobres, dourado e requinte' },
    { id: 'vibrant', label: 'Vibrante', desc: 'Cores dinâmicas e forte presença' },
  ],
  es: [
    { id: 'tech', label: 'Tech y Oscuro', desc: 'Futurista con neón y alto contraste' },
    { id: 'promo', label: 'Promoción', desc: 'Urgencia, colores cálidos y destacados' },
    { id: 'minimal', label: 'Minimalista', desc: 'Espacio en blanco y tipografía suiza' },
    { id: 'elegant', label: 'Elegante', desc: 'Tonos nobles y prestigio editorial' },
    { id: 'vibrant', label: 'Vibrante', desc: 'Colores dinámicos y gran presencia' },
  ],
};

export interface QuickPrompt {
  readonly label: string;
  readonly prompt: string;
  readonly style: StyleOption;
}

export const QUICK_PROMPTS_BY_LOCALE: Record<SupportedLocale, readonly QuickPrompt[]> = {
  en: [
    {
      label: 'Tech Launch',
      prompt:
        'Instagram post announcing the launch of a new artificial intelligence application with dark theme and glowing highlights',
      style: 'tech',
    },
    {
      label: 'Flash Sale',
      prompt: 'Flash sale banner with 50% discount on all items for a limited time only',
      style: 'promo',
    },
    {
      label: 'Design Quote',
      prompt:
        'Editorial poster about simplicity, focus and intentional craft in modern graphic design',
      style: 'minimal',
    },
    {
      label: 'Masterclass Event',
      prompt:
        'Invitation banner for an exclusive live masterclass on creative automation and modern interfaces',
      style: 'vibrant',
    },
    {
      label: 'Artisan Menu',
      prompt:
        'Special seasonal menu card for a gourmet coffee house featuring specialty roasts and weekend brunch',
      style: 'elegant',
    },
  ],
  pt: [
    {
      label: 'Lançamento Tech',
      prompt:
        'Post para Instagram anunciando o lançamento de um novo aplicativo de inteligência artificial',
      style: 'tech',
    },
    {
      label: 'Oferta Promocional',
      prompt: 'Super queima de estoque com 50% de desconto em todo o site por tempo limitado',
      style: 'promo',
    },
    {
      label: 'Citação Editorial',
      prompt: 'Citação editorial sobre simplicidade, foco e criatividade no design contemporâneo',
      style: 'minimal',
    },
    {
      label: 'Masterclass Ao Vivo',
      prompt:
        'Convite para Masterclass ao vivo sobre automação criativa e desenvolvimento web moderno',
      style: 'vibrant',
    },
    {
      label: 'Cardápio Especial',
      prompt: 'Menu especial do dia para cafeteria gourmet com grãos selecionados e brunch',
      style: 'elegant',
    },
  ],
  es: [
    {
      label: 'Lanzamiento Tech',
      prompt:
        'Publicación para Instagram anunciando el lanzamiento de una nueva aplicación de inteligencia artificial',
      style: 'tech',
    },
    {
      label: 'Oferta Promocional',
      prompt: 'Gran liquidación con 50% de desconto en todo el sitio por tiempo limitado',
      style: 'promo',
    },
    {
      label: 'Cita Editorial',
      prompt: 'Cita editorial sobre simplicidad, enfoque y creatividad en el diseño contemporáneo',
      style: 'minimal',
    },
    {
      label: 'Masterclass En Vivo',
      prompt:
        'Invitación a Masterclass en vivo sobre automatización creativa y desarrollo web moderno',
      style: 'vibrant',
    },
    {
      label: 'Menú Especial',
      prompt: 'Menú especial del día para cafetería gourmet con granos selectos y brunch',
      style: 'elegant',
    },
  ],
};
