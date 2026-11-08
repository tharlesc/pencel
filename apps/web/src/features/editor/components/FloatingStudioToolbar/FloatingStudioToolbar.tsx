import type { ReactElement } from 'react';
import { Icon } from '../../../../components/ui/index.js';
import styles from './FloatingStudioToolbar.module.css';

export interface FloatingStudioToolbarProps {
  readonly orientation?: 'horizontal' | 'vertical';
  readonly currentToolMode?: 'select' | 'directSelect' | 'pen' | 'brush' | 'eraser';
  readonly currentDrawingTool?: 'none' | 'brush' | 'eraser';
  readonly onSetToolMode?: (mode: 'select' | 'directSelect' | 'pen' | 'brush' | 'eraser') => void;
  readonly onSetDrawingMode?: (enabled: boolean, mode?: 'brush' | 'eraser') => void;
  readonly onCombineSelected?: () => void;
  readonly onAddShape?: (variant: 'rectangle') => void;
  readonly onToggleArtboardDrawer?: () => void;
  readonly onZoomIn?: () => void;
  readonly onReset?: () => void;
  readonly showRulers?: boolean;
  readonly onToggleRulers?: () => void;
  readonly showGuides?: boolean;
  readonly onToggleGuides?: () => void;
  readonly onOpenGuideLayout?: () => void;
  readonly hasSelection?: boolean;
  readonly onDeleteSelected?: () => void;
}

