import type { Dimensions } from '@pencel/shared-types';
import type { KeyboardEvent, ReactElement } from 'react';
import { Button, Dialog } from '../../../../components/ui/index.js';
import { useNewDocumentModal } from '../../hooks/useNewDocumentModal.js';
import { NEW_DOCUMENT_CATEGORIES } from '../../model/newDocumentModel.js';
import styles from './NewDocumentModal.module.css';
import { NewDocumentDetailsPane } from './NewDocumentDetailsPane.js';
import { NewDocumentPresetCard } from './NewDocumentPresetCard.js';
import { NewDocumentSavedList } from './NewDocumentSavedList.js';

export interface NewDocumentModalProps {
  readonly isOpen?: boolean;
  readonly onClose?: () => void;
  readonly onCreateDocument?: (options: {
    readonly title: string;
    readonly dimensions: Dimensions;
    readonly resolution: number;
    readonly backgroundColor: string;
    readonly colorMode: string;
  }) => void;
}

export function NewDocumentModal(props: NewDocumentModalProps): ReactElement | null {
  const modal = useNewDocumentModal(props);

  if (!modal.isOpen) return null;

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter' && !modal.isSavingPreset) {
      e.preventDefault();
      modal.handleConfirmCreate();
    }
  };

  return (
    <Dialog
      open={modal.isOpen}
      onClose={modal.onClose}
      size="xl"
      title="Novo Documento"
      description="Selecione uma predefinição de tela em branco ou configure dimensões personalizadas."
    >
      <div className={styles.dialogContainer} onKeyDown={handleKeyDown}>
        {/* Category Tabs */}
        <div className={styles.categoryTabs} role="tablist" aria-label="Categorias de documento">
          {NEW_DOCUMENT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={modal.activeCategory === cat.id}
              className={[
                styles.categoryTab,
                modal.activeCategory === cat.id ? styles.categoryTabActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => modal.setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Main Content: Two Columns */}
        <div className={styles.columnsWrapper}>
          {/* Left Column: Preset Cards Grid / Saved List */}
          <div className={styles.presetsColumn}>
            <h3 className={styles.sectionHeader}>
              {modal.activeCategory === 'saved'
                ? `PREDEFINIÇÕES SALVAS (${modal.savedPresets.length})`
                : `PREDEFINIÇÕES DE DOCUMENTO EM BRANCO (${modal.displayedPresets.length})`}
            </h3>

            <div className={styles.presetsScrollArea}>
              {modal.activeCategory === 'saved' ? (
                <NewDocumentSavedList
                  savedPresets={modal.savedPresets}
                  selectedPresetName={modal.selectedPresetName}
                  onSelectPreset={modal.handleSelectPreset}
                  onDoubleClickPreset={modal.handlePresetDoubleClick}
                  onDeleteSavedPreset={modal.handleDeleteSavedPreset}
                />
              ) : (
                <div className={styles.presetsGrid}>
                  {modal.displayedPresets.map((preset) => (
                    <NewDocumentPresetCard
                      key={preset.name}
                      preset={preset}
                      isSelected={modal.selectedPresetName === preset.name}
                      onSelect={modal.handleSelectPreset}
                      onDoubleClick={modal.handlePresetDoubleClick}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Preset Details */}
          <NewDocumentDetailsPane
            docName={modal.docName}
            setDocName={modal.setDocName}
            nameInputRef={modal.nameInputRef}
            widthText={modal.widthText}
            setWidthText={modal.setWidthText}
            commitWidth={modal.commitWidth}
            heightText={modal.heightText}
            setHeightText={modal.setHeightText}
            commitHeight={modal.commitHeight}
            unit={modal.unit}
            onUnitChange={modal.handleUnitChange}
            orientation={modal.orientation}
            onSetOrientation={modal.handleSetOrientation}
            artboard={modal.artboard}
            setArtboard={modal.setArtboard}
            resolution={modal.resolution}
            resUnit={modal.resUnit}
            setResUnit={modal.setResUnit}
            onResolutionChange={modal.handleResolutionChange}
            colorMode={modal.colorMode}
            setColorMode={modal.setColorMode}
            bitDepth={modal.bitDepth}
            setBitDepth={modal.setBitDepth}
            backgroundType={modal.backgroundType}
            setBackgroundType={modal.setBackgroundType}
            customBgColor={modal.customBgColor}
            setCustomBgColor={modal.setCustomBgColor}
            colorInputRef={modal.colorInputRef}
            isSavingPreset={modal.isSavingPreset}
            setIsSavingPreset={modal.setIsSavingPreset}
            newPresetName={modal.newPresetName}
            setNewPresetName={modal.setNewPresetName}
            presetSaveError={modal.presetSaveError}
            setPresetSaveError={modal.setPresetSaveError}
            onSavePreset={modal.handleSavePreset}
            widthPx={modal.widthPx}
            heightPx={modal.heightPx}
          />
        </div>

        {/* Dialog Footer */}
        <div className={styles.dialogFooter}>
          <Button variant="secondary" size="md" onClick={modal.onClose}>
            Fechar
          </Button>
          <Button variant="primary" size="md" onClick={modal.handleConfirmCreate}>
            Criar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
