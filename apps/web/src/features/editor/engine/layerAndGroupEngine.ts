import type { Dimensions } from '@pencel/shared-types';
import {
  ActiveSelection,
  FabricImage,
  Group as FabricGroup,
  IText as FabricIText,
  Rect as FabricRect,
  Textbox as FabricTextbox,
  type Canvas as FabricCanvas,
} from 'fabric';
import { clamp } from '../../../shared/lib/mathUtils.js';
import { normalizeObjectType, type LayerItem } from './adapterTypes.js';

export function getCanvasLayers(fabricCanvas: FabricCanvas): readonly LayerItem[] {
  const active = fabricCanvas.getActiveObject();
  const activeObjects = fabricCanvas.getActiveObjects();

  return fabricCanvas
    .getObjects()
    .map((obj, index) => {
      const isGroup = Boolean(obj.get('isGroup')) || obj.type === 'group';
      const type = isGroup ? 'group' : normalizeObjectType(obj.type);
      const textContent =
        obj instanceof FabricTextbox || obj instanceof FabricIText ? obj.text : undefined;
      let previewUrl: string | undefined;
      if (obj instanceof FabricImage) {
        const imgEl = obj.getElement() as HTMLImageElement | undefined;
        previewUrl = imgEl?.src || (obj.getSrc ? obj.getSrc() : undefined);
      }

      const name =
        (obj.get('name') as string) ||
        (textContent
          ? textContent.slice(0, 24) || 'Texto'
          : isGroup
            ? `Grupo ${index + 1}`
            : `${type} ${index + 1}`);
      const isLocked = Boolean(obj.get('lockMovementX'));
      const visible = obj.visible !== false;
      const opacity = obj.opacity ?? 1;
      const blendMode = (obj.get('globalCompositeOperation') as string) || 'source-over';
      const groupName = obj.get('groupName') as string | undefined;
      const isSelected = obj === active || activeObjects.includes(obj);
      const hasMask = Boolean(obj.get('hasMask'));
      const maskEnabled = obj.get('maskEnabled') !== false;
      const maskInverted = Boolean(obj.get('maskInverted'));

      return {
        id: name,
        name,
        text: textContent,
        previewUrl,
        type,
        isSelected,
        visible,
        locked: isLocked,
        opacity,
        blendMode,
        isGroup,
        groupName: isGroup ? undefined : groupName,
        hasMask,
        maskEnabled,
        maskInverted,
      };
    })
    .reverse();
}

export function selectObjectByNameOnCanvas(
  fabricCanvas: FabricCanvas,
  name: string,
  onSelectionUpdate: () => void,
  onCanvasChange: () => void,
): void {
  try {
    fabricCanvas.discardActiveObject();
    const target = fabricCanvas.getObjects().find((obj) => (obj.get('name') as string) === name);

    if (target) {
      fabricCanvas.setActiveObject(target);
      fabricCanvas.requestRenderAll();
      onSelectionUpdate();
    }
    onCanvasChange();
  } catch (err) {
    console.warn('Erro ao selecionar camada:', err);
  }
}

export function selectObjectsByNamesOnCanvas(
  fabricCanvas: FabricCanvas,
  names: readonly string[],
  onSelectionUpdate: () => void,
  onSelectionCleared: () => void,
  onCanvasChange: () => void,
): void {
  try {
    fabricCanvas.discardActiveObject();
    if (names.length === 0) {
      fabricCanvas.requestRenderAll();
      onSelectionCleared();
      return;
    }

    const nameSet = new Set(names);
    const targets = fabricCanvas
      .getObjects()
      .filter((obj) => nameSet.has(obj.get('name') as string));

    if (targets.length === 0) {
      fabricCanvas.requestRenderAll();
      onSelectionCleared();
    } else if (targets.length === 1) {
      fabricCanvas.setActiveObject(targets[0]!);
      fabricCanvas.requestRenderAll();
      onSelectionUpdate();
    } else {
      const selection = new ActiveSelection(targets, { canvas: fabricCanvas });
      fabricCanvas.setActiveObject(selection);
      fabricCanvas.requestRenderAll();
      onSelectionUpdate();
    }
    onCanvasChange();
  } catch (err) {
    console.warn('Erro ao selecionar múltiplos objetos:', err);
  }
}

