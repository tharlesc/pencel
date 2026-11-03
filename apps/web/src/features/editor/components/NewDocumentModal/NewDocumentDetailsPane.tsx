import type { RefObject, ReactElement } from 'react';
import { Icon } from '../../../../components/ui/index.js';
import { DOCUMENT_UNITS, type UnitId } from '../../model/newDocumentModel.js';
import styles from './NewDocumentModal.module.css';
import { NewDocumentColorSection } from './NewDocumentColorSection.js';
import { NewDocumentSavePresetSection } from './NewDocumentSavePresetSection.js';

export interface NewDocumentDetailsPaneProps {
  readonly docName: string;
  readonly setDocName: (name: string) => void;
  readonly nameInputRef: RefObject<HTMLInputElement | null>;
  readonly widthText: string;
  readonly setWidthText: (w: string) => void;
  readonly commitWidth: () => void;
  readonly heightText: string;
  readonly setHeightText: (h: string) => void;
  readonly commitHeight: () => void;
  readonly unit: UnitId;
  readonly onUnitChange: (unit: UnitId) => void;
  readonly orientation: 'portrait' | 'landscape';
  readonly onSetOrientation: (orient: 'portrait' | 'landscape') => void;
  readonly artboard: boolean;
  readonly setArtboard: (v: boolean) => void;
  readonly resolution: number;
  readonly resUnit: 'in' | 'cm';
  readonly setResUnit: (ru: 'in' | 'cm') => void;
  readonly onResolutionChange: (res: number) => void;
  readonly colorMode: string;
  readonly setColorMode: (mode: string) => void;
  readonly bitDepth: number;
  readonly setBitDepth: (depth: number) => void;
  readonly backgroundType: string;
  readonly setBackgroundType: (bg: string) => void;
  readonly customBgColor: string;
  readonly setCustomBgColor: (color: string) => void;
  readonly colorInputRef: RefObject<HTMLInputElement | null>;
  readonly isSavingPreset: boolean;
  readonly setIsSavingPreset: (v: boolean) => void;
  readonly newPresetName: string;
  readonly setNewPresetName: (n: string) => void;
  readonly presetSaveError: string | null;
  readonly setPresetSaveError: (err: string | null) => void;
  readonly onSavePreset: () => void;
  readonly widthPx: number;
  readonly heightPx: number;
}

