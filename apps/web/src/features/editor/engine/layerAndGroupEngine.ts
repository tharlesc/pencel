import type { Dimensions } from '@pencel/shared-types';
import {
  ActiveSelection,
  FabricImage,
  Group as FabricGroup,
  IText as FabricIText,
  Rect as FabricRect,
  Textbox as FabricTextbox,
  type Canvas as FabricCanvas,
  type FabricObject,
} from 'fabric';
import { clamp } from '../../../shared/lib/mathUtils.js';
import { normalizeObjectType, type LayerItem } from './adapterTypes.js';

function toLayerItem(
  obj: FabricObject,
  idx: number,
  active: FabricObject | null | undefined,
  activeObjs: readonly FabricObject[],
  parentGroup?: string,
): LayerItem {
  const isGroup = Boolean(obj.get('isGroup')) || obj.type === 'group';
  const type = isGroup ? 'group' : normalizeObjectType(obj.type);
  const text = obj instanceof FabricTextbox || obj instanceof FabricIText ? obj.text : undefined;
  const previewUrl =
    obj instanceof FabricImage
      ? (obj.getElement() as HTMLImageElement | undefined)?.src ||
        (obj.getSrc ? obj.getSrc() : undefined)
      : undefined;
  const name =
    (obj.get('name') as string) ||
    (text ? text.slice(0, 24) || 'Texto' : isGroup ? `Grupo ${idx + 1}` : `${type} ${idx + 1}`);

  return {
    id: name,
    name,
    text,
    previewUrl,
    type,
    isSelected: obj === active || activeObjs.includes(obj),
    visible: obj.visible !== false,
    locked: Boolean(obj.get('lockMovementX')),
    opacity: obj.opacity ?? 1,
    blendMode: (obj.get('globalCompositeOperation') as string) || 'source-over',
    isGroup,
    groupName: isGroup ? undefined : parentGroup || (obj.get('groupName') as string | undefined),
    hasMask: Boolean(obj.get('hasMask')),
    maskEnabled: obj.get('maskEnabled') !== false,
    maskInverted: Boolean(obj.get('maskInverted')),
  };
}

export function getCanvasLayers(fabricCanvas: FabricCanvas): readonly LayerItem[] {
  const active = fabricCanvas.getActiveObject();
  const activeObjs = fabricCanvas.getActiveObjects();
  const items: LayerItem[] = [];

  fabricCanvas.getObjects().forEach((obj, index) => {
    if (obj.get('isEraser') || obj.get('name') === '__group_anchor__') return;
    const parent = toLayerItem(obj, index, active, activeObjs);
    items.push(parent);

    if (obj instanceof FabricGroup) {
      obj.getObjects().forEach((child, childIdx) => {
        if (child.get('name') === '__group_anchor__') return;
        items.push(toLayerItem(child, childIdx, active, activeObjs, parent.name));
      });
    }
  });

  return items.reverse();
}

export function findCanvasObjectAndGroup(
  fabricCanvas: FabricCanvas,
  name: string,
): { target: FabricObject; parentGroup?: FabricGroup } | null {
  for (const obj of fabricCanvas.getObjects()) {
    if (obj.get('name') === name) return { target: obj };
    if (obj instanceof FabricGroup) {
      for (const child of obj.getObjects()) {
        if (child.get('name') === name) return { target: child, parentGroup: obj };
      }
    }
  }
  return null;
}