export function toggleLayerVisibilityOnCanvas(
  fabricCanvas: FabricCanvas,
  name: string,
  onSelectionCleared: () => void,
  onComplete: () => void,
): void {
  const target = fabricCanvas.getObjects().find((obj) => obj.get('name') === name);
  if (!target) return;

  const nextVisible = target.visible === false;
  target.set('visible', nextVisible);

  if (target.get('isGroup')) {
    const members = fabricCanvas
      .getObjects()
      .filter((o) => o.get('groupName') === name && !o.get('isGroup'));
    members.forEach((m) => m.set('visible', nextVisible));
  }

  if (!nextVisible && fabricCanvas.getActiveObject() === target) {
    fabricCanvas.discardActiveObject();
    onSelectionCleared();
  }
  fabricCanvas.requestRenderAll();
  onComplete();
}

export function toggleLayerLockOnCanvas(
  fabricCanvas: FabricCanvas,
  name: string,
  onComplete: () => void,
): void {
  const target = fabricCanvas.getObjects().find((obj) => obj.get('name') === name);
  if (!target) return;

  const currentlyLocked = Boolean(target.get('lockMovementX'));
  const nextLocked = !currentlyLocked;

  target.set({
    lockMovementX: nextLocked,
    lockMovementY: nextLocked,
    lockRotation: nextLocked,
    lockScalingX: nextLocked,
    lockScalingY: nextLocked,
    hasControls: !nextLocked,
  });

  if (target.get('isGroup')) {
    const members = fabricCanvas
      .getObjects()
      .filter((o) => o.get('groupName') === name && !o.get('isGroup'));
    members.forEach((m) =>
      m.set({
        lockMovementX: nextLocked,
        lockMovementY: nextLocked,
        lockRotation: nextLocked,
        lockScalingX: nextLocked,
        lockScalingY: nextLocked,
        hasControls: !nextLocked,
      }),
    );
  }

  fabricCanvas.requestRenderAll();
  onComplete();
}

export function setLayerOpacityOnCanvas(
  fabricCanvas: FabricCanvas,
  name: string,
  opacity: number,
  onComplete: () => void,
): void {
  const target = fabricCanvas.getObjects().find((obj) => obj.get('name') === name);
  if (!target) return;

  target.set('opacity', clamp(opacity, 0, 1));
  fabricCanvas.requestRenderAll();
  onComplete();
}

export function setLayerBlendModeOnCanvas(
  fabricCanvas: FabricCanvas,
  name: string,
  blendMode: string,
  onComplete: () => void,
): void {
  const target = fabricCanvas.getObjects().find((obj) => obj.get('name') === name);
  if (!target) return;

  target.set('globalCompositeOperation', blendMode);
  fabricCanvas.requestRenderAll();
  onComplete();
}

export function renameLayerOnCanvas(
  fabricCanvas: FabricCanvas,
  oldName: string,
  newName: string,
  onComplete: () => void,
): void {
  if (!newName.trim()) return;
  const target = fabricCanvas.getObjects().find((obj) => obj.get('name') === oldName);
  if (!target) return;

  const trimmed = newName.trim();
  target.set('name', trimmed);
  if (target instanceof FabricTextbox) {
    target.set('text', trimmed);
  }
  fabricCanvas.requestRenderAll();
  onComplete();
}

export function reorderLayerOnCanvas(
  fabricCanvas: FabricCanvas,
  name: string,
  direction: 'up' | 'down',
  onComplete: () => void,
): void {
  const target = fabricCanvas.getObjects().find((obj) => obj.get('name') === name);
  if (!target) return;

  if (direction === 'up') {
    fabricCanvas.bringObjectForward(target);
  } else {
    fabricCanvas.sendObjectBackwards(target);
  }

  fabricCanvas.requestRenderAll();
  onComplete();
}

export function reorderLayerToIndexOnCanvas(
  fabricCanvas: FabricCanvas,
  name: string,
  targetVisualIndex: number,
  onComplete: () => void,
): void {
  const objects = fabricCanvas.getObjects();
  const target = objects.find((obj) => obj.get('name') === name);
  if (!target) return;

  const targetZIndex = clamp(objects.length - 1 - targetVisualIndex, 0, objects.length - 1);
  fabricCanvas.moveObjectTo(target, targetZIndex);
  fabricCanvas.requestRenderAll();
  onComplete();
}

