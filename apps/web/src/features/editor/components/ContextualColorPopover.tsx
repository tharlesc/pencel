import { useMemo, type ReactElement } from 'react';
import { ColorPicker } from '../../../components/ui/index.js';
import { CANVA_PALETTE_SWATCHES } from '../model/presetCatalog.js';
import { getColorShadesAndTints } from '../services/colorIntelligenceService.js';
import styles from './ContextualToolbar.module.css';

export interface ContextualColorPopoverProps {
  readonly currentColor: string;
  readonly onSelectColor: (color: string) => void;
  readonly onClose: () => void;
}

export function ContextualColorPopover({
  currentColor,
  onSelectColor,
  onClose,
}: ContextualColorPopoverProps): ReactElement {
  const { tints, shades } = useMemo(() => {
    try {
      return getColorShadesAndTints(currentColor);
    } catch {
      return { tints: [], shades: [] };
    }
  }, [currentColor]);

  return (
    <div className={styles.palettePopover} onClick={(e) => e.stopPropagation()}>
      <ColorPicker
        color={currentColor.startsWith('#') && currentColor.length === 7 ? currentColor : '#0071E3'}
        onChange={onSelectColor}
        onClose={onClose}
      />

      <div className={styles.popoverDivider} />

      <span className={styles.swatchesSectionTitle}>Tons & Sombras</span>
      <div className={styles.shadesStrip}>
        {tints.map((tint) => (
          <button
            key={tint}
            type="button"
            className={styles.miniSwatch}
            style={{ backgroundColor: tint }}
            onClick={() => {
              onSelectColor(tint);
              onClose();
            }}
            title={`Tom claro: ${tint}`}
            aria-label={`Tom claro: ${tint}`}
          />
        ))}
      </div>
      <div className={styles.shadesStrip}>
        {shades.map((shade) => (
          <button
            key={shade}
            type="button"
            className={styles.miniSwatch}
            style={{ backgroundColor: shade }}
            onClick={() => {
              onSelectColor(shade);
              onClose();
            }}
            title={`Sombra: ${shade}`}
            aria-label={`Sombra: ${shade}`}
          />
        ))}
      </div>

      <div className={styles.popoverDivider} />

      <span className={styles.swatchesSectionTitle}>Cores Padrão</span>
      <div className={styles.paletteGrid}>
        {CANVA_PALETTE_SWATCHES.map((swatch) => (
          <button
            key={swatch.value}
            type="button"
            className={styles.paletteSwatch}
            style={{ backgroundColor: swatch.value }}
            onClick={() => {
              onSelectColor(swatch.value);
              onClose();
            }}
            title={`${swatch.label} (${swatch.value})`}
            aria-label={`${swatch.label} (${swatch.value})`}
          />
        ))}
      </div>
    </div>
  );
}
