import type { ChangeEvent, ReactElement, RefObject } from 'react';
import styles from './NewDocumentModal.module.css';

export interface NewDocumentColorSectionProps {
  readonly colorMode: string;
  readonly setColorMode: (mode: string) => void;
  readonly bitDepth: number;
  readonly setBitDepth: (depth: number) => void;
  readonly backgroundType: string;
  readonly setBackgroundType: (bg: string) => void;
  readonly customBgColor: string;
  readonly setCustomBgColor: (color: string) => void;
  readonly colorInputRef: RefObject<HTMLInputElement | null>;
}

export function NewDocumentColorSection({
  colorMode,
  setColorMode,
  bitDepth,
  setBitDepth,
  backgroundType,
  setBackgroundType,
  customBgColor,
  setCustomBgColor,
  colorInputRef,
}: NewDocumentColorSectionProps): ReactElement {
  return (
    <>
      {/* Color Mode & Bit Depth */}
      <div className={styles.splitRow}>
        <div className={styles.formField}>
          <label htmlFor="newdoc-mode" className={styles.fieldLabel}>
            Modo de Cor
          </label>
          <select
            id="newdoc-mode"
            className={styles.selectInput}
            value={colorMode}
            onChange={(e) => setColorMode(e.target.value)}
            aria-label="Modo de Cor"
          >
            <option value="rgb">Cores RGB</option>
            <option value="gray">Tons de Cinza</option>
            <option value="cmyk">Cores CMYK</option>
            <option value="lab">Cores Lab</option>
          </select>
        </div>

        <div className={styles.formField}>
          <label htmlFor="newdoc-depth" className={styles.fieldLabel}>
            Profundidade
          </label>
          <select
            id="newdoc-depth"
            className={styles.selectInput}
            value={bitDepth}
            onChange={(e) => setBitDepth(parseInt(e.target.value, 10))}
            aria-label="Profundidade de Bits"
          >
            <option value={8}>8 bit</option>
            <option value={16}>16 bit</option>
            <option value={32}>32 bit</option>
          </select>
        </div>
      </div>

      {/* Background Contents */}
      <div className={styles.formField}>
        <label htmlFor="newdoc-bg" className={styles.fieldLabel}>
          Conteúdo do Plano de Fundo
        </label>
        <div className={styles.backgroundRow}>
          <select
            id="newdoc-bg"
            className={styles.selectInput}
            value={backgroundType}
            onChange={(e) => setBackgroundType(e.target.value)}
            aria-label="Conteúdo do Plano de Fundo"
          >
            <option value="white">Branco</option>
            <option value="black">Preto</option>
            <option value="transparent">Transparente</option>
            <option value="custom">Personalizado...</option>
          </select>

          <div className={styles.colorSwatchWrapper}>
            <button
              type="button"
              aria-label="Escolher cor personalizada de fundo"
              className={[
                styles.colorSwatch,
                backgroundType === 'transparent' ? styles.transparentPattern : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                backgroundColor:
                  backgroundType === 'white'
                    ? 'var(--color-surface-base)'
                    : backgroundType === 'black'
                      ? 'var(--color-border-strong)'
                      : backgroundType === 'custom'
                        ? customBgColor
                        : 'transparent',
              }}
              onClick={() => colorInputRef.current?.click()}
            />
            <input
              ref={colorInputRef}
              type="color"
              className={styles.hiddenColorInput}
              value={customBgColor}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setCustomBgColor(e.target.value);
                setBackgroundType('custom');
              }}
              aria-label="Seletor de cor hexadecimal"
            />
          </div>
        </div>
      </div>
    </>
  );
}
