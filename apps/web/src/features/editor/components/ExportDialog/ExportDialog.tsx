import type { Dimensions } from '@pencel/shared-types';
import { useState, type ReactElement } from 'react';
import { Button, Dialog } from '../../../../components/ui/index.js';
import { useOptionalEditorEngine, useOptionalEditorSession } from '../../state/EditorProvider.js';
import styles from './ExportDialog.module.css';

export interface ExportDialogProps {
  readonly open?: boolean;
  readonly onClose?: () => void;
  readonly dimensions?: Dimensions;
  readonly documentTitle?: string;
  readonly onExportImage?: (
    format: 'png' | 'jpeg',
    quality?: number,
    maxDimension?: number,
    scaleFactor?: number,
    transparentBackground?: boolean,
  ) => string;
  readonly serializedJson?: string;
}

export type ExportFormat = 'png' | 'jpeg' | 'svg' | 'pdf' | 'json';

interface FormatOption {
  readonly format: ExportFormat;
  readonly name: string;
  readonly tag: string;
  readonly isAccent?: boolean;
  readonly desc: string;
}

const FORMAT_OPTIONS: readonly FormatOption[] = [
  {
    format: 'png',
    name: 'PNG (Recomendado)',
    tag: 'Alta Qualidade',
    isAccent: true,
    desc: 'Ideal para redes sociais, banners e imagens com texto nítido e fundo transparente.',
  },
  {
    format: 'jpeg',
    name: 'JPEG',
    tag: 'Arquivo Menor',
    desc: 'Compacto e rápido para envio por mensagens e compartilhamento rápido na web.',
  },
  {
    format: 'svg',
    name: 'SVG Vetorial',
    tag: 'Escalável',
    isAccent: true,
    desc: 'Vetor puro escalável sem perda de resolução, pronto para Illustrator, Figma e impressão.',
  },
  {
    format: 'pdf',
    name: 'PDF (Impressão)',
    tag: 'Documento',
    desc: 'Ideal para documentos, portfólios e envio para gráficas e impressoras.',
  },
  {
    format: 'json',
    name: 'Pencel Studio (.pencel / JSON)',
    tag: 'Editável',
    desc: 'Salva todo o documento, páginas e camadas para continuar editando no Pencel depois.',
  },
];

export function ExportDialog(props: ExportDialogProps): ReactElement | null {
  const session = useOptionalEditorSession();
  const engine = useOptionalEditorEngine();

  const open = props.open ?? session?.isExportDialogOpen ?? false;
  const onClose = props.onClose ?? session?.closeExportDialog ?? (() => {});
  const dimensions =
    props.dimensions ?? session?.activePage.dimensions ?? { width: 1080, height: 1080 };
  const documentTitle = props.documentTitle ?? session?.document.title ?? 'design';
  const onExportImage = props.onExportImage ?? engine?.exportImage ?? (() => '');
  const serializedJson = props.serializedJson ?? session?.serializedPreview ?? '{}';

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('png');
  const [scaleFactor, setScaleFactor] = useState<number>(1);
  const [transparentBackground, setTransparentBackground] = useState<boolean>(true);
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
      } else if (selectedFormat === 'svg') {
        const svgData = engine?.exportSvg?.() || '';
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sanitizedTitle}.svg`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (selectedFormat === 'pdf') {
        const dataUrl = onExportImage('png', 0.95, undefined, scaleFactor, transparentBackground);
        if (dataUrl) {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>${sanitizedTitle}.pdf</title>
                  <style>
                    body { margin: 0; display: flex; align-items: center; justify-content: center; background: #fff; }
                    img { max-width: 100%; height: auto; }
                    @page { size: auto; margin: 0; }
                  </style>
                </head>
                <body>
                  <img src="${dataUrl}" onload="window.print();" />
                </body>
              </html>
            `);
            printWindow.document.close();
          }
        }
      } else {
        const dataUrl = onExportImage(
          selectedFormat,
          0.95,
          undefined,
          scaleFactor,
          transparentBackground,
        );
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

  const currentW = Math.round(dimensions.width * scaleFactor);
  const currentH = Math.round(dimensions.height * scaleFactor);

  return (
    <Dialog
      open={open}
      title="Baixar seu Design"
      description="Exporte sua arte em alta resolução para publicar nas redes sociais, impressão ou arquivar o projeto."
      onClose={onClose}
    >
      <div className={styles.container}>
        <div className={styles.formatSelectGroup}>
          <span className={styles.label}>Tipo de Arquivo</span>

          <div className={styles.optionsList}>
            {FORMAT_OPTIONS.map((opt) => (
              <label
                key={opt.format}
                className={[
                  styles.optionCard,
                  selectedFormat === opt.format ? styles.optionCardActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <input
                  type="radio"
                  name="exportFormat"
                  value={opt.format}
                  checked={selectedFormat === opt.format}
                  onChange={() => setSelectedFormat(opt.format)}
                  className={styles.radioInput}
                />
                <div className={styles.optionContent}>
                  <div className={styles.optionHeader}>
                    <span className={styles.formatName}>{opt.name}</span>
                    <span className={opt.isAccent ? styles.tag : styles.tagNeutral}>{opt.tag}</span>
                  </div>
                  <span className={styles.formatDesc}>{opt.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.formatSelectGroup}>
          <span className={styles.label}>Escala / Resolução</span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                type="button"
                className={[styles.optionCard, scaleFactor === s ? styles.optionCardActive : '']
                  .filter(Boolean)
                  .join(' ')}
                style={{
                  padding: 'var(--space-1-5) var(--space-3)',
                  fontSize: 'var(--font-size-xs)',
                }}
                onClick={() => setScaleFactor(s)}
              >
                <strong>{s}x</strong> {s === 1 ? '(Padrão)' : s === 2 ? '(Retina)' : '(Impressão)'}
              </button>
            ))}
          </div>
        </div>

        {(selectedFormat === 'png' || selectedFormat === 'svg') && (
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={transparentBackground}
              onChange={(e) => setTransparentBackground(e.target.checked)}
              className={styles.checkboxInput}
            />
            <div className={styles.checkboxLabelGroup}>
              <span className={styles.checkboxLabel}>Fundo Transparente (Sem Fundo)</span>
              <span className={styles.checkboxHint}>
                Exporta apenas os elementos do design sem a cor sólida da prancheta.
              </span>
            </div>
          </label>
        )}

        <div className={styles.metaRow}>
          <span>Resolução de Saída:</span>
          <strong>
            {currentW} × {currentH} px {scaleFactor > 1 ? `(${scaleFactor}x)` : ''}
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
