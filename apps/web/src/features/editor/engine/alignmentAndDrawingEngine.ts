import type { Dimensions } from '@pencel/shared-types';
import { ActiveSelection, PencilBrush, type Canvas as FabricCanvas } from 'fabric';

export function configureDrawingBrush(
  fabricCanvas: FabricCanvas,
  enabled: boolean,
  mode: 'brush' | 'eraser',
  color: string,
  width: number,
): 'none' | 'brush' | 'eraser' {
  if (!enabled) {
    fabricCanvas.isDrawingMode = false;
    fabricCanvas.requestRenderAll();
    return 'none';
  }

  fabricCanvas.isDrawingMode = true;
  const brush = new PencilBrush(fabricCanvas);
  brush.width = width;
  brush.color = mode === 'eraser' ? 'rgba(0,0,0,1)' : color;
  fabricCanvas.freeDrawingBrush = brush;
  return mode;
}

export function alignSelectedObjects(
  fabricCanvas: FabricCanvas,
  pageDimensions: Dimensions,
  alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom',
  onComplete: () => void,
): void {
  const active = fabricCanvas.getActiveObject();
  if (!active) return;

  const artboardW = pageDimensions.width;
  const artboardH = pageDimensions.height;

  if (active.type === 'activeselection') {
    const activeSel = active as ActiveSelection;
    const objects = [...activeSel.getObjects()];
    if (objects.length < 2) return;

    const selBounds = activeSel.getBoundingRect();
    fabricCanvas.discardActiveObject();

    switch (alignment) {
      case 'left':
        objects.forEach((obj) => {
          const objBounds = obj.getBoundingRect();
          obj.set('left', (obj.left || 0) - (objBounds.left - selBounds.left));
          obj.setCoords();
        });
        break;
      case 'center':
        objects.forEach((obj) => {
          const objBounds = obj.getBoundingRect();
          const targetCenter = selBounds.left + selBounds.width / 2;
          const currentCenter = objBounds.left + objBounds.width / 2;
          obj.set('left', (obj.left || 0) + (targetCenter - currentCenter));
          obj.setCoords();
        });
        break;
      case 'right':
        objects.forEach((obj) => {
          const objBounds = obj.getBoundingRect();
          const targetRight = selBounds.left + selBounds.width;
          const currentRight = objBounds.left + objBounds.width;
          obj.set('left', (obj.left || 0) + (targetRight - currentRight));
          obj.setCoords();
        });
        break;
      case 'top':
        objects.forEach((obj) => {
          const objBounds = obj.getBoundingRect();
          obj.set('top', (obj.top || 0) - (objBounds.top - selBounds.top));
          obj.setCoords();
        });
        break;
      case 'middle':
        objects.forEach((obj) => {
          const objBounds = obj.getBoundingRect();
          const targetMiddle = selBounds.top + selBounds.height / 2;
          const currentMiddle = objBounds.top + objBounds.height / 2;
          obj.set('top', (obj.top || 0) + (targetMiddle - currentMiddle));
          obj.setCoords();
        });
        break;
      case 'bottom':
        objects.forEach((obj) => {
          const objBounds = obj.getBoundingRect();
          const targetBottom = selBounds.top + selBounds.height;
          const currentBottom = objBounds.top + objBounds.height;
          obj.set('top', (obj.top || 0) + (targetBottom - currentBottom));
          obj.setCoords();
        });
        break;
    }

    const newSelection = new ActiveSelection(objects, { canvas: fabricCanvas });
    fabricCanvas.setActiveObject(newSelection);
  } else {
    const objW = (active.width || 0) * (active.scaleX || 1);
    const objH = (active.height || 0) * (active.scaleY || 1);

    switch (alignment) {
      case 'left':
        active.set('left', 0);
        break;
      case 'center':
        active.set('left', Math.round((artboardW - objW) / 2));
        break;
      case 'right':
        active.set('left', Math.round(artboardW - objW));
        break;
      case 'top':
        active.set('top', 0);
        break;
      case 'middle':
        active.set('top', Math.round((artboardH - objH) / 2));
        break;
      case 'bottom':
        active.set('top', Math.round(artboardH - objH));
        break;
    }
    active.setCoords();
  }

  fabricCanvas.requestRenderAll();
  onComplete();
}

export function distributeSelectedObjects(
  fabricCanvas: FabricCanvas,
  direction: 'horizontal' | 'vertical',
  onComplete: () => void,
): void {
  const active = fabricCanvas.getActiveObject();
  if (!active || active.type !== 'activeselection') return;

  const activeSel = active as ActiveSelection;
  const objects = [...activeSel.getObjects()];
  if (objects.length < 3) return;

  fabricCanvas.discardActiveObject();

  if (direction === 'horizontal') {
    objects.sort((a, b) => a.getBoundingRect().left - b.getBoundingRect().left);
    const first = objects[0]!.getBoundingRect();
    const last = objects[objects.length - 1]!.getBoundingRect();
    const totalSpan = last.left + last.width - first.left;
    const totalObjWidth = objects.reduce((sum, o) => sum + o.getBoundingRect().width, 0);
    const space = (totalSpan - totalObjWidth) / (objects.length - 1);

    let currentX = first.left;
    objects.forEach((obj) => {
      const b = obj.getBoundingRect();
      const dx = currentX - b.left;
      obj.set('left', (obj.left || 0) + dx);
      obj.setCoords();
      currentX += b.width + space;
    });
  } else {
    objects.sort((a, b) => a.getBoundingRect().top - b.getBoundingRect().top);
    const first = objects[0]!.getBoundingRect();
    const last = objects[objects.length - 1]!.getBoundingRect();
    const totalSpan = last.top + last.height - first.top;
    const totalObjHeight = objects.reduce((sum, o) => sum + o.getBoundingRect().height, 0);
    const space = (totalSpan - totalObjHeight) / (objects.length - 1);

    let currentY = first.top;
    objects.forEach((obj) => {
      const b = obj.getBoundingRect();
      const dy = currentY - b.top;
      obj.set('top', (obj.top || 0) + dy);
      obj.setCoords();
      currentY += b.height + space;
    });
  }

  const newSelection = new ActiveSelection(objects, { canvas: fabricCanvas });
  fabricCanvas.setActiveObject(newSelection);
  fabricCanvas.requestRenderAll();
  onComplete();
}
