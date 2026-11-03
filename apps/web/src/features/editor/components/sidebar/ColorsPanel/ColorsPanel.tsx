import type { ReactElement } from 'react';
import { ColorPicker, Icon } from '../../../../../components/ui/index.js';
import { useColorsPanel } from '../../../hooks/useColorsPanel.js';
import { CANVA_PALETTE_SWATCHES } from '../../../model/presetCatalog.js';
import { useOptionalEditorSession } from '../../../state/EditorProvider.js';
import styles from '../../SidebarNav/SidebarNav.module.css';

export interface ColorsPanelProps {
  readonly pageBackground?: string;
  readonly onPageBackgroundChange?: (color: string) => void;
}

export function ColorsPanel({
  pageBackground: propPageBg,
  onPageBackgroundChange: propOnPageBgChange,
}: ColorsPanelProps): ReactElement {
  const session = useOptionalEditorSession();
  const pageBackground = propPageBg ?? session?.activePage.backgroundColor ?? '#FBFBFD';
  const onPageBackgroundChange = propOnPageBgChange ?? session?.setPageBackground ?? (() => {});

  const {
    aiPalette,
    isGeneratingAiPalette,
    savedPalettes,
    currentShades,
    designerPalettes,
    handleSavePalette,
    handleDeleteSavedPalette,
    handleGenerateAiPalette,
  } = useColorsPanel();

  return (
    <div className={styles.section}>
      <div className={styles.subSection}>
        <div className={styles.aiPaletteHeader}>
          <span className={styles.subTitle}>Paleta Harmônica</span>
          <button
            type="button"
            onClick={() => void handleGenerateAiPalette()}
            disabled={isGeneratingAiPalette}
            className={styles.studioSuggestBtn}
            title="Sugerir combinação de cores"
          >
            <Icon name="palette" size="xs" />
            <span>{isGeneratingAiPalette ? 'Gerando...' : 'Sugerir Cores'}</span>
          </button>
        </div>

        <div className={styles.paletteBarPreview}>
          {aiPalette.map((color, idx) => (
            <button
              key={`${color}-${idx}`}
              type="button"
              className={styles.paletteBarItem}
              style={{ backgroundColor: color }}
              onClick={() => onPageBackgroundChange(color)}
              title={`Aplicar ${color} ao fundo`}
              aria-label={`Cor da paleta ${color}`}
            />
          ))}
        </div>
      </div>

      <div className={styles.subSection}>
        <div className={styles.savedPalettesHeader}>
          <span className={styles.subTitle}>Minhas Paletas</span>
          <button
            type="button"
            onClick={() => handleSavePalette(aiPalette)}
            className={styles.studioSuggestBtn}
            title="Salvar paleta atual"
          >
            <Icon name="plus" size="xs" />
            <span>Salvar Atual</span>
          </button>
        </div>

        {savedPalettes.length === 0 ? (
          <span className={styles.savedPalettesEmpty}>
            Nenhuma paleta salva. Clique em &quot;Salvar Atual&quot; para guardar.
          </span>
        ) : (
          <div className={styles.savedPalettesList}>
            {savedPalettes.map((pal) => (
              <div key={pal.id} className={styles.savedPaletteCard}>
                <span className={styles.savedPaletteName}>{pal.name}</span>
                <div className={styles.savedPaletteSwatches}>
                  {pal.colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={styles.savedSwatchItem}
                      style={{ backgroundColor: c }}
                      onClick={() => onPageBackgroundChange(c)}
                      title={`Aplicar ${c}`}
                      aria-label={`Aplicar cor salva ${c}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className={styles.savedPaletteDeleteBtn}
                  onClick={() => handleDeleteSavedPalette(pal.id)}
                  title="Excluir paleta"
                  aria-label={`Excluir ${pal.name}`}
                >
                  <Icon name="trash" size="xs" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.subSection}>
        <span className={styles.subTitle}>Tons & Sombras da Cor Ativa</span>
        <div className={styles.shadesStrip}>
          <span className={styles.shadesLabel}>Tons Claros</span>
          <div className={styles.shadesRow}>
            {currentShades.tints.map((c) => (
              <button
                key={c}
                type="button"
                className={styles.shadeSwatch}
                style={{ backgroundColor: c }}
                onClick={() => onPageBackgroundChange(c)}
                title={`Tom claro: ${c}`}
                aria-label={`Aplicar tom claro ${c}`}
              />
            ))}
          </div>
          <span className={styles.shadesLabel}>Tons Escuros</span>
          <div className={styles.shadesRow}>
            {currentShades.shades.map((c) => (
              <button
                key={c}
                type="button"
                className={styles.shadeSwatch}
                style={{ backgroundColor: c }}
                onClick={() => onPageBackgroundChange(c)}
                title={`Tom escuro: ${c}`}
                aria-label={`Aplicar tom escuro ${c}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className={styles.subSection}>
        <span className={styles.subTitle}>Paletas de Design Selecionadas</span>
        <div className={styles.curatedPalettesList}>
          {designerPalettes.map((pal) => (
            <div key={pal.id} className={styles.curatedPaletteRow}>
              <span className={styles.curatedPaletteName}>{pal.name}</span>
              <div className={styles.curatedPaletteSwatches}>
                {pal.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={styles.curatedSwatchItem}
                    style={{ backgroundColor: c }}
                    onClick={() => onPageBackgroundChange(c)}
                    title={`Aplicar ${c}`}
                    aria-label={`Aplicar cor curada ${c}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.subSection}>
        <span className={styles.subTitle}>Espectro e Cores de Fundo</span>
        <div className={styles.sidebarColorPickerWrapper}>
          <ColorPicker
            color={
              pageBackground.startsWith('#') && pageBackground.length === 7
                ? pageBackground
                : '#0066CC'
            }
            onChange={onPageBackgroundChange}
          />
        </div>
        <div className={styles.colorSwatchesGrid}>
          {CANVA_PALETTE_SWATCHES.map((swatch) => (
            <button
              key={swatch.value}
              type="button"
              className={styles.colorGridItem}
              style={{ backgroundColor: swatch.value }}
              onClick={() => onPageBackgroundChange(swatch.value)}
              title={`${swatch.label} (${swatch.value})`}
              aria-label={`Aplicar ${swatch.label}`}
            >
              <span className={styles.swatchHoverLabel}>{swatch.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