export function createGroupOnCanvas(
  fabricCanvas: FabricCanvas,
  pageDimensions: Dimensions,
  name: string | undefined,
  onComplete: () => void,
): void {
  try {
    const activeObjs = [...fabricCanvas.getActiveObjects()];
    const groupCount =
      fabricCanvas.getObjects().filter((o) => o.type === 'group' || o.get('isGroup')).length + 1;
    const groupName = name || `Grupo ${groupCount}`;

    if (activeObjs.length > 1) {
      fabricCanvas.discardActiveObject();
      activeObjs.forEach((o) => fabricCanvas.remove(o));

      const group = new FabricGroup(activeObjs, {
        subTargetCheck: true,
        interactive: true,
      });
      group.set('name', groupName);
      group.set('isGroup', true);
      group.set('groupName', groupName);

      fabricCanvas.add(group);
      fabricCanvas.setActiveObject(group);
    } else {
      let left = Math.round(pageDimensions.width * 0.15);
      let top = Math.round(pageDimensions.height * 0.15);
      let width = Math.round(pageDimensions.width * 0.7);
      let height = Math.round(pageDimensions.height * 0.4);

      if (activeObjs.length === 1 && activeObjs[0]) {
        const single = activeObjs[0];
        left = single.left || left;
        top = single.top || top;
        width = (single.width || 100) * (single.scaleX || 1);
        height = (single.height || 100) * (single.scaleY || 1);
        fabricCanvas.discardActiveObject();
        fabricCanvas.remove(single);
        const group = new FabricGroup([single], {
          subTargetCheck: true,
          interactive: true,
        });
        group.set('name', groupName);
        group.set('isGroup', true);
        group.set('groupName', groupName);
        fabricCanvas.add(group);
        fabricCanvas.setActiveObject(group);
      } else {
        const group = new FabricGroup([], {
          left,
          top,
          width,
          height,
          subTargetCheck: true,
          interactive: true,
        });
        group.set('name', groupName);
        group.set('isGroup', true);
        group.set('groupName', groupName);
        fabricCanvas.add(group);
        fabricCanvas.setActiveObject(group);
      }
    }

    fabricCanvas.requestRenderAll();
    onComplete();
  } catch (err) {
    console.warn('Erro ao criar grupo:', err);
  }
}

export function ungroupSelectedOnCanvas(fabricCanvas: FabricCanvas, onComplete: () => void): void {
  try {
    const active = fabricCanvas.getActiveObject();
    if (!active || !(active instanceof FabricGroup)) return;

    const objects = [...active.getObjects()];
    fabricCanvas.remove(active);

    objects.forEach((obj) => {
      fabricCanvas.add(obj);
      obj.setCoords();
    });

    if (objects.length > 0) {
      const sel = new ActiveSelection(objects, { canvas: fabricCanvas });
      fabricCanvas.setActiveObject(sel);
    }

    fabricCanvas.requestRenderAll();
    onComplete();
  } catch (err) {
    console.warn('Erro ao desagrupar:', err);
  }
}

export function addCleanLayerToCanvas(
  fabricCanvas: FabricCanvas,
  pageDimensions: Dimensions,
  name: string | undefined,
  onComplete: () => void,
): void {
  const count = fabricCanvas.getObjects().filter((o) => !o.get('isGroup')).length + 1;
  const layerName = name || `Camada ${count}`;

  const cleanLayer = new FabricRect({
    left: Math.round(pageDimensions.width * 0.1),
    top: Math.round(pageDimensions.height * 0.1),
    width: Math.round(pageDimensions.width * 0.8),
    height: Math.round(pageDimensions.height * 0.8),
    fill: 'transparent',
    stroke: 'transparent',
    strokeWidth: 0,
    name: layerName,
  });
  cleanLayer.set('isCleanLayer', true);

  fabricCanvas.add(cleanLayer);
  fabricCanvas.setActiveObject(cleanLayer);
  fabricCanvas.requestRenderAll();
  onComplete();
}

export function deleteLayerByNameOnCanvas(
  fabricCanvas: FabricCanvas,
  name: string,
  onSelectionCleared: () => void,
  onComplete: () => void,
): void {
  const target = fabricCanvas.getObjects().find((obj) => obj.get('name') === name);
  if (!target) return;

  if (target.get('isGroup')) {
    const members = fabricCanvas.getObjects().filter((o) => o.get('groupName') === name);
    members.forEach((m) => fabricCanvas.remove(m));
  } else {
    fabricCanvas.remove(target);
  }

  if (fabricCanvas.getActiveObject() === target) {
    fabricCanvas.discardActiveObject();
    onSelectionCleared();
  }
  fabricCanvas.requestRenderAll();
  onComplete();
}
