import type { ReactElement } from 'react';
import { Icon } from '../../../../components/ui/index.js';
import {
  EXPANDED_FONT_CATALOG,
  DEFAULT_FONT_VARIANTS,
  loadWebFont,
  type FontVariantOption,
} from '../../services/fontLoaderService.js';
import styles from './ContextualToolbar.module.css';

export interface ContextualFontVariantPopoverProps {
  readonly currentFamily: string;
  readonly currentWeight?: string | number;
  readonly currentStyle?: string;
  readonly onSelectVariant: (weight: string, style: 'normal' | 'italic') => void;
  readonly onClose: () => void;
}

export function ContextualFontVariantPopover({
  currentFamily,
  currentWeight = '400',
  currentStyle = 'normal',
  onSelectVariant,
  onClose,
}: ContextualFontVariantPopoverProps): ReactElement {
  const cleanFamily = currentFamily.replace(/['"]/g, '').split(',')[0]?.trim().toLowerCase() || '';

  const matchedFont = EXPANDED_FONT_CATALOG.find(
    (f) =>
      f.family.toLowerCase().includes(cleanFamily) ||
      f.label.toLowerCase() === cleanFamily ||
      f.id.toLowerCase() === cleanFamily,
  );

  const variants =
    matchedFont?.variants && matchedFont.variants.length > 0
      ? matchedFont.variants
      : DEFAULT_FONT_VARIANTS;

  const curWeightStr = String(currentWeight === 'bold' ? '700' : currentWeight || '400');
  const curStyleStr = currentStyle || 'normal';

  return (
    <div
      className={styles.fontMenuPopover}
      onClick={(e) => e.stopPropagation()}
      style={{ minWidth: '160px' }}
    >
      <div
        className={styles.fontCategoryHeader}
        style={{ padding: 'var(--space-2) var(--space-3)' }}
      >
        Estilos de {matchedFont?.label || 'Fonte'}
      </div>
      <div className={styles.fontMenuList}>
        {variants.map((variant: FontVariantOption) => {
          const isSelected = variant.weight === curWeightStr && variant.style === curStyleStr;

          return (
            <button
              key={variant.id}
              type="button"
              className={[styles.fontMenuItem, isSelected ? styles.fontMenuItemActive : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                if (matchedFont) {
                  void loadWebFont(matchedFont, variant);
                }
                onSelectVariant(variant.weight, variant.style);
                onClose();
              }}
              title={`${variant.label} (Peso ${variant.weight})`}
            >
              <span
                className={styles.fontSampleText}
                style={{
                  fontFamily: matchedFont?.family || currentFamily,
                  fontWeight: Number.parseInt(variant.weight, 10) || 400,
                  fontStyle: variant.style,
                }}
              >
                {variant.label}
              </span>
              {isSelected && <Icon name="check" size="xs" tone="accent" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
