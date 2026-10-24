import { useMemo } from 'react';
import {
  useOptionalEditorEngine,
  useOptionalEditorLayers,
  useOptionalEditorSelection,
} from '../state/EditorProvider.js';

export function useLayersPanel() {
  const layersCtx = useOptionalEditorLayers();
  const selectionCtx = useOptionalEditorSelection();
  const engine = useOptionalEditorEngine();

  return useMemo(
    () => ({
      layers: layersCtx?.layers ?? [],
      selectedObject: selectionCtx?.selectedObject ?? null,
      onSelectLayer: engine?.selectObjectByName ?? (() => {}),
      onSelectMultipleLayers: engine?.selectObjectsByNames,
      onToggleVisibility: engine?.toggleLayerVisibility ?? (() => {}),
      onToggleLock: engine?.toggleLayerLock ?? (() => {}),
      onSetOpacity: engine?.setLayerOpacity ?? (() => {}),
      onSetBlendMode: engine?.setLayerBlendMode ?? (() => {}),
      onRenameLayer: engine?.renameLayer ?? (() => {}),
      onReorderLayer: engine?.reorderLayer ?? (() => {}),
      onReorderLayerToIndex: engine?.reorderLayerToIndex,
      onDeleteLayer: engine?.deleteLayerByName ?? engine?.deleteSelected ?? (() => {}),
      onDuplicateLayer: engine?.duplicateSelected ?? (() => {}),
      onAddNewLayer:
        engine?.addCleanLayer ??
        (() => {
          engine?.addText({ text: 'Nova Camada' });
        }),
      onAddGroup: engine?.createGroup,
      onToggleLayerMask: engine?.toggleLayerMask,
      onInvertLayerMask: engine?.invertLayerMask,
      onRemoveLayerMask: engine?.removeLayerMask,
    }),
    [layersCtx?.layers, selectionCtx?.selectedObject, engine],
  );
}
