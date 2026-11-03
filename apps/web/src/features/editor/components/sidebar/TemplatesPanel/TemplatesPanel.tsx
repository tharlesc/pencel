import type { ReactElement } from 'react';
import { Icon, Input } from '../../../../../components/ui/index.js';
import { useTemplatesPanel, type TemplatesPanelProps } from '../../../hooks/useTemplatesPanel.js';
import {
  useOptionalEditorEngine,
  useOptionalEditorSession,
} from '../../../state/EditorProvider.js';
import styles from '../../SidebarNav/SidebarNav.module.css';

export function TemplatesPanel({
  activePresetId: propPresetId,
  onSelectPreset: propOnSelectPreset,
  onApplyTemplate: propOnApplyTemplate,
  onOpenNewDocumentModal: propOnOpenNewDocumentModal,
}: TemplatesPanelProps): ReactElement {
  const session = useOptionalEditorSession();
  const engine = useOptionalEditorEngine();

  const activePresetId = propPresetId ?? session?.document.presetId ?? 'instagram-post';
  const onSelectPreset = propOnSelectPreset ?? session?.selectPreset ?? (() => {});
  const onApplyTemplate = propOnApplyTemplate ?? engine?.applyTemplate ?? (() => {});
  const onOpenNewDocumentModal =
    propOnOpenNewDocumentModal ?? session?.openNewDocumentModal ?? (() => {});

  const { searchQuery, setSearchQuery, presets, filteredTemplates } = useTemplatesPanel();

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
          onClick={onOpenNewDocumentModal}
          aria-label="Tamanho Personalizado / Criar Novo"
        >
          <Icon name="filePlus" size="xs" />
          <span>Tamanho Personalizado / Criar Novo</span>
        </button>
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
