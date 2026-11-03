import type { ReactElement } from 'react';
import { pxToUnit, type PresetItem } from '../../model/newDocumentModel.js';
import styles from './NewDocumentModal.module.css';

export interface NewDocumentPresetCardProps {
  readonly preset: PresetItem;
  readonly isSelected: boolean;
  readonly onSelect: (preset: PresetItem) => void;
  readonly onDoubleClick: (preset: PresetItem) => void;
}

export function NewDocumentPresetCard({
  preset,
  isSelected,
  onSelect,
  onDoubleClick,
}: NewDocumentPresetCardProps): ReactElement {
  const maxDim = Math.max(preset.width, preset.height, 1);
  const thumbW = Math.max(14, Math.round(36 * (preset.width / maxDim)));
  const thumbH = Math.max(14, Math.round(36 * (preset.height / maxDim)));

  const shownUnit = preset.defaultUnit ?? (preset.resolution >= 300 ? 'in' : 'px');
  const formattedDim =
    shownUnit === 'px'
      ? `${preset.width} × ${preset.height} px`
      : `${pxToUnit(preset.width, shownUnit, preset.resolution)} × ${pxToUnit(
          preset.height,
          shownUnit,
          preset.resolution,
        )} ${shownUnit}`;

  return (
    <button
      type="button"
      className={[styles.presetCard, isSelected ? styles.presetCardActive : '']
        .filter(Boolean)
        .join(' ')}
      onClick={() => onSelect(preset)}
      onDoubleClick={() => onDoubleClick(preset)}
      title={`${preset.name} (${preset.width} × ${preset.height} px)`}
    >
      <div className={styles.thumbnailContainer}>
        <div
          className={styles.thumbnailPage}
          style={{ width: `${thumbW / 16}rem`, height: `${thumbH / 16}rem` }}
        />
      </div>
      <div className={styles.presetTitle}>{preset.name}</div>
      <div className={styles.presetSubtitle}>
        {formattedDim} @ {preset.resolution} ppi
      </div>
    </button>
  );
}
