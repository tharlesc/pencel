import type { ReactElement } from 'react';
import { Icon } from '../../../../components/ui/index.js';
import type { PresetItem, SavedDocumentPreset } from '../../model/newDocumentModel.js';
import styles from './NewDocumentModal.module.css';

export interface NewDocumentSavedListProps {
  readonly savedPresets: readonly SavedDocumentPreset[];
  readonly selectedPresetName: string;
  readonly onSelectPreset: (preset: PresetItem) => void;
  readonly onDoubleClickPreset: (preset: PresetItem) => void;
  readonly onDeleteSavedPreset: (id: string) => void;
}

export function NewDocumentSavedList({
  savedPresets,
  selectedPresetName,
  onSelectPreset,
  onDoubleClickPreset,
  onDeleteSavedPreset,
}: NewDocumentSavedListProps): ReactElement {
  if (savedPresets.length === 0) {
    return (
      <div className={styles.emptySavedState}>
        <p>Nenhuma predefinição salva ainda.</p>
        <p>Configure dimensões ao lado e clique em &ldquo;Salvar Predefinição&rdquo;.</p>
      </div>
    );
  }

  return (
    <div className={styles.savedList}>
      {savedPresets.map((preset) => {
        const isSelected = selectedPresetName === preset.name;
        const presetItem: PresetItem = {
          name: preset.name,
          width: preset.width,
          height: preset.height,
          resolution: preset.resolution,
          defaultUnit: preset.unit,
        };

        return (
          <div
            key={preset.id}
            className={[styles.savedItem, isSelected ? styles.savedItemActive : '']
              .filter(Boolean)
              .join(' ')}
          >
            <button
              type="button"
              className={styles.savedItemContent}
              onClick={() => onSelectPreset(presetItem)}
              onDoubleClick={() => onDoubleClickPreset(presetItem)}
            >
              <div className={styles.savedItemTitle}>{preset.name}</div>
              <div className={styles.savedItemMeta}>
                {preset.width} × {preset.height} px @ {preset.resolution} ppi ·{' '}
                {preset.colorMode.toUpperCase()}/{preset.depth} bit
              </div>
            </button>
            <button
              type="button"
              aria-label={`Excluir predefinição ${preset.name}`}
              className={styles.deleteSavedBtn}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSavedPreset(preset.id);
              }}
            >
              <Icon name="trash" size="xs" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
