import { useMemo, useState, type DragEvent, type KeyboardEvent, type MouseEvent } from 'react';
import type { LayerItem, SelectedObjectProperties } from '../../engine/FabricCanvasAdapter.js';

export const BLEND_MODES: readonly { readonly value: string; readonly label: string }[] = [
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

export interface UseLayerTreeStateOptions {
  readonly layers: readonly LayerItem[];
  readonly selectedObject: SelectedObjectProperties | null;
  readonly onSelectLayer: (name: string) => void;
  readonly onSelectMultipleLayers?: (names: readonly string[]) => void;
  readonly onRenameLayer: (oldName: string, newName: string) => void;
  readonly onReorderLayerToIndex?: (name: string, targetVisualIndex: number) => void;
}

export interface UseLayerTreeStateReturn {
  readonly filterType: 'all' | 'image' | 'text' | 'shape';
  readonly setFilterType: (
    updater:
      | 'all'
      | 'image'
      | 'text'
      | 'shape'
      | ((prev: 'all' | 'image' | 'text' | 'shape') => 'all' | 'image' | 'text' | 'shape'),
  ) => void;
  readonly editingLayerName: string | null;
  readonly tempName: string;
  readonly setTempName: (name: string) => void;
  readonly selectedLayerName: string | null;
  readonly selectedLayerNames: readonly string[];
  readonly expandedGroups: Record<string, boolean>;
  readonly draggedName: string | null;
  readonly dragOverName: string | null;
  readonly activeLayer: LayerItem | undefined;
  readonly currentBlendMode: string;
  readonly isLocked: boolean;
  readonly memberLayersByGroup: ReadonlyMap<string, readonly LayerItem[]>;
  readonly rootLayers: readonly LayerItem[];
  readonly handleSelectLayer: (name: string, e: MouseEvent) => void;
  readonly handleStartRename: (name: string, e: MouseEvent) => void;
  readonly handleFinishRename: (oldName: string) => void;
  readonly handleRenameKeyDown: (e: KeyboardEvent<HTMLInputElement>, oldName: string) => void;
  readonly toggleGroupAccordion: (groupName: string, e: MouseEvent) => void;
  readonly handleDragStart: (e: DragEvent<HTMLDivElement>, name: string) => void;
  readonly handleDragOver: (e: DragEvent<HTMLDivElement>, name: string) => void;
  readonly handleDrop: (e: DragEvent<HTMLDivElement>, targetName: string) => void;
  readonly handleDragEnd: () => void;
}

export function useLayerTreeState({
  layers,
  selectedObject,
  onSelectLayer,
  onSelectMultipleLayers,
  onRenameLayer,
  onReorderLayerToIndex,
}: UseLayerTreeStateOptions): UseLayerTreeStateReturn {
  const [filterType, setFilterType] = useState<'all' | 'image' | 'text' | 'shape'>('all');
  const [editingLayerName, setEditingLayerName] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [selectedLayerName, setSelectedLayerName] = useState<string | null>(null);
  const [selectedLayerNames, setSelectedLayerNames] = useState<readonly string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [draggedName, setDraggedName] = useState<string | null>(null);
  const [dragOverName, setDragOverName] = useState<string | null>(null);

  const activeLayer = layers.find(
    (l) =>
      l.isSelected ||
      selectedLayerNames.includes(l.name) ||
      l.name === selectedLayerName ||
      selectedObject?.id === l.name,
  );
  const currentBlendMode = activeLayer ? activeLayer.blendMode : 'source-over';
  const isLocked = activeLayer?.locked ?? false;

  const displayedLayers = useMemo(
    () =>
      layers.filter((layer) => {
        if (filterType === 'all') return true;
        if (filterType === 'text') return layer.type === 'textbox';
        if (filterType === 'shape') return ['rect', 'circle', 'triangle'].includes(layer.type);
        if (filterType === 'image') return layer.type === 'image';
        return true;
      }),
    [layers, filterType],
  );

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

  const rootLayers = useMemo(
    () => displayedLayers.filter((layer) => !layer.groupName),
    [displayedLayers],
  );

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

  return {
    filterType,
    setFilterType,
    editingLayerName,
    tempName,
    setTempName,
    selectedLayerName,
    selectedLayerNames,
    expandedGroups,
    draggedName,
    dragOverName,
    activeLayer,
    currentBlendMode,
    isLocked,
    memberLayersByGroup,
    rootLayers,
    handleSelectLayer,
    handleStartRename,
    handleFinishRename,
    handleRenameKeyDown,
    toggleGroupAccordion,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
}
