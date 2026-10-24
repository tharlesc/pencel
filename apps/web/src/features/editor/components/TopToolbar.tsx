import type { ReactElement } from 'react';
import { useTheme } from '../../../app/providers/ThemeProvider.js';
import { BrandLogo, Icon, Tooltip } from '../../../components/ui/index.js';
import { useOptionalEditorEngine, useOptionalEditorSession } from '../state/EditorProvider.js';
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
  readonly isSidebarOpen?: boolean;
  readonly onToggleSidebar?: () => void;
  readonly presetId?: string;
  readonly dimensions?: { width: number; height: number };
}

export function TopToolbar(props: TopToolbarProps): ReactElement {
  const themeCtx = useTheme();
  const session = useOptionalEditorSession();
  const engine = useOptionalEditorEngine();

  const documentTitle = props.documentTitle ?? session?.document.title ?? 'Sem Título';
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
  const isSidebarOpen = props.isSidebarOpen ?? session?.isDrawerOpen ?? true;
  const onToggleSidebar = props.onToggleSidebar ?? session?.toggleDrawer;
  const presetId = props.presetId ?? session?.document.presetId;
  const dimensions = props.dimensions ?? session?.activePage.dimensions;

  return (
    <header className={styles.bar}>
      <div className={styles.leading}>
        <div className={styles.brandLockup}>
          <BrandLogo variant="lockup" size="sm" label="pencel" />
        </div>

        {onToggleSidebar ? (
          <Tooltip
            content={isSidebarOpen ? 'Ocultar Painel Lateral' : 'Mostrar Painel Lateral'}
            shortcut="⌘S"
            placement="bottom"
          >
            <button
              type="button"
              onClick={onToggleSidebar}
              className={[styles.toolbarBtn, isSidebarOpen ? styles.toolbarBtnActive : '']
                .filter(Boolean)
                .join(' ')}
              aria-label={isSidebarOpen ? 'Ocultar barra lateral' : 'Mostrar barra lateral'}
            >
              <Icon name="panelLeft" size="sm" />
            </button>
          </Tooltip>
        ) : null}

        <div className={styles.segmentedGroup} role="group" aria-label="Histórico de alterações">
          <Tooltip content="Desfazer" shortcut="⌘Z" placement="bottom">
            <button
              type="button"
              disabled={!canUndo}
              onClick={onUndo}
              className={styles.segmentedBtn}
              aria-label="Desfazer alteração"
            >
              <Icon name="undo" size="xs" />
            </button>
          </Tooltip>
          <span className={styles.segmentedDivider} aria-hidden="true" />
          <Tooltip content="Refazer" shortcut="⇧⌘Z" placement="bottom">
            <button
              type="button"
              disabled={!canRedo}
              onClick={onRedo}
              className={styles.segmentedBtn}
              aria-label="Refazer alteração"
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
                placeholder="Sem Título"
              />
            </label>

            <div className={styles.documentMeta}>
              {presetId ? <span className={styles.metaPreset}>{presetId}</span> : null}
              {presetId && dimensions ? (
                <span className={styles.metaDivider} aria-hidden="true">
                  •
                </span>
              ) : null}
              {dimensions ? (
                <span className={styles.metaDimensions}>
                  {dimensions.width} × {dimensions.height}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.trailing}>
        <Tooltip content="Inspecionar Modelo JSON do Documento" placement="bottom">
          <button
            type="button"
            onClick={onOpenSchemaDialog}
            className={styles.secondaryToolBtn}
            aria-label="Inspecionar Modelo JSON"
          >
            <Icon name="code" size="xs" />
            <span>JSON</span>
          </button>
        </Tooltip>

        <Tooltip
          content={theme === 'light' ? 'Mudar para Modo Escuro' : 'Mudar para Modo Claro'}
          placement="bottom"
        >
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
          <span>Baixar</span>
        </button>
      </div>
    </header>
  );
}
