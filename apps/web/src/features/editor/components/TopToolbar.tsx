import type { ReactElement } from 'react';
import { BrandLogo, Icon, Tooltip } from '../../../components/ui/index.js';
import styles from './TopToolbar.module.css';

export interface TopToolbarProps {
  readonly documentTitle: string;
  readonly onTitleChange: (title: string) => void;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly onUndo: () => void;
  readonly onRedo: () => void;
  readonly theme: 'light' | 'dark';
  readonly onToggleTheme: () => void;
  readonly onOpenSchemaDialog: () => void;
  readonly onOpenExportDialog: () => void;
  readonly isSidebarOpen?: boolean;
  readonly onToggleSidebar?: () => void;
  readonly presetId?: string;
  readonly dimensions?: { width: number; height: number };
}

export function TopToolbar({
  documentTitle,
  onTitleChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  theme,
  onToggleTheme,
  onOpenSchemaDialog,
  onOpenExportDialog,
  isSidebarOpen = true,
  onToggleSidebar,
  presetId,
  dimensions,
}: TopToolbarProps): ReactElement {
  return (
    <header className={styles.bar}>
      {/* 1. Leading Area: Brand Lockup + Sidebar Toggle + History Segment */}
      <div className={styles.leading}>
        <div className={styles.brandLockup}>
          <BrandLogo variant="lockup" size="sm" label="pencel" />
        </div>

        {onToggleSidebar && (
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
        )}

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

      {/* 2. Center Area: Document Title & Status (No Document Icon & No Border) */}
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
              {presetId && <span className={styles.metaPreset}>{presetId}</span>}
              {presetId && dimensions && (
                <span className={styles.metaDivider} aria-hidden="true">
                  •
                </span>
              )}
              {dimensions && (
                <span className={styles.metaDimensions}>
                  {dimensions.width} × {dimensions.height}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Trailing Area: Action Tools + Theme Switcher + Primary Share Button */}
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
