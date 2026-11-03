import { useRef, type ChangeEvent, type ReactElement } from 'react';
import { useTheme } from '../../../../app/providers/ThemeProvider.js';
import { BrandLogo, Icon, Tooltip } from '../../../../components/ui/index.js';
import { useI18n } from '../../../../shared/i18n/index.js';
import { renderPdfFileToDataUrl } from '../../services/pdfService.js';
import { useOptionalEditorEngine, useOptionalEditorSession } from '../../state/EditorProvider.js';
import styles from './TopToolbar.module.css';

export interface TopToolbarProps {
  readonly documentTitle?: string;
  readonly onTitleChange?: (title: string) => void;
  readonly canUndo?: boolean;
  readonly canRedo?: boolean;
  readonly onUndo?: () => void;
  readonly onRedo?: () => void;
  readonly theme?: 'light' | 'dark';
  readonly onToggleTheme?: () => void;
  readonly onOpenSchemaDialog?: () => void;
  readonly onOpenExportDialog?: () => void;
  readonly onOpenNewDocumentModal?: () => void;
  readonly isSidebarOpen?: boolean;
  readonly onToggleSidebar?: () => void;
  readonly presetId?: string;
  readonly dimensions?: { width: number; height: number };
}

export function TopToolbar(props: TopToolbarProps): ReactElement {
  const { t } = useI18n();
  const themeCtx = useTheme();
  const session = useOptionalEditorSession();
  const engine = useOptionalEditorEngine();

  const documentTitle =
    props.documentTitle ?? session?.document.title ?? t('topbar.titlePlaceholder');
  const onTitleChange = props.onTitleChange ?? session?.setDocumentTitle ?? (() => {});
  const canUndo = props.canUndo ?? engine?.canUndo ?? false;
  const canRedo = props.canRedo ?? engine?.canRedo ?? false;
  const onUndo =
    props.onUndo ??
    (() => {
      void engine?.undo();
    });
  const onRedo =
    props.onRedo ??
    (() => {
      void engine?.redo();
    });
  const theme = props.theme ?? themeCtx.theme;
  const onToggleTheme = props.onToggleTheme ?? themeCtx.toggleTheme;
  const onOpenSchemaDialog = props.onOpenSchemaDialog ?? session?.openSchemaDialog ?? (() => {});
  const onOpenExportDialog = props.onOpenExportDialog ?? session?.openExportDialog ?? (() => {});
  const onOpenNewDocumentModal =
    props.onOpenNewDocumentModal ?? session?.openNewDocumentModal ?? (() => {});
  const isSidebarOpen = props.isSidebarOpen ?? session?.isDrawerOpen ?? true;
  const onToggleSidebar = props.onToggleSidebar ?? session?.toggleDrawer;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenFile = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const reader = new FileReader();

    if (lowerName.endsWith('.json') || lowerName.endsWith('.pencel')) {
      reader.onload = () => {
        const text = reader.result as string;
        if (text && engine) {
          void engine.loadDesignJson(text);
        }
      };
      reader.readAsText(file);
    } else if (lowerName.endsWith('.svg')) {
      reader.onload = () => {
        const text = reader.result as string;
        if (text && engine) {
          void engine.addImageFromUrl(
            `data:image/svg+xml;utf8,${encodeURIComponent(text)}`,
            file.name,
          );
        }
      };
      reader.readAsText(file);
    } else if (lowerName.endsWith('.pdf') || lowerName.endsWith('.ai')) {
      void (async () => {
        const dataUrl = await renderPdfFileToDataUrl(file);
        if (dataUrl && engine) {
          void engine.addImageFromUrl(dataUrl, file.name);
        }
      })();
    } else {
      reader.onload = () => {
        const dataUrl = reader.result as string;
        if (dataUrl && engine) {
          void engine.addImageFromUrl(dataUrl, file.name);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  return (
    <header className={styles.bar}>
      <div className={styles.leading}>
        <div className={styles.brandLockup}>
          <BrandLogo variant="lockup" size="sm" label="pencel" />
        </div>

        {onToggleSidebar ? (
          <Tooltip content={t('topbar.toggleSidebar')} shortcut="Ctrl + S" placement="bottom">
            <button
              type="button"
              onClick={onToggleSidebar}
              className={[styles.toolbarBtn, isSidebarOpen ? styles.toolbarBtnActive : '']
                .filter(Boolean)
                .join(' ')}
              aria-label={t('topbar.toggleSidebar')}
            >
              <Icon name="panelLeft" size="sm" />
            </button>
          </Tooltip>
        ) : null}

        <div className={styles.segmentedGroup} role="group" aria-label="Histórico de alterações">
          <Tooltip content={t('common.undo')} shortcut="Ctrl + Z" placement="bottom">
            <button
              type="button"
              disabled={!canUndo}
              onClick={onUndo}
              className={styles.segmentedBtn}
              aria-label={t('common.undo')}
            >
              <Icon name="undo" size="xs" />
            </button>
          </Tooltip>
          <span className={styles.segmentedDivider} aria-hidden="true" />
          <Tooltip content={t('common.redo')} shortcut="Ctrl + Y" placement="bottom">
            <button
              type="button"
              disabled={!canRedo}
              onClick={onRedo}
              className={styles.segmentedBtn}
              aria-label={t('common.redo')}
            >
              <Icon name="redo" size="xs" />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className={styles.center}>
        <div className={styles.documentProxy}>
          <div className={styles.proxyContent}>
            <label className={styles.titleLabel}>
              <span className={styles.srOnly}>Nome do documento</span>
              <input
                type="text"
                className={styles.titleInput}
                value={documentTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                aria-label="Nome do documento"
                placeholder={t('topbar.titlePlaceholder')}
              />
            </label>
          </div>
        </div>
      </div>

      <div className={styles.trailing}>
        <Tooltip content={t('topbar.newDoc')} shortcut="Ctrl + N" placement="bottom">
          <button
            type="button"
            onClick={onOpenNewDocumentModal}
            className={styles.secondaryToolBtn}
            aria-label="Novo documento ou tamanho personalizado"
          >
            <Icon name="filePlus" size="xs" />
            <span>{t('topbar.newDoc')}</span>
          </button>
        </Tooltip>

        <Tooltip content={t('topbar.open')} placement="bottom">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={styles.secondaryToolBtn}
            aria-label={t('topbar.open')}
          >
            <Icon name="upload" size="xs" />
            <span>{t('topbar.open')}</span>
          </button>
        </Tooltip>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pencel,.json,.svg,.png,.jpg,.jpeg,.pdf,.eps,.ai"
          onChange={handleOpenFile}
          style={{ display: 'none' }}
          aria-hidden="true"
        />

        <Tooltip content={t('topbar.jsonSchema')} placement="bottom">
          <button
            type="button"
            onClick={onOpenSchemaDialog}
            className={styles.secondaryToolBtn}
            aria-label={t('topbar.jsonSchema')}
          >
            <Icon name="code" size="xs" />
            <span>{t('topbar.jsonSchema')}</span>
          </button>
        </Tooltip>

        <Tooltip content={t('topbar.themeToggle')} placement="bottom">
          <button
            type="button"
            onClick={onToggleTheme}
            className={styles.toolbarBtn}
            aria-label={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
          >
            <Icon name={theme === 'light' ? 'moon' : 'sun'} size="sm" />
          </button>
        </Tooltip>

        <button
          type="button"
          onClick={onOpenExportDialog}
          className={styles.primaryShareBtn}
          aria-label="Baixar documento"
        >
          <Icon name="share" size="sm" />
          <span>{t('topbar.export')}</span>
        </button>
      </div>
    </header>
  );
}
