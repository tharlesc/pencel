import {
  useMemo,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
} from 'react';
import { Icon } from '../../../../components/ui/Icon/Icon.js';
import type { LayerItem, SelectedObjectProperties } from '../../engine/FabricCanvasAdapter.js';
import styles from './LayersPanel.module.css';

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

const BLEND_MODES: readonly { readonly value: string; readonly label: string }[] = [
  { value: 'source-over', label: 'Normal' },
  { value: 'multiply', label: 'Multiplicação' },
  { value: 'screen', label: 'Divisão (Screen)' },
  { value: 'overlay', label: 'Sobrepor (Overlay)' },
  { value: 'darken', label: 'Escurecer' },
  { value: 'lighten', label: 'Clarear' },
  { value: 'color-dodge', label: 'Subexposição de Cores' },
  { value: 'color-burn', label: 'Superexposição de Cores' },
  { value: 'hard-light', label: 'Luz Direta' },
  { value: 'soft-light', label: 'Luz Indireta' },
  { value: 'difference', label: 'Diferença' },
  { value: 'exclusion', label: 'Exclusão' },
  { value: 'luminosity', label: 'Luminosidade' },
];

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
  const [filterType, setFilterType] = useState<'all' | 'image' | 'text' | 'shape'>('all');
  const [editingLayerName, setEditingLayerName] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [selectedLayerName, setSelectedLayerName] = useState<string | null>(null);
  const [selectedLayerNames, setSelectedLayerNames] = useState<readonly string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [draggedName, setDraggedName] = useState<string | null>(null);
  const [dragOverName, setDragOverName] = useState<string | null>(null);

  // Active layer properties from selection or first selected layer
  const activeLayer = layers.find(
    (l) =>
      l.isSelected ||
      selectedLayerNames.includes(l.name) ||
      l.name === selectedLayerName ||
      selectedObject?.id === l.name,
  );
  const currentBlendMode = activeLayer ? activeLayer.blendMode : 'source-over';
  const isLocked = activeLayer?.locked ?? false;

  // Filtered layers
  const displayedLayers = layers.filter((layer) => {
    if (filterType === 'all') return true;
    if (filterType === 'text') return layer.type === 'textbox';
    if (filterType === 'shape') return ['rect', 'circle', 'triangle'].includes(layer.type);
    if (filterType === 'image') return layer.type === 'image';
    return true;
  });

  // Group structure: index member layers by groupName
  const memberLayersByGroup = useMemo(() => {
    const map = new Map<string, LayerItem[]>();
    for (const layer of displayedLayers) {
      if (layer.groupName) {
        const list = map.get(layer.groupName) || [];
        list.push(layer);
        map.set(layer.groupName, list);
      }
    }
    return map;
  }, [displayedLayers]);

  // Root layers: standalone layers and groups themselves
  const rootLayers = displayedLayers.filter((layer) => !layer.groupName);

  const handleSelectLayer = (name: string, e: MouseEvent): void => {
    if (e.shiftKey) {
      let nextNames: string[];
      if (selectedLayerNames.length === 0) {
        nextNames = [name];
      } else {
        const lastSelected = selectedLayerNames[selectedLayerNames.length - 1];
        const lastIndex = displayedLayers.findIndex((l) => l.name === lastSelected);
        const currentIndex = displayedLayers.findIndex((l) => l.name === name);

        if (lastIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastIndex, currentIndex);
          const end = Math.max(lastIndex, currentIndex);
          const range = displayedLayers.slice(start, end + 1).map((l) => l.name);
          nextNames = Array.from(new Set([...selectedLayerNames, ...range]));
        } else if (selectedLayerNames.includes(name)) {
          nextNames = selectedLayerNames.filter((n) => n !== name);
        } else {
          nextNames = [...selectedLayerNames, name];
        }
      }
      setSelectedLayerNames(nextNames);
      setSelectedLayerName(nextNames[0] || null);
      if (onSelectMultipleLayers) {
        onSelectMultipleLayers(nextNames);
      } else if (nextNames[0]) {
        onSelectLayer(nextNames[0]);
      }
    } else {
      setSelectedLayerNames([name]);
      setSelectedLayerName(name);
      onSelectLayer(name);
    }
  };

  const handleStartRename = (name: string, e: MouseEvent): void => {
    e.stopPropagation();
    setEditingLayerName(name);
    setTempName(name);
  };

  const handleFinishRename = (oldName: string): void => {
    if (tempName.trim() && tempName.trim() !== oldName) {
      onRenameLayer(oldName, tempName.trim());
    }
    setEditingLayerName(null);
  };

  const handleRenameKeyDown = (e: KeyboardEvent<HTMLInputElement>, oldName: string): void => {
    if (e.key === 'Enter') {
      handleFinishRename(oldName);
    } else if (e.key === 'Escape') {
      setEditingLayerName(null);
    }
  };

  const toggleGroupAccordion = (groupName: string, e: MouseEvent): void => {
    e.stopPropagation();
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: prev[groupName] === false,
    }));
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, name: string): void => {
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', name);
      e.dataTransfer.effectAllowed = 'move';
    }
    setDraggedName(name);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, name: string): void => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    if (dragOverName !== name) {
      setDragOverName(name);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetName: string): void => {
    e.preventDefault();
    const sourceName = draggedName || e.dataTransfer?.getData('text/plain');
    if (sourceName && sourceName !== targetName) {
      const targetIndex = displayedLayers.findIndex((l) => l.name === targetName);
      if (targetIndex !== -1 && onReorderLayerToIndex) {
        onReorderLayerToIndex(sourceName, targetIndex);
      }
    }
    setDraggedName(null);
    setDragOverName(null);
  };

  const handleDragEnd = (): void => {
    setDraggedName(null);
    setDragOverName(null);
  };

  const renderLayerRow = (layer: LayerItem, isChild = false): ReactElement => {
    const isEditing = editingLayerName === layer.name;
    const isGroupExpanded = expandedGroups[layer.name] !== false; // defaults to expanded
    const isSelected =
      layer.isSelected ||
      selectedLayerNames.includes(layer.name) ||
      layer.name === selectedLayerName ||
      selectedObject?.id === layer.name;

    return (
      <div
        key={layer.id}
        className={[
          styles.layerRow,
          isChild ? styles.layerRowIndented : '',
          isSelected ? styles.layerRowSelected : '',
          !layer.visible ? styles.layerRowHidden : '',
          draggedName === layer.name ? styles.layerRowDragging : '',
          dragOverName === layer.name ? styles.layerRowDragOver : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={(e) => handleSelectLayer(layer.name, e)}
        draggable={!isEditing}
        onDragStart={(e) => handleDragStart(e, layer.name)}
        onDragOver={(e) => handleDragOver(e, layer.name)}
        onDrop={(e) => handleDrop(e, layer.name)}
        onDragEnd={handleDragEnd}
        role="treeitem"
        aria-selected={isSelected}
      >
        {/* Eye Visibility Button */}
        <button
          type="button"
          className={[styles.eyeBtn, !layer.visible ? styles.eyeHidden : '']
            .filter(Boolean)
            .join(' ')}
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(layer.name);
          }}
          title={layer.visible ? 'Ocultar camada' : 'Exibir camada'}
          aria-label={layer.visible ? 'Ocultar camada' : 'Exibir camada'}
        >
          <Icon name={layer.visible ? 'eye' : 'eyeOff'} size="xs" />
        </button>

        {/* Group Chevron Accordion */}
        {layer.isGroup ? (
          <button
            type="button"
            className={styles.chevronBtn}
            onClick={(e) => toggleGroupAccordion(layer.name, e)}
            title={isGroupExpanded ? 'Recolher grupo' : 'Expandir grupo'}
            aria-label={isGroupExpanded ? 'Recolher grupo' : 'Expandir grupo'}
          >
            <Icon name={isGroupExpanded ? 'chevronDown' : 'chevronRight'} size="xs" />
          </button>
        ) : null}

        {/* Thumbnail Badge (Interactive image previews & visual icons) */}
        <div
          className={[styles.thumbnail, layer.type === 'image' ? styles.thumbnailImage : '']
            .filter(Boolean)
            .join(' ')}
          aria-hidden="true"
        >
          {layer.isGroup ? (
            <Icon name="folder" size="xs" />
          ) : layer.type === 'textbox' ? (
            <Icon name="text" size="xs" />
          ) : layer.type === 'image' && layer.previewUrl ? (
            <img src={layer.previewUrl} alt="" className={styles.layerImgThumb} />
          ) : layer.type === 'image' ? (
            <Icon name="image" size="xs" />
          ) : (
            <Icon name="square" size="xs" />
          )}
        </div>

        {/* Layer Name Column (Editable) */}
        <div
          className={styles.layerNameColumn}
          onDoubleClick={(e) => handleStartRename(layer.name, e)}
        >
          {isEditing ? (
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={() => handleFinishRename(layer.name)}
              onKeyDown={(e) => handleRenameKeyDown(e, layer.name)}
              className={styles.layerNameInput}
              autoFocus
              aria-label="Editar nome da camada"
            />
          ) : (
            <span className={styles.layerName} title={layer.name}>
              {layer.name}
            </span>
          )}
        </div>

        {/* Layer Mask Indicator Badge (Parte VII) */}
        {layer.hasMask && (
          <button
            type="button"
            className={[styles.lockBtn, layer.maskEnabled ? styles.lockBtnActive : '']
              .filter(Boolean)
              .join(' ')}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLayerMask?.(layer.name);
            }}
            title={
              layer.maskEnabled
                ? 'Máscara ativa (clique para desativar temporariamente)'
                : 'Máscara desativada (clique para reativar)'
            }
            aria-label="Alternar estado da máscara da camada"
          >
            <Icon name="contrast" size="xs" />
          </button>
        )}

        {/* Lock Indicator */}
        {layer.locked && (
          <button
            type="button"
            className={styles.lockBtn}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock(layer.name);
            }}
            title="Camada bloqueada"
            aria-label="Desbloquear camada"
          >
            <Icon name="lock" size="xs" />
          </button>
        )}

        {/* Hover Quick Actions: Duplicar e Excluir */}
        <div className={styles.hoverActions} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => onDuplicateLayer()}
            title="Duplicar camada"
            aria-label="Duplicar camada"
          >
            <Icon name="copy" size="xs" />
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => onDeleteLayer(layer.name)}
            title="Excluir camada"
            aria-label="Excluir camada"
          >
            <Icon name="trash" size="xs" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.panel}>
      {/* 1. Filter Toolbar (Tipo ▾ & Icon Filter Chips) */}
      <div className={styles.filterBar}>
        <select
          className={styles.filterSelect}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'all' | 'image' | 'text' | 'shape')}
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
            className={[styles.filterChip, filterType === 'image' ? styles.filterChipActive : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => setFilterType((prev) => (prev === 'image' ? 'all' : 'image'))}
            title="Filtrar Imagens"
            aria-label="Filtrar Imagens"
          >
            <Icon name="image" size="xs" />
          </button>
          <button
            type="button"
            className={[styles.filterChip, filterType === 'text' ? styles.filterChipActive : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => setFilterType((prev) => (prev === 'text' ? 'all' : 'text'))}
            title="Filtrar Textos"
            aria-label="Filtrar Textos"
          >
            <Icon name="text" size="xs" />
          </button>
          <button
            type="button"
            className={[styles.filterChip, filterType === 'shape' ? styles.filterChipActive : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => setFilterType((prev) => (prev === 'shape' ? 'all' : 'shape'))}
            title="Filtrar Formas"
            aria-label="Filtrar Formas"
          >
            <Icon name="square" size="xs" />
          </button>
        </div>
      </div>

      {/* 2. Controls Bar: Modo de Mesclagem & Bloqueios */}
      <div className={styles.controlsBar}>
        <div className={styles.controlRow}>
          <select
            className={styles.blendSelect}
            value={currentBlendMode}
            onChange={(e) => activeLayer && onSetBlendMode(activeLayer.name, e.target.value)}
            disabled={!activeLayer}
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
              className={[styles.lockBtn, isLocked ? styles.lockBtnActive : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => activeLayer && onToggleLock(activeLayer.name)}
              disabled={!activeLayer}
              title={isLocked ? 'Desbloquear camada' : 'Bloquear posição e atributos'}
              aria-label={isLocked ? 'Desbloquear camada' : 'Bloquear camada'}
            >
              <Icon name={isLocked ? 'lock' : 'unlock'} size="xs" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Layer Tree & Items */}
      <div className={styles.treeContainer} role="tree" aria-label="Árvore de camadas">
        {rootLayers.length === 0 ? (
          <div className={styles.emptyState}>
            <Icon name="layers" size="lg" tone="muted" />
            <span className={styles.emptyText}>Nenhuma camada no momento</span>
            <span>Adicione formas, textos ou imagens para vê-las aqui.</span>
          </div>
        ) : (
          rootLayers.map((layer) => {
            if (layer.isGroup) {
              const isGroupExpanded = expandedGroups[layer.name] !== false;
              const children = memberLayersByGroup.get(layer.name) || [];

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

      {/* 4. Bottom Action Bar: [Mask] [Invert Mask] [Remove Mask] [Group] [New Clean Layer] [Delete] */}
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
            onClick={() => onRemoveLayerMask?.(activeLayer.name)}
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
          onClick={() => activeLayer && onDeleteLayer(activeLayer.name)}
          disabled={!activeLayer}
          title="Excluir Camada"
          aria-label="Excluir camada selecionada"
        >
          <Icon name="trash" size="xs" />
        </button>
      </div>
    </div>
  );
}
