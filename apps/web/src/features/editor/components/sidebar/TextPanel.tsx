import type { ReactElement } from 'react';
import { Button } from '../../../../components/ui/index.js';
import { useTextPanel, type AddTextOptions } from '../../hooks/useTextPanel.js';
import { useOptionalEditorEngine } from '../../state/EditorProvider.js';
import styles from '../SidebarNav.module.css';

export interface TextPanelProps {
  readonly onAddText?: (options: AddTextOptions) => void;
}

export function TextPanel({ onAddText: propOnAddText }: TextPanelProps): ReactElement {
  const engine = useOptionalEditorEngine();
  const resolvedAddText = propOnAddText ?? engine?.addText ?? (() => {});
  const { addAreaText, addPointText, addHeading, addSubheading, addBodyText, onAddText } =
    useTextPanel(resolvedAddText);

  return (
    <div className={styles.section}>
      <Button
        variant="primary"
        size="md"
        icon="plus"
        className={styles.fullWidthBtn}
        onClick={addAreaText}
      >
        Adicionar uma caixa de texto
      </Button>

      <Button
        variant="secondary"
        size="md"
        icon="text"
        className={styles.fullWidthBtn}
        onClick={addPointText}
      >
        Adicionar texto de ponto (Linha)
      </Button>

      <div className={styles.subSection}>
        <span className={styles.subTitle}>Estilos de Texto Padrão</span>
        <div className={styles.textPresets}>
          <button type="button" className={styles.textPresetHeading} onClick={addHeading}>
            Adicionar um título
          </button>

          <button type="button" className={styles.textPresetSubheading} onClick={addSubheading}>
            Adicionar um subtítulo
          </button>

          <button type="button" className={styles.textPresetBody} onClick={addBodyText}>
            Inserir um pouco de texto
          </button>
        </div>
      </div>

      <div className={styles.subSection}>
        <span className={styles.subTitle}>Combinações de Fontes</span>
        <div className={styles.fontCombosGrid}>
          <button
            type="button"
            className={styles.comboCard}
            onClick={() =>
              onAddText({
                text: 'EDIÇÃO ESPECIAL',
                fontSize: 38,
                fontWeight: 'bold',
                fill: '#DC2626',
              })
            }
          >
            <span className={styles.comboSale}>EDIÇÃO ESPECIAL</span>
          </button>

          <button
            type="button"
            className={styles.comboCard}
            onClick={() =>
              onAddText({
                text: 'Elegante & Moderno',
                fontSize: 34,
                fontFamily: 'Georgia, serif',
                fontWeight: 'normal',
                fill: '#1D1D1F',
              })
            }
          >
            <span className={styles.comboEditorial}>Elegante & Moderno</span>
          </button>

          <button
            type="button"
            className={styles.comboCard}
            onClick={() =>
              onAddText({
                text: 'FLASH SALE',
                fontSize: 42,
                fontFamily: 'Impact, sans-serif',
                fill: '#0066CC',
              })
            }
          >
            <span className={styles.comboBold}>FLASH SALE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
