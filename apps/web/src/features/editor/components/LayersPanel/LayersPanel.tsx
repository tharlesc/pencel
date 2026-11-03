import { useState, type ReactElement } from 'react';
import { Icon, Select } from '../../../../components/ui/index.js';
import type { LayerItem, SelectedObjectProperties } from '../../engine/FabricCanvasAdapter.js';
import { BlendModePopover, CATEGORIZED_BLEND_MODES } from './BlendModePopover.js';
import { LayerBottomActions } from './LayerBottomActions.js';
import { LayerTreeItem } from './LayerTreeItem.js';
import styles from './LayersPanel.module.css';
import { useLayerTreeState } from './useLayerTreeState.js';

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
  readonly onUngroup?: () => void;
  readonly onAssignLayerToGroup?: (layerName: string, groupName: string | null) => void;
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
  onUngroup,
  onAssignLayerToGroup,
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
    onAssignLayerToGroup,
  });

  const [showBlendPopover, setShowBlendPopover] = useState(false);
  const activeBlendLabel =
    CATEGORIZED_BLEND_MODES.find((m) => m.value === tree.currentBlendMode)?.label ?? 'Normal';

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
        onExtractFromGroup={(name) => onAssignLayerToGroup?.(name, null)}
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
        <Select
          value={tree.filterType}
          options={[
            { label: 'Tipo: Todos', value: 'all' },
            { label: 'Tipo: Texto', value: 'text' },
            { label: 'Tipo: Forma', value: 'shape' },
            { label: 'Tipo: Imagem', value: 'image' },
          ]}
          onChange={(val) => tree.setFilterType(val as 'all' | 'image' | 'text' | 'shape')}
          ariaLabel="Filtrar camadas por tipo"
        />

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
          <div className={styles.blendContainer}>
            <button
              type="button"
              className={styles.blendSelect}
              onClick={() => setShowBlendPopover((prev) => !prev)}
              disabled={!tree.activeLayer}
              aria-label="Selecionar modo de mesclagem"
            >
              <span>{activeBlendLabel}</span>
              <Icon name="chevronDown" size="xs" tone="muted" />
            </button>
            <select
              aria-label="Modo de mesclagem"
              className={styles.blendSelectHidden}
              value={tree.currentBlendMode}
              onChange={(e) => {
                if (tree.activeLayer) onSetBlendMode(tree.activeLayer.name, e.target.value);
              }}
              tabIndex={-1}
            >
              <option value="source-over">Normal</option>
              <option value="multiply">Multiplicação</option>
              <option value="screen">Divisão (Screen)</option>
              <option value="overlay">Sobrepor (Overlay)</option>
              <option value="darken">Escurecer</option>
              <option value="lighten">Clarear</option>
              <option value="color-dodge">Subexposição de Cores</option>
              <option value="color-burn">Superexposição de Cores</option>
              <option value="hard-light">Luz Direta (Hard Light)</option>
              <option value="soft-light">Luz Indireta (Soft Light)</option>
              <option value="difference">Diferença</option>
              <option value="exclusion">Exclusão</option>
              <option value="hue">Matiz</option>
              <option value="saturation">Saturação</option>
              <option value="color">Cor</option>
              <option value="luminosity">Luminosidade</option>
            </select>
            {showBlendPopover && tree.activeLayer && (
              <BlendModePopover
                currentBlendMode={tree.currentBlendMode}
                onSelectBlendMode={(mode) => {
                  if (tree.activeLayer) onSetBlendMode(tree.activeLayer.name, mode);
                }}
                onClose={() => setShowBlendPopover(false)}
              />
            )}
          </div>

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

      <div
        className={styles.treeContainer}
        role="tree"
        aria-label="Árvore de camadas"
        onDragOver={(e) => e.preventDefault()}
        onDrop={tree.handleDropOnRoot}
      >
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

      <LayerBottomActions
        activeLayer={tree.activeLayer ?? null}
        onToggleLayerMask={onToggleLayerMask}
        onInvertLayerMask={onInvertLayerMask}
        onRemoveLayerMask={onRemoveLayerMask}
        onAddGroup={() => onAddGroup?.()}
        onUngroup={onUngroup}
        onAddNewLayer={onAddNewLayer}
        onDeleteLayer={onDeleteLayer}
      />
    </div>
  );
}
