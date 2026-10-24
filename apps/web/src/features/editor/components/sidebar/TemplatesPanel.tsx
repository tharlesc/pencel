import type { ReactElement } from 'react';
import { Icon, Input } from '../../../../components/ui/index.js';
import { useTemplatesPanel, type TemplatesPanelProps } from '../../hooks/useTemplatesPanel.js';
import { useOptionalEditorEngine, useOptionalEditorSession } from '../../state/EditorProvider.js';
import styles from '../SidebarNav.module.css';

export function TemplatesPanel({
  activePresetId: propPresetId,
  onSelectPreset: propOnSelectPreset,
  onApplyTemplate: propOnApplyTemplate,
  onCustomDimensionsCreate: propOnCustomDimensionsCreate,
}: TemplatesPanelProps): ReactElement {
  const session = useOptionalEditorSession();
  const engine = useOptionalEditorEngine();

  const activePresetId = propPresetId ?? session?.document.presetId ?? 'instagram-post';
  const onSelectPreset = propOnSelectPreset ?? session?.selectPreset ?? (() => {});
  const onApplyTemplate = propOnApplyTemplate ?? engine?.applyTemplate ?? (() => {});
  const onCustomDimensionsCreate =
    propOnCustomDimensionsCreate ?? session?.setPageDimensions ?? (() => {});

  const {
    searchQuery,
    setSearchQuery,
    isCustomSizeOpen,
    setIsCustomSizeOpen,
    customWidth,
    setCustomWidth,
    customHeight,
    setCustomHeight,
    customUnit,
    setCustomUnit,
    customDpi,
    setCustomDpi,
    presets,
    filteredTemplates,
    handleApplyCustomSize,
  } = useTemplatesPanel({ onCustomDimensionsCreate });

  return (
    <div className={styles.section}>
      <Input
        prefixIcon="search"
        placeholder="Buscar modelos..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onClear={() => setSearchQuery('')}
      />

      <div className={styles.subSection}>
        <button
          type="button"
          className={styles.customSizeHeaderBtn}
          onClick={() => setIsCustomSizeOpen((v) => !v)}
        >
          <Icon name={isCustomSizeOpen ? 'minus' : 'plus'} size="xs" />
          <span>Tamanho Personalizado / Criar Novo</span>
        </button>

        {isCustomSizeOpen ? (
          <div className={styles.customSizeCard}>
            <div className={styles.customInputsRow}>
              <div className={styles.customInputGroup}>
                <span className={styles.customInputLabel}>Largura</span>
                <input
                  type="number"
                  min={64}
                  max={8000}
                  value={customWidth}
                  aria-label="Largura personalizada"
                  onChange={(e) =>
                    setCustomWidth(Math.max(1, Number.parseInt(e.target.value, 10) || 1))
                  }
                  className={styles.customNumberInput}
                />
              </div>
              <div className={styles.customInputGroup}>
                <span className={styles.customInputLabel}>Altura</span>
                <input
                  type="number"
                  min={64}
                  max={8000}
                  value={customHeight}
                  aria-label="Altura personalizada"
                  onChange={(e) =>
                    setCustomHeight(Math.max(1, Number.parseInt(e.target.value, 10) || 1))
                  }
                  className={styles.customNumberInput}
                />
              </div>
            </div>

            <div className={styles.customSelectGroup}>
              <div className={styles.customInputGroup}>
                <span className={styles.customInputLabel}>Unidade</span>
                <select
                  value={customUnit}
                  aria-label="Unidade de medida"
                  onChange={(e) => setCustomUnit(e.target.value as 'px' | 'cm' | 'mm' | 'in')}
                  className={styles.customSelectInput}
                >
                  <option value="px">Pixels (px)</option>
                  <option value="cm">Centímetros (cm)</option>
                  <option value="mm">Milímetros (mm)</option>
                  <option value="in">Polegadas (in)</option>
                </select>
              </div>

              <div className={styles.customInputGroup}>
                <span className={styles.customInputLabel}>Resolução</span>
                <select
                  value={customDpi}
                  aria-label="Resolução em DPI"
                  onChange={(e) =>
                    setCustomDpi(Number.parseInt(e.target.value, 10) as 72 | 150 | 300)
                  }
                  className={styles.customSelectInput}
                >
                  <option value={72}>72 DPI (Web)</option>
                  <option value={150}>150 DPI (Média)</option>
                  <option value={300}>300 DPI (Impressão)</option>
                </select>
              </div>
            </div>

            <button type="button" onClick={handleApplyCustomSize} className={styles.customApplyBtn}>
              Criar Novo Documento
            </button>
          </div>
        ) : null}
      </div>

      <div className={styles.subSection}>
        <span className={styles.subTitle}>Formatos de Redes Sociais</span>
        <div className={styles.presetsGrid}>
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={[
                styles.presetPill,
                preset.id === activePresetId ? styles.presetPillActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectPreset(preset.id)}
            >
              <span className={styles.presetPillName}>{preset.name}</span>
              <span className={styles.presetPillDim}>
                {preset.dimensions.width}×{preset.dimensions.height}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.subSection}>
        <span className={styles.subTitle}>Modelos Prontos</span>
        <div className={styles.templatesGrid}>
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              className={styles.templateCard}
              style={{ backgroundColor: template.previewBg }}
              onClick={() => onApplyTemplate(template.id)}
            >
              <div
                className={styles.templateBadge}
                style={{ backgroundColor: template.previewAccent }}
              >
                {template.badgeText}
              </div>
              <div className={styles.templateHeadline}>{template.headlineText}</div>
              <div className={styles.templateMeta}>{template.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