export function FloatingStudioToolbar({
  orientation = 'horizontal',
  currentToolMode = 'select',
  currentDrawingTool = 'none',
  onSetToolMode,
  onSetDrawingMode,
  onCombineSelected,
  onAddShape,
  onToggleArtboardDrawer,
  onZoomIn,
  onReset,
  showRulers = true,
  onToggleRulers,
  showGuides: _showGuides = true,
  onToggleGuides: _onToggleGuides,
  onOpenGuideLayout,
  hasSelection = false,
  onDeleteSelected,
}: FloatingStudioToolbarProps): ReactElement {
  const effectiveTool =
    currentToolMode !== 'select'
      ? currentToolMode
      : currentDrawingTool !== 'none'
        ? currentDrawingTool
        : 'select';

  return (
    <nav
      className={[
        styles.floatingToolbar,
        orientation === 'vertical' ? styles.floatingToolbarVertical : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Ferramentas principais do estúdio"
      data-testid="floating-studio-toolbar"
    >
      <button
        type="button"
        className={[styles.toolButton, effectiveTool === 'select' ? styles.toolButtonActive : '']
          .filter(Boolean)
          .join(' ')}
        onClick={() => {
          onSetToolMode?.('select');
        }}
        aria-label="Ferramenta Seleção (V)"
        aria-pressed={effectiveTool === 'select'}
        title="Seleção / Mover (V)"
      >
        <Icon name="select" size="md" tone={effectiveTool === 'select' ? 'default' : 'default'} />
      </button>

      <button
        type="button"
        className={[
          styles.toolButton,
          effectiveTool === 'directSelect' ? styles.toolButtonActive : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => {
          onSetToolMode?.('directSelect');
        }}
        aria-label="Seleção Direta de Âncoras (A)"
        aria-pressed={effectiveTool === 'directSelect'}
        title="Seleção Direta de Âncoras e Nós (A)"
      >
        <Icon
          name="directSelect"
          size="md"
          tone={effectiveTool === 'directSelect' ? 'default' : 'default'}
        />
      </button>

      <button
        type="button"
        className={[styles.toolButton, effectiveTool === 'pen' ? styles.toolButtonActive : '']
          .filter(Boolean)
          .join(' ')}
        onClick={() => {
          onSetToolMode?.('pen');
        }}
        aria-label="Caneta Bézier Vetorial (P)"
        aria-pressed={effectiveTool === 'pen'}
        title="Caneta Bézier Vetorial (P)"
      >
        <Icon name="penTool" size="md" tone={effectiveTool === 'pen' ? 'default' : 'default'} />
      </button>

      <button
        type="button"
        className={[styles.toolButton, effectiveTool === 'brush' ? styles.toolButtonActive : '']
          .filter(Boolean)
          .join(' ')}
        onClick={() => {
          onSetToolMode?.('brush');
          onSetDrawingMode?.(true, 'brush');
        }}
        aria-label="Pincel Livre (B)"
        aria-pressed={effectiveTool === 'brush'}
        title="Pincel Livre (B)"
      >
        <Icon name="brush" size="md" tone={effectiveTool === 'brush' ? 'default' : 'default'} />
      </button>

      <button
        type="button"
        className={[styles.toolButton, effectiveTool === 'eraser' ? styles.toolButtonActive : '']
          .filter(Boolean)
          .join(' ')}
        onClick={() => {
          onSetToolMode?.('eraser');
          onSetDrawingMode?.(true, 'eraser');
        }}
        aria-label="Borracha (E)"
        aria-pressed={effectiveTool === 'eraser'}
        title="Borracha (E)"
      >
        <Icon name="eraser" size="md" tone={effectiveTool === 'eraser' ? 'default' : 'default'} />
      </button>

      {onCombineSelected && (
        <button
          type="button"
          className={styles.toolButton}
          onClick={onCombineSelected}
          aria-label="Construtor de Formas (Shift+M)"
          title="Construtor de Formas / Unir Seleção (Shift+M)"
        >
          <Icon name="shapeBuilder" size="md" />
        </button>
      )}

      {onAddShape && (
        <button
          type="button"
          className={styles.toolButton}
          onClick={() => onAddShape('rectangle')}
          aria-label="Adicionar Retângulo (R)"
          title="Adicionar Forma Retangular (R)"
        >
          <Icon name="square" size="md" />
        </button>
      )}

      {onToggleArtboardDrawer && (
        <button
          type="button"
          className={styles.toolButton}
          onClick={onToggleArtboardDrawer}
          aria-label="Miniaturas de Pranchetas"
          title="Miniaturas & Páginas da Prancheta"
        >
          <Icon name="artboard" size="md" />
        </button>
      )}

      {onZoomIn && (
        <button
          type="button"
          className={styles.toolButton}
          onClick={onZoomIn}
          aria-label="Aumentar Zoom"
          title="Aumentar Zoom (+)"
        >
          <Icon name="search" size="md" />
        </button>
      )}

      <div
        className={orientation === 'vertical' ? styles.dividerVertical : styles.divider}
        aria-hidden="true"
      />

      {onReset && (
        <button
          type="button"
          className={styles.toolButton}
          onClick={onReset}
          aria-label="Centralizar e Ajustar Tela"
          title="Centralizar e Ajustar Tela"
        >
          <Icon name="fitScreen" size="md" />
        </button>
      )}

      {onToggleRulers && (
        <button
          type="button"
          className={[styles.toolButton, showRulers ? styles.toolButtonActive : '']
            .filter(Boolean)
            .join(' ')}
          onClick={onToggleRulers}
          aria-label="Alternar Réguas (Ctrl+R)"
          aria-pressed={showRulers}
          title={`Réguas: ${showRulers ? 'Visíveis' : 'Ocultas'} (Ctrl+R / ⌘R)`}
        >
          <Icon name="ruler" size="md" />
        </button>
      )}

      {onOpenGuideLayout && (
        <button
          type="button"
          className={styles.toolButton}
          onClick={onOpenGuideLayout}
          aria-label="Novo Layout de Guia..."
          title="Novo Layout de Guia & Fatias (Estúdio)"
        >
          <Icon name="grid" size="md" />
        </button>
      )}

      {onDeleteSelected && (
        <button
          type="button"
          className={[styles.toolButton, !hasSelection ? styles.toolButtonDisabled : '']
            .filter(Boolean)
            .join(' ')}
          disabled={!hasSelection}
          onClick={onDeleteSelected}
          aria-label="Remover Seleção (Delete)"
          title="Remover Elemento Selecionado (Del)"
        >
          <Icon name="trash" size="md" />
        </button>
      )}
    </nav>
  );
}
