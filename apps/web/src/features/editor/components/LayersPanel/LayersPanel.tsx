import type { ReactElement } from 'react';
import { Icon } from '../../../../components/ui/Icon/Icon.js';
import type { LayerItem, SelectedObjectProperties } from '../../engine/FabricCanvasAdapter.js';
import { LayerTreeItem } from './LayerTreeItem.js';
import styles from './LayersPanel.module.css';
import { BLEND_MODES, useLayerTreeState } from './useLayerTreeState.js';

export interface LayersPanelProps {
  readonly layers: readonly LayerItem[];
  readonly selectedObject: SelectedObjectProperties | null;
  readonly onSelectLayer: (name: string) => void;
  readonly onSelectMultipleLayers?: (names: readonly string[]) => void;
  readonly onToggleVisibility: (name: string) => void;
  readonly onToggleLock: (name: string) => void;
  readonly onSetOpacity?: (name: string, opacity: number) => void;
  readonly onSetBlendMode: (name: string, blendMode: string) => void;
  readonly onRenameLayer: (oldName: string, newName: string) => void;
  readonly onReorderLayer: (name: string, direction: 'up' | 'down') => void;
  readonly onReorderLayerToIndex?: (name: string, targetVisualIndex: number) => void;
  readonly onDeleteLayer: (name: string) => void;
  readonly onDuplicateLayer: () => void;
  readonly onAddNewLayer: (type?: string) => void;
  readonly onAddGroup?: () => void;
  readonly onToggleLayerMask?: (
    layerName?: string,
    shape?: 'circle' | 'rounded' | 'ellipse',
  ) => void;
  readonly onInvertLayerMask?: (layerName?: string) => void;
  readonly onRemoveLayerMask?: (layerName?: string) => void;
}