export function NewDocumentDetailsPane(props: NewDocumentDetailsPaneProps): ReactElement {
  const {
    docName,
    setDocName,
    nameInputRef,
    widthText,
    setWidthText,
    commitWidth,
    heightText,
    setHeightText,
    commitHeight,
    unit,
    onUnitChange,
    orientation,
    onSetOrientation,
    artboard,
    setArtboard,
    resolution,
    resUnit,
    setResUnit,
    onResolutionChange,
    colorMode,
    setColorMode,
    bitDepth,
    setBitDepth,
    backgroundType,
    setBackgroundType,
    customBgColor,
    setCustomBgColor,
    colorInputRef,
    isSavingPreset,
    setIsSavingPreset,
    newPresetName,
    setNewPresetName,
    presetSaveError,
    setPresetSaveError,
    onSavePreset,
    widthPx,
    heightPx,
  } = props;

  return (
    <div className={styles.detailsColumn}>
      <h3 className={styles.sectionHeader}>DETALHES DA PREDEFINIÇÃO</h3>

      {/* Document Name */}
      <div className={styles.formField}>
        <label htmlFor="newdoc-name" className={styles.fieldLabel}>
          Nome
        </label>
        <input
          ref={nameInputRef}
          id="newdoc-name"
          type="text"
          className={styles.textInput}
          value={docName}
          onChange={(e) => setDocName(e.target.value)}
          aria-label="Nome do documento"
        />
      </div>

      {/* Width & Unit */}
      <div className={styles.splitRow}>
        <div className={styles.formField}>
          <label htmlFor="newdoc-width" className={styles.fieldLabel}>
            Largura
          </label>
          <input
            id="newdoc-width"
            type="text"
            inputMode="text"
            className={styles.textInput}
            value={widthText}
            onChange={(e) => setWidthText(e.target.value)}
            onBlur={commitWidth}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitWidth();
            }}
            aria-label="Largura"
          />
        </div>

        <div className={styles.formField}>
          <label htmlFor="newdoc-unit" className={styles.fieldLabel}>
            Unidades
          </label>
          <select
            id="newdoc-unit"
            className={styles.selectInput}
            value={unit}
            onChange={(e) => onUnitChange(e.target.value as UnitId)}
            aria-label="Unidade de medida"
          >
            {DOCUMENT_UNITS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Height & Orientation */}
      <div className={styles.splitRow}>
        <div className={styles.formField}>
          <label htmlFor="newdoc-height" className={styles.fieldLabel}>
            Altura
          </label>
          <input
            id="newdoc-height"
            type="text"
            inputMode="text"
            className={styles.textInput}
            value={heightText}
            onChange={(e) => setHeightText(e.target.value)}
            onBlur={commitHeight}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitHeight();
            }}
            aria-label="Altura"
          />
        </div>

        <div className={styles.formField}>
          <span className={styles.fieldLabel}>Orientação</span>
          <div className={styles.orientationGroup} role="group" aria-label="Orientação">
            <button
              type="button"
              className={[
                styles.orientationBtn,
                orientation === 'portrait' ? styles.orientationBtnActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSetOrientation('portrait')}
              title="Retrato"
              aria-label="Orientação Retrato"
            >
              <Icon name="orientationPortrait" size="sm" />
            </button>
            <button
              type="button"
              className={[
                styles.orientationBtn,
                orientation === 'landscape' ? styles.orientationBtnActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSetOrientation('landscape')}
              title="Paisagem"
              aria-label="Orientação Paisagem"
            >
              <Icon name="orientationLandscape" size="sm" />
            </button>
          </div>
        </div>
      </div>

      {/* Artboard Checkbox */}
      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={artboard}
          onChange={(e) => setArtboard(e.target.checked)}
          className={styles.checkboxInput}
        />
        <span className={styles.checkboxLabel}>Pranchetas (Artboards)</span>
      </label>

      {/* Resolution & ResUnit */}
      <div className={styles.splitRow}>
        <div className={styles.formField}>
          <label htmlFor="newdoc-res" className={styles.fieldLabel}>
            Resolução
          </label>
          <input
            id="newdoc-res"
            type="number"
            min="1"
            max="30000"
            className={styles.textInput}
            value={resUnit === 'cm' ? Math.round(resolution / 2.54) : resolution}
            onChange={(e) => {
              const parsed = parseFloat(e.target.value) || 72;
              onResolutionChange(resUnit === 'cm' ? parsed * 2.54 : parsed);
            }}
            aria-label="Resolução"
          />
        </div>

        <div className={styles.formField}>
          <label htmlFor="newdoc-resunit" className={styles.fieldLabel}>
            Unidade Resolução
          </label>
          <select
            id="newdoc-resunit"
            className={styles.selectInput}
            value={resUnit}
            onChange={(e) => setResUnit(e.target.value as 'in' | 'cm')}
            aria-label="Unidade da Resolução"
          >
            <option value="in">Pixels/Polegada</option>
            <option value="cm">Pixels/Centímetro</option>
          </select>
        </div>
      </div>

      {/* Color Mode & Background */}
      <NewDocumentColorSection
        colorMode={colorMode}
        setColorMode={setColorMode}
        bitDepth={bitDepth}
        setBitDepth={setBitDepth}
        backgroundType={backgroundType}
        setBackgroundType={setBackgroundType}
        customBgColor={customBgColor}
        setCustomBgColor={setCustomBgColor}
        colorInputRef={colorInputRef}
      />

      {/* Save Preset Section */}
      <NewDocumentSavePresetSection
        isSavingPreset={isSavingPreset}
        setIsSavingPreset={setIsSavingPreset}
        newPresetName={newPresetName}
        setNewPresetName={setNewPresetName}
        presetSaveError={presetSaveError}
        setPresetSaveError={setPresetSaveError}
        onSavePreset={onSavePreset}
        docName={docName}
        widthPx={widthPx}
        heightPx={heightPx}
      />
    </div>
  );
}