export function selectObjectByNameOnCanvas(
  fabricCanvas: FabricCanvas,
  name: string,
  onSelectionUpdate: () => void,
  onCanvasChange: () => void,
): void {
  try {
    fabricCanvas.discardActiveObject();
    const found = findCanvasObjectAndGroup(fabricCanvas, name);

    if (found) {
      fabricCanvas.setActiveObject(found.target);
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

  const nextLocked = !target.get('lockMovementX');
  const lockProps = {
    lockMovementX: nextLocked,
    lockMovementY: nextLocked,
    lockRotation: nextLocked,
    lockScalingX: nextLocked,
    lockScalingY: nextLocked,
    hasControls: !nextLocked,
  };
  target.set(lockProps);

  if (target.get('isGroup')) {
    fabricCanvas
      .getObjects()
      .filter((o) => o.get('groupName') === name && !o.get('isGroup'))
      .forEach((m) => m.set(lockProps));
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
  const active = fabricCanvas.getActiveObject();
  const target =
    fabricCanvas
      .getObjects()
      .find((o) => o.get('name') === name || (o as { id?: string }).id === name) ||
    (active && (active.get('name') === name || (active as { id?: string }).id === name)
      ? active
      : null);
  if (!target) return;
  target.set('globalCompositeOperation', blendMode);
  target.dirty = true;
  fabricCanvas.requestRenderAll();
  onComplete();
}

export function renameLayerOnCanvas(
  fabricCanvas: FabricCanvas,
  oldName: string,
  newName: string,
  onComplete: () => void,
): void {
  const trimmed = newName.trim();
  if (!trimmed) return;
  const target = fabricCanvas.getObjects().find((obj) => obj.get('name') === oldName);
  if (!target) return;
  target.set('name', trimmed);
  if (target instanceof FabricTextbox) target.set('text', trimmed);
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
    const groupName =
      typeof name === 'string' && name.trim().length > 0 ? name.trim() : `Grupo ${groupCount}`;

    fabricCanvas.discardActiveObject();
    const groupObjs =
      activeObjs.length > 0
        ? activeObjs
        : [
            new FabricRect({
              left: Math.round(pageDimensions.width * 0.15),
              top: Math.round(pageDimensions.height * 0.15),
              width: 220,
              height: 140,
              fill: 'transparent',
              stroke: '#0071E3',
              strokeWidth: 1.5,
              strokeDashArray: [6, 4],
              rx: 8,
              ry: 8,
              name: '__group_anchor__',
            }),
          ];

    activeObjs.forEach((o) => fabricCanvas.remove(o));
    const group = new FabricGroup(groupObjs, { subTargetCheck: true, interactive: true });
    group.set({ name: groupName, isGroup: true, groupName });
    fabricCanvas.add(group);
    fabricCanvas.setActiveObject(group);
    fabricCanvas.requestRenderAll();
    onComplete();
  } catch (err) {
    console.warn('Erro ao criar grupo:', err);
  }
}

export function assignLayerToGroupOnCanvas(
  fabricCanvas: FabricCanvas,
  layerName: string,
  groupName: string | null,
  onComplete: () => void,
): void {
  const found = findCanvasObjectAndGroup(fabricCanvas, layerName);
  if (!found) return;
  const { target, parentGroup } = found;

  if (!groupName) {
    if (parentGroup) {
      parentGroup.remove(target);
      target.group = undefined;
      target.set('groupName', undefined);
      fabricCanvas.add(target);
      target.setCoords();
      if (
        parentGroup.getObjects().filter((o) => o.get('name') !== '__group_anchor__').length === 0
      ) {
        fabricCanvas.remove(parentGroup);
      } else {
        parentGroup.setCoords();
      }
      fabricCanvas.setActiveObject(target);
    }
  } else {
    const targetGroup = fabricCanvas
      .getObjects()
      .find((o) => o.get('name') === groupName && o instanceof FabricGroup) as
      FabricGroup | undefined;
    if (targetGroup && targetGroup !== parentGroup) {
      if (parentGroup) {
        parentGroup.remove(target);
        if (
          parentGroup.getObjects().filter((o) => o.get('name') !== '__group_anchor__').length === 0
        ) {
          fabricCanvas.remove(parentGroup);
        } else {
          parentGroup.setCoords();
        }
      } else {
        fabricCanvas.remove(target);
      }
      targetGroup.add(target);
      target.set('groupName', groupName);
      targetGroup.setCoords();
      fabricCanvas.setActiveObject(target);
    }
  }
  fabricCanvas.requestRenderAll();
  onComplete();
}

export function ungroupSelectedOnCanvas(fabricCanvas: FabricCanvas, onComplete: () => void): void {
  try {
    const active = fabricCanvas.getActiveObject();
    if (!active || !(active instanceof FabricGroup)) return;

    const objects = [...active.getObjects()];
    fabricCanvas.remove(active);

    const validObjs: FabricObject[] = [];
    objects.forEach((obj) => {
      active.remove(obj);
      obj.group = undefined;
      obj.set('groupName', undefined);
      if (obj.get('name') !== '__group_anchor__') {
        fabricCanvas.add(obj);
        obj.setCoords();
        validObjs.push(obj);
      }
    });

    if (validObjs.length > 0) {
      const sel = new ActiveSelection(validObjs, { canvas: fabricCanvas });
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
  const cleanLayer = new FabricRect({
    left: Math.round(pageDimensions.width * 0.1),
    top: Math.round(pageDimensions.height * 0.1),
    width: Math.round(pageDimensions.width * 0.8),
    height: Math.round(pageDimensions.height * 0.8),
    fill: 'transparent',
    stroke: 'transparent',
    strokeWidth: 0,
    name: name || `Camada ${count}`,
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
  const found = findCanvasObjectAndGroup(fabricCanvas, name);
  if (!found) return;
  const { target, parentGroup } = found;

  if (parentGroup) {
    parentGroup.remove(target);
    if (parentGroup.getObjects().filter((o) => o.get('name') !== '__group_anchor__').length === 0) {
      fabricCanvas.remove(parentGroup);
    } else {
      parentGroup.setCoords();
    }
  } else if (target.get('isGroup')) {
    const members = fabricCanvas.getObjects().filter((o) => o.get('groupName') === name);
    members.forEach((m) => fabricCanvas.remove(m));
    fabricCanvas.remove(target);
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

export function bringLayerForward(fabricCanvas: FabricCanvas, onCanvasChange?: () => void): void {
  const active = fabricCanvas.getActiveObject();
  if (!active) return;
  fabricCanvas.bringObjectForward(active);
  fabricCanvas.requestRenderAll();
  onCanvasChange?.();
}

export function sendLayerBackward(fabricCanvas: FabricCanvas, onCanvasChange?: () => void): void {
  const active = fabricCanvas.getActiveObject();
  if (!active) return;
  fabricCanvas.sendObjectBackwards(active);
  fabricCanvas.requestRenderAll();
  onCanvasChange?.();
}
