import type { ReactElement } from 'react';
import { Button } from '../../../../components/ui/index.js';
import styles from './NewDocumentModal.module.css';

export interface NewDocumentSavePresetSectionProps {
  readonly isSavingPreset: boolean;
  readonly setIsSavingPreset: (v: boolean) => void;
  readonly newPresetName: string;
  readonly setNewPresetName: (n: string) => void;
  readonly presetSaveError: string | null;
  readonly setPresetSaveError: (err: string | null) => void;
  readonly onSavePreset: () => void;
  readonly docName: string;
  readonly widthPx: number;
  readonly heightPx: number;
}

export function NewDocumentSavePresetSection({
  isSavingPreset,
  setIsSavingPreset,
  newPresetName,
  setNewPresetName,
  presetSaveError,
  setPresetSaveError,
  onSavePreset,
  docName,
  widthPx,
  heightPx,
}: NewDocumentSavePresetSectionProps): ReactElement {
  return (
    <div className={styles.savePresetSection}>
      {!isSavingPreset ? (
        <button
          type="button"
          className={styles.savePresetTriggerBtn}
          onClick={() => {
            setIsSavingPreset(true);
            setNewPresetName(`${docName} (${widthPx}x${heightPx})`);
          }}
        >
          Salvar Predefinição...
        </button>
      ) : (
        <div className={styles.savePresetForm}>
          <input
            type="text"
            className={styles.textInput}
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="Nome da predefinição"
            aria-label="Nome da predefinição para salvar"
            autoFocus
          />
          {presetSaveError ? (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-feedback-error)' }}>
              {presetSaveError}
            </span>
          ) : null}
          <div className={styles.savePresetActions}>
            <Button variant="primary" size="sm" onClick={onSavePreset}>
              Salvar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsSavingPreset(false);
                setPresetSaveError(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
