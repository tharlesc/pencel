import type { DragEvent, KeyboardEvent, MouseEvent, ReactElement } from 'react';
import { Icon } from '../../../../components/ui/Icon/Icon.js';
import type { LayerItem } from '../../engine/FabricCanvasAdapter.js';
import styles from './LayersPanel.module.css';

export interface LayerTreeItemProps {
  readonly layer: LayerItem;
  readonly isChild?: boolean;
  readonly isEditing: boolean;
  readonly isGroupExpanded: boolean;
  readonly isSelected: boolean;
  readonly isDragging: boolean;
  readonly isDragOver: boolean;
  readonly tempName: string;
  readonly onTempNameChange: (val: string) => void;
  readonly onSelect: (name: string, e: MouseEvent) => void;
  readonly onStartRename: (name: string, e: MouseEvent) => void;
  readonly onFinishRename: (oldName: string) => void;
  readonly onRenameKeyDown: (e: KeyboardEvent<HTMLInputElement>, oldName: string) => void;
  readonly onToggleGroupAccordion: (groupName: string, e: MouseEvent) => void;
  readonly onToggleVisibility: (name: string) => void;
  readonly onToggleLock: (name: string) => void;
  readonly onToggleLayerMask?: (
    layerName?: string,
    shape?: 'circle' | 'rounded' | 'ellipse',
  ) => void;
  readonly onDuplicateLayer: () => void;
  readonly onExtractFromGroup?: (name: string) => void;
  readonly onDeleteLayer: (name: string) => void;
  readonly onDragStart: (e: DragEvent<HTMLDivElement>, name: string) => void;
  readonly onDragOver: (e: DragEvent<HTMLDivElement>, name: string) => void;
  readonly onDrop: (e: DragEvent<HTMLDivElement>, targetName: string) => void;
  readonly onDragEnd: () => void;
}

export function LayerTreeItem({
  layer,
  isChild = false,
  isEditing,
  isGroupExpanded,
  isSelected,
  isDragging,
  isDragOver,
  tempName,
  onTempNameChange,
  onSelect,
  onStartRename,
  onFinishRename,
  onRenameKeyDown,
  onToggleGroupAccordion,
  onToggleVisibility,
  onToggleLock,
  onToggleLayerMask,
  onDuplicateLayer,
  onExtractFromGroup,
  onDeleteLayer,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: LayerTreeItemProps): ReactElement {
  return (
    <div
      className={[
        styles.layerRow,
        isChild ? styles.layerRowIndented : '',
        isSelected ? styles.layerRowSelected : '',
        !layer.visible ? styles.layerRowHidden : '',
        isDragging ? styles.layerRowDragging : '',
        isDragOver ? styles.layerRowDragOver : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={(e) => onSelect(layer.name, e)}
      draggable={!isEditing}
      onDragStart={(e) => onDragStart(e, layer.name)}
      onDragOver={(e) => onDragOver(e, layer.name)}
      onDrop={(e) => onDrop(e, layer.name)}
      onDragEnd={onDragEnd}
      role="treeitem"
      aria-selected={isSelected}
    >
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

      {layer.isGroup ? (
        <button
          type="button"
          className={styles.chevronBtn}
          onClick={(e) => onToggleGroupAccordion(layer.name, e)}
          title={isGroupExpanded ? 'Recolher grupo' : 'Expandir grupo'}
          aria-label={isGroupExpanded ? 'Recolher grupo' : 'Expandir grupo'}
        >
          <Icon name={isGroupExpanded ? 'chevronDown' : 'chevronRight'} size="xs" />
        </button>
      ) : null}

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

      <div className={styles.layerNameColumn} onDoubleClick={(e) => onStartRename(layer.name, e)}>
        {isEditing ? (
          <input
            type="text"
            value={tempName}
            onChange={(e) => onTempNameChange(e.target.value)}
            onBlur={() => onFinishRename(layer.name)}
            onKeyDown={(e) => onRenameKeyDown(e, layer.name)}
            className={styles.layerNameInput}
            autoFocus
            aria-label="Editar nome da camada"
          />
        ) : (
          <span
            className={styles.layerName}
            title={typeof layer.name === 'string' ? layer.name : 'Camada'}
          >
            {typeof layer.name === 'string' ? layer.name : 'Camada'}
          </span>
        )}
      </div>

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

      <div className={styles.hoverActions} onClick={(e) => e.stopPropagation()}>
        {(isChild || Boolean(layer.groupName)) && onExtractFromGroup && (
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => onExtractFromGroup(layer.name)}
            title="Retirar do grupo"
            aria-label="Retirar elemento do grupo"
          >
            <Icon name="link" size="xs" />
          </button>
        )}
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
}
