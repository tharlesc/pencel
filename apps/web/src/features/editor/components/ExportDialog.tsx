import type { Dimensions } from '@pencel/shared-types';
import { useState, type ReactElement } from 'react';
import { Button, Dialog } from '../../../components/ui/index.js';
import { useOptionalEditorEngine, useOptionalEditorSession } from '../state/EditorProvider.js';
import styles from './ExportDialog.module.css';

export interface ExportDialogProps {
  readonly open?: boolean;
  readonly onClose?: () => void;
  readonly dimensions?: Dimensions;
  readonly documentTitle?: string;
  readonly onExportImage?: (format: 'png' | 'jpeg') => string;
  readonly serializedJson?: string;
}

export type ExportFormat = 'png' | 'jpeg' | 'json';

export function ExportDialog(props: ExportDialogProps): ReactElement | null {
  const session = useOptionalEditorSession();
  const engine = useOptionalEditorEngine();

  const open = props.open ?? session?.isExportDialogOpen ?? false;
  const onClose = props.onClose ?? session?.closeExportDialog ?? (() => {});
  const dimensions = props.dimensions ??
    session?.activePage.dimensions ?? { width: 1080, height: 1080 };
  const documentTitle = props.documentTitle ?? session?.document.title ?? 'design';
  const onExportImage = props.onExportImage ?? engine?.exportImage ?? (() => '');
  const serializedJson = props.serializedJson ?? session?.serializedPreview ?? '{}';

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('png');
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = (): void => {
    setIsExporting(true);
    try {
      const sanitizedTitle = (documentTitle || 'design')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      if (selectedFormat === 'json') {
        const blob = new Blob([serializedJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sanitizedTitle}.pencel.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const dataUrl = onExportImage(selectedFormat);
        if (dataUrl) {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `${sanitizedTitle}.${selectedFormat}`;
          a.click();
        }
      }
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      title="Baixar seu Design"
      description="Exporte sua arte em alta resolução para publicar nas redes sociais ou arquivar o projeto."
      onClose={onClose}
    >
      <div className={styles.container}>
        <div className={styles.formatSelectGroup}>
          <span className={styles.label}>Tipo de Arquivo</span>

          <div className={styles.optionsList}>
            <label
              className={[
                styles.optionCard,
                selectedFormat === 'png' ? styles.optionCardActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <input
                type="radio"
                name="exportFormat"
                value="png"
                checked={selectedFormat === 'png'}
                onChange={() => setSelectedFormat('png')}
                className={styles.radioInput}
              />
              <div className={styles.optionContent}>
                <div className={styles.optionHeader}>
                  <span className={styles.formatName}>PNG (Recomendado)</span>
                  <span className={styles.tag}>Alta Qualidade</span>
                </div>
                <span className={styles.formatDesc}>
                  Ideal para posts de Instagram, banners e imagens complexas com texto nítido.
                </span>
              </div>
            </label>

            <label
              className={[
                styles.optionCard,
                selectedFormat === 'jpeg' ? styles.optionCardActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <input
                type="radio"
                name="exportFormat"
                value="jpeg"
                checked={selectedFormat === 'jpeg'}
                onChange={() => setSelectedFormat('jpeg')}
                className={styles.radioInput}
              />
              <div className={styles.optionContent}>
                <div className={styles.optionHeader}>
                  <span className={styles.formatName}>JPEG</span>
                  <span className={styles.tagNeutral}>Arquivo Menor</span>
                </div>
                <span className={styles.formatDesc}>
                  Compacto e rápido para envio por mensagens e compartilhamento rápido.
                </span>
              </div>
            </label>

            <label
              className={[
                styles.optionCard,
                selectedFormat === 'json' ? styles.optionCardActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <input
                type="radio"
                name="exportFormat"
                value="json"
                checked={selectedFormat === 'json'}
                onChange={() => setSelectedFormat('json')}
                className={styles.radioInput}
              />
              <div className={styles.optionContent}>
                <div className={styles.optionHeader}>
                  <span className={styles.formatName}>Pencel Document (JSON)</span>
                  <span className={styles.tagNeutral}>Editável</span>
                </div>
                <span className={styles.formatDesc}>
                  Salva todo o documento, páginas e camadas para continuar editando depois.
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className={styles.metaRow}>
          <span>Tamanho da imagem de saída:</span>
          <strong>
            {dimensions.width} × {dimensions.height} px
          </strong>
        </div>

        <div className={styles.footerActions}>
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            icon="export"
            disabled={isExporting}
            onClick={handleDownload}
          >
            {isExporting ? 'Exportando...' : `Baixar (${selectedFormat.toUpperCase()})`}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