export function LayersPanel({
  layers,
  selectedObject,
  onSelectLayer,
  onSelectMultipleLayers,
  onToggleVisibility,
  onToggleLock,
  onSetBlendMode,
  onRenameLayer,
  onReorderLayerToIndex,
  onDeleteLayer,
  onDuplicateLayer,
  onAddNewLayer,
  onAddGroup,
  onToggleLayerMask,
  onInvertLayerMask,
  onRemoveLayerMask,
}: LayersPanelProps): ReactElement {
  const tree = useLayerTreeState({
    layers,
    selectedObject,
    onSelectLayer,
    onSelectMultipleLayers,
    onRenameLayer,
    onReorderLayerToIndex,
  });

  const renderLayerRow = (layer: LayerItem, isChild = false): ReactElement => {
    const isEditing = tree.editingLayerName === layer.name;
    const isGroupExpanded = tree.expandedGroups[layer.name] !== false;
    const isSelected = Boolean(
      layer.isSelected ||
      tree.selectedLayerNames.includes(layer.name) ||
      layer.name === tree.selectedLayerName ||
      selectedObject?.id === layer.name,
    );

    return (
      <LayerTreeItem
        key={layer.id}
        layer={layer}
        isChild={isChild}
        isEditing={isEditing}
        isGroupExpanded={isGroupExpanded}
        isSelected={isSelected}
        isDragging={tree.draggedName === layer.name}
        isDragOver={tree.dragOverName === layer.name}
        tempName={tree.tempName}
        onTempNameChange={tree.setTempName}
        onSelect={tree.handleSelectLayer}
        onStartRename={tree.handleStartRename}
        onFinishRename={tree.handleFinishRename}
        onRenameKeyDown={tree.handleRenameKeyDown}
        onToggleGroupAccordion={tree.toggleGroupAccordion}
        onToggleVisibility={onToggleVisibility}
        onToggleLock={onToggleLock}
        onToggleLayerMask={onToggleLayerMask}
        onDuplicateLayer={onDuplicateLayer}
        onDeleteLayer={onDeleteLayer}
        onDragStart={tree.handleDragStart}
        onDragOver={tree.handleDragOver}
        onDrop={tree.handleDrop}
        onDragEnd={tree.handleDragEnd}
      />
    );
  };

  return (
    <div className={styles.panel}>
      <div className={styles.filterBar}>
        <select
          className={styles.filterSelect}
          value={tree.filterType}
          onChange={(e) => tree.setFilterType(e.target.value as 'all' | 'image' | 'text' | 'shape')}
          aria-label="Filtrar camadas por tipo"
        >
          <option value="all">Tipo: Todos</option>
          <option value="text">Tipo: Texto</option>
          <option value="shape">Tipo: Forma</option>
          <option value="image">Tipo: Imagem</option>
        </select>

        <div className={styles.filterChips}>
          <button
            type="button"
            className={[
              styles.filterChip,
              tree.filterType === 'image' ? styles.filterChipActive : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => tree.setFilterType((prev) => (prev === 'image' ? 'all' : 'image'))}
            title="Filtrar Imagens"
            aria-label="Filtrar Imagens"
          >
            <Icon name="image" size="xs" />
          </button>
          <button
            type="button"
            className={[
              styles.filterChip,
              tree.filterType === 'text' ? styles.filterChipActive : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => tree.setFilterType((prev) => (prev === 'text' ? 'all' : 'text'))}
            title="Filtrar Textos"
            aria-label="Filtrar Textos"
          >
            <Icon name="text" size="xs" />
          </button>
          <button
            type="button"
            className={[
              styles.filterChip,
              tree.filterType === 'shape' ? styles.filterChipActive : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => tree.setFilterType((prev) => (prev === 'shape' ? 'all' : 'shape'))}
            title="Filtrar Formas"
            aria-label="Filtrar Formas"
          >
            <Icon name="square" size="xs" />
          </button>
        </div>
      </div>

      <div className={styles.controlsBar}>
        <div className={styles.controlRow}>
          <select
            className={styles.blendSelect}
            value={tree.currentBlendMode}
            onChange={(e) =>
              tree.activeLayer && onSetBlendMode(tree.activeLayer.name, e.target.value)
            }
            disabled={!tree.activeLayer}
            aria-label="Modo de mesclagem"
          >
            {BLEND_MODES.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>

          <div className={styles.lockIconsGroup}>
            <button
              type="button"
              className={[styles.lockBtn, tree.isLocked ? styles.lockBtnActive : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => tree.activeLayer && onToggleLock(tree.activeLayer.name)}
              disabled={!tree.activeLayer}
              title={tree.isLocked ? 'Desbloquear camada' : 'Bloquear posição e atributos'}
              aria-label={tree.isLocked ? 'Desbloquear camada' : 'Bloquear camada'}
            >
              <Icon name={tree.isLocked ? 'lock' : 'unlock'} size="xs" />
            </button>
          </div>
        </div>
      </div>

      <div className={styles.treeContainer} role="tree" aria-label="Árvore de camadas">
        {tree.rootLayers.length === 0 ? (
          <div className={styles.emptyState}>
            <Icon name="layers" size="lg" tone="muted" />
            <span className={styles.emptyText}>Nenhuma camada no momento</span>
            <span>Adicione formas, textos ou imagens para vê-las aqui.</span>
          </div>
        ) : (
          tree.rootLayers.map((layer) => {
            if (layer.isGroup) {
              const isGroupExpanded = tree.expandedGroups[layer.name] !== false;
              const children = tree.memberLayersByGroup.get(layer.name) || [];

              return (
                <div key={layer.id} className={styles.groupContainer}>
                  {renderLayerRow(layer, false)}
                  {isGroupExpanded && children.length > 0 && (
                    <div className={styles.groupChildrenWrapper}>
                      {children.map((child) => renderLayerRow(child, true))}
                    </div>
                  )}
                </div>
              );
            }

            return renderLayerRow(layer, false);
          })
        )}
      </div>

      <div className={styles.bottomBar} role="toolbar" aria-label="Ações de camadas">
        <button
          type="button"
          className={styles.bottomBtn}
          onClick={() => onToggleLayerMask?.(tree.activeLayer?.name, 'circle')}
          disabled={!tree.activeLayer}
          title={
            tree.activeLayer?.hasMask
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
          onClick={() => onInvertLayerMask?.(tree.activeLayer?.name)}
          disabled={!tree.activeLayer?.hasMask}
          title="Inverter Máscara de Camada"
          aria-label="Inverter máscara de camada"
        >
          <Icon name="contrast" size="xs" />
        </button>
        {tree.activeLayer?.hasMask && (
          <button
            type="button"
            className={styles.bottomBtn}
            onClick={() => tree.activeLayer && onRemoveLayerMask?.(tree.activeLayer.name)}
            title="Remover Máscara (Preservar Camada)"
            aria-label="Remover máscara de camada"
          >
            <Icon name="close" size="xs" />
          </button>
        )}
        <button
          type="button"
          className={styles.bottomBtn}
          onClick={onAddGroup}
          title="Nova Pasta / Grupo"
          aria-label="Nova pasta ou grupo"
        >
          <Icon name="folder" size="xs" />
        </button>
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
          onClick={() => tree.activeLayer && onDeleteLayer(tree.activeLayer.name)}
          disabled={!tree.activeLayer}
          title="Excluir Camada"
          aria-label="Excluir camada selecionada"
        >
          <Icon name="trash" size="xs" />
        </button>
      </div>
    </div>
  );
}
