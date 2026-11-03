import type { ReactElement } from 'react';
import { Icon } from '../../../../components/ui/Icon/Icon.js';
import type { LayerItem } from '../../engine/FabricCanvasAdapter.js';
import styles from './LayersPanel.module.css';

export interface LayerBottomActionsProps {
  readonly activeLayer: LayerItem | null;
  readonly onToggleLayerMask?: (
    layerName?: string,
    shape?: 'circle' | 'rounded' | 'ellipse',
  ) => void;
  readonly onInvertLayerMask?: (layerName?: string) => void;
  readonly onRemoveLayerMask?: (layerName?: string) => void;
  readonly onAddGroup?: () => void;
  readonly onUngroup?: () => void;
  readonly onAddNewLayer: () => void;
  readonly onDeleteLayer: (name: string) => void;
}

export function LayerBottomActions({
  activeLayer,
  onToggleLayerMask,
  onInvertLayerMask,
  onRemoveLayerMask,
  onAddGroup,
  onUngroup,
  onAddNewLayer,
  onDeleteLayer,
}: LayerBottomActionsProps): ReactElement {
  return (
    <div className={styles.bottomBar} role="toolbar" aria-label="Ações de camadas">
      <button
        type="button"
        className={styles.bottomBtn}
        onClick={() => onToggleLayerMask?.(activeLayer?.name, 'circle')}
        disabled={!activeLayer}
        title={
          activeLayer?.hasMask
            ? 'Ativar/Desativar Máscara de Camada'
            : 'Adicionar Máscara de Camada Não Destrutiva'
        }
        aria-label="Adicionar máscara de camada"
      >
        <Icon name="circle" size="xs" />
      </button>
      <button
        type="button"
        className={styles.bottomBtn}
        onClick={() => onInvertLayerMask?.(activeLayer?.name)}
        disabled={!activeLayer?.hasMask}
        title="Inverter Máscara de Camada"
        aria-label="Inverter máscara de camada"
      >
        <Icon name="contrast" size="xs" />
      </button>
      {activeLayer?.hasMask && (
        <button
          type="button"
          className={styles.bottomBtn}
          onClick={() => activeLayer && onRemoveLayerMask?.(activeLayer.name)}
          title="Remover Máscara (Preservar Camada)"
          aria-label="Remover máscara de camada"
        >
          <Icon name="close" size="xs" />
        </button>
      )}
      <button
        type="button"
        className={styles.bottomBtn}
        onClick={() => onAddGroup?.()}
        title="Nova Pasta / Grupo"
        aria-label="Nova pasta ou grupo"
      >
        <Icon name="folder" size="xs" />
      </button>
      {activeLayer?.isGroup && onUngroup && (
        <button
          type="button"
          className={styles.bottomBtn}
          onClick={onUngroup}
          title="Desagrupar Camadas"
          aria-label="Desagrupar camadas"
        >
          <Icon name="link" size="xs" />
        </button>
      )}
      <button
        type="button"
        className={styles.bottomBtn}
        onClick={() => onAddNewLayer()}
        title="Criar Nova Camada Limpa"
        aria-label="Criar nova camada limpa"
      >
        <Icon name="plus" size="xs" />
      </button>
      <button
        type="button"
        className={styles.bottomBtn}
        onClick={() => activeLayer && onDeleteLayer(activeLayer.name)}
        disabled={!activeLayer}
        title="Excluir Camada"
        aria-label="Excluir camada selecionada"
      >
        <Icon name="trash" size="xs" />
      </button>
    </div>
  );
}
