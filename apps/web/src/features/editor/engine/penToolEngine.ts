import type { Point2D } from '@pencel/editor-core';
import { Path as FabricPath, Point, util, type Canvas as FabricCanvas } from 'fabric';
import { createElementId } from '../../../shared/lib/idUtils.js';

export interface VectorNode {
  x: number;
  y: number;
  handleIn?: Point2D | null;
  handleOut?: Point2D | null;
}

export interface PenToolState {
  nodes: VectorNode[];
  isDraggingTangent: boolean;
  previewPointer: Point2D | null;
  hoverNearStart: boolean;
}

export function createInitialPenState(): PenToolState {
  return { nodes: [], isDraggingTangent: false, previewPointer: null, hoverNearStart: false };
}

export function nodesToSvgPathData(nodes: readonly VectorNode[], isClosed: boolean): string {
  if (nodes.length === 0 || !nodes[0]) return '';
  const first = nodes[0];
  let d = `M ${Math.round(first.x)} ${Math.round(first.y)}`;

  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1];
    const curr = nodes[i];
    if (!prev || !curr) continue;
    if (prev.handleOut || curr.handleIn) {
      const cp1 = prev.handleOut ?? { x: prev.x, y: prev.y };
      const cp2 = curr.handleIn ?? { x: curr.x, y: curr.y };
      d += ` C ${Math.round(cp1.x)} ${Math.round(cp1.y)} ${Math.round(cp2.x)} ${Math.round(cp2.y)} ${Math.round(curr.x)} ${Math.round(curr.y)}`;
    } else {
      d += ` L ${Math.round(curr.x)} ${Math.round(curr.y)}`;
    }
  }

  if (isClosed && nodes.length > 2) {
    const last = nodes[nodes.length - 1];
    if (last && (last.handleOut || first.handleIn)) {
      const cp1 = last.handleOut ?? { x: last.x, y: last.y };
      const cp2 = first.handleIn ?? { x: first.x, y: first.y };
      d += ` C ${Math.round(cp1.x)} ${Math.round(cp1.y)} ${Math.round(cp2.x)} ${Math.round(cp2.y)} ${Math.round(first.x)} ${Math.round(first.y)}`;
    }
    d += ' Z';
  }
  return d;
}

export function handlePenMouseDown(
  state: PenToolState,
  pointer: Point2D,
  snapDistance = 14,
): { finalized: boolean; isClosed: boolean } {
  if (state.nodes.length >= 3 && state.nodes[0]) {
    if (Math.hypot(pointer.x - state.nodes[0].x, pointer.y - state.nodes[0].y) <= snapDistance) {
      return { finalized: true, isClosed: true };
    }
  }
  state.nodes.push({ x: pointer.x, y: pointer.y, handleIn: null, handleOut: null });
  state.isDraggingTangent = true;
  state.previewPointer = null;
  return { finalized: false, isClosed: false };
}

export function handlePenMouseMove(state: PenToolState, pointer: Point2D, snapDistance = 14): void {
  if (state.isDraggingTangent && state.nodes.length > 0) {
    const current = state.nodes[state.nodes.length - 1];
    if (current) {
      current.handleOut = { x: pointer.x, y: pointer.y };
      current.handleIn = { x: 2 * current.x - pointer.x, y: 2 * current.y - pointer.y };
    }
    return;
  }
  state.previewPointer = pointer;
  if (state.nodes.length >= 3 && state.nodes[0]) {
    state.hoverNearStart =
      Math.hypot(pointer.x - state.nodes[0].x, pointer.y - state.nodes[0].y) <= snapDistance;
    return;
  }
  state.hoverNearStart = false;
}

export function handlePenMouseUp(state: PenToolState): void {
  state.isDraggingTangent = false;
}

export function commitPenPathToCanvas(
  fabricCanvas: FabricCanvas,
  state: PenToolState,
  isClosed: boolean,
  styling: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    strokeDashArray?: readonly number[] | null;
  },
  onComplete: () => void,
): boolean {
  if (state.nodes.length < 2) {
    state.nodes = [];
    state.previewPointer = null;
    return false;
  }

  const svgData = nodesToSvgPathData(state.nodes, isClosed);
  if (!svgData) return false;

  const path = new FabricPath(svgData, {
    fill: isClosed ? (styling.fill ?? '#0071E3') : 'transparent',
    stroke: styling.stroke ?? '#1D1D1F',
    strokeWidth: styling.strokeWidth ?? 3,
    strokeLineCap: 'round',
    strokeLineJoin: 'round',
    strokeDashArray: styling.strokeDashArray ? [...styling.strokeDashArray] : null,
    name: createElementId('vector-path'),
  });

  fabricCanvas.add(path);
  fabricCanvas.setActiveObject(path);
  state.nodes = [];
  state.previewPointer = null;
  fabricCanvas.requestRenderAll();
  onComplete();
  return true;
}

export function toScreenPoint(pt: Point2D, v?: readonly number[] | null): Point2D {
  if (!v || v.length < 6) return pt;
  return {
    x: pt.x * (v[0] ?? 1) + pt.y * (v[2] ?? 0) + (v[4] ?? 0),
    y: pt.x * (v[1] ?? 0) + pt.y * (v[3] ?? 1) + (v[5] ?? 0),
  };
}

export function renderPenToolOverlay(
  ctx: CanvasRenderingContext2D,
  state: PenToolState,
  v?: readonly number[] | null,
): void {
  if (state.nodes.length === 0) return;
  const toScr = (p: Point2D): Point2D => toScreenPoint(p, v);

  ctx.save();
  ctx.strokeStyle = '#0071E3';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const first = state.nodes[0];
  if (first) {
    const sFirst = toScr(first);
    ctx.moveTo(sFirst.x, sFirst.y);
    for (let i = 1; i < state.nodes.length; i++) {
      const prev = state.nodes[i - 1];
      const curr = state.nodes[i];
      if (!prev || !curr) continue;
      const sCurr = toScr(curr);
      if (prev.handleOut || curr.handleIn) {
        const cp1 = toScr(prev.handleOut ?? prev);
        const cp2 = toScr(curr.handleIn ?? curr);
        ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, sCurr.x, sCurr.y);
      } else {
        ctx.lineTo(sCurr.x, sCurr.y);
      }
    }
    ctx.stroke();
  }

  if (state.previewPointer && state.nodes.length > 0) {
    const last = state.nodes[state.nodes.length - 1];
    if (last) {
      const sLast = toScr(last);
      const target = state.hoverNearStart && first ? toScr(first) : toScr(state.previewPointer);
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#0071E3';
      ctx.moveTo(sLast.x, sLast.y);
      if (last.handleOut) {
        const cp1 = toScr(last.handleOut);
        ctx.bezierCurveTo(cp1.x, cp1.y, target.x, target.y, target.x, target.y);
      } else {
        ctx.lineTo(target.x, target.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  state.nodes.forEach((node, idx) => {
    const sNode = toScr(node);
    const renderHandle = (h: Point2D | null | undefined): void => {
      if (!h) return;
      const pt = toScr(h);
      ctx.strokeStyle = 'rgba(0, 113, 227, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sNode.x, sNode.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      ctx.fillStyle = '#0071E3';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    };
    renderHandle(node.handleOut);
    renderHandle(node.handleIn);

    const isStart = idx === 0;
    const isHoverStart = isStart && state.hoverNearStart;
    ctx.fillStyle = isHoverStart ? '#0071E3' : '#FFFFFF';
    ctx.strokeStyle = '#0071E3';
    ctx.lineWidth = 1.5;
    ctx.fillRect(sNode.x - 3.5, sNode.y - 3.5, 7, 7);
    ctx.strokeRect(sNode.x - 3.5, sNode.y - 3.5, 7, 7);

    if (isHoverStart) {
      ctx.beginPath();
      ctx.arc(sNode.x, sNode.y, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  ctx.restore();
}

export interface DirectSelectionHit {
  cmdIndex: number;
  part: 'anchor' | 'handle1' | 'handle2';
}

export function extractPathWorldAnchors(pathObj: FabricPath): Array<{
  cmdIndex: number;
  anchor: Point2D;
  handle1?: Point2D;
  handle2?: Point2D;
}> {
  const commands = pathObj.path as unknown as Array<[string, ...number[]]>;
  if (!commands) return [];

  const matrix = pathObj.calcTransformMatrix();
  const offset = pathObj.pathOffset;
  const results: Array<{
    cmdIndex: number;
    anchor: Point2D;
    handle1?: Point2D;
    handle2?: Point2D;
  }> = [];

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    if (!cmd) continue;
    const type = cmd[0];

    if (type === 'M' || type === 'L') {
      const local = new Point(Number(cmd[1]) - offset.x, Number(cmd[2]) - offset.y);
      const world = util.transformPoint(local, matrix);
      results.push({ cmdIndex: i, anchor: { x: world.x, y: world.y } });
    } else if (type === 'C') {
      const cp1Local = new Point(Number(cmd[1]) - offset.x, Number(cmd[2]) - offset.y);
      const cp2Local = new Point(Number(cmd[3]) - offset.x, Number(cmd[4]) - offset.y);
      const ptLocal = new Point(Number(cmd[5]) - offset.x, Number(cmd[6]) - offset.y);
      const cp1 = util.transformPoint(cp1Local, matrix);
      const cp2 = util.transformPoint(cp2Local, matrix);
      const world = util.transformPoint(ptLocal, matrix);
      results.push({
        cmdIndex: i,
        anchor: { x: world.x, y: world.y },
        handle1: { x: cp1.x, y: cp1.y },
        handle2: { x: cp2.x, y: cp2.y },
      });
    }
  }

  return results;
}

export function hitTestDirectSelection(
  pathObj: FabricPath,
  pointerWorld: Point2D,
  hitRadius = 8,
): DirectSelectionHit | null {
  const anchors = extractPathWorldAnchors(pathObj);
  for (const item of anchors) {
    if (Math.hypot(pointerWorld.x - item.anchor.x, pointerWorld.y - item.anchor.y) <= hitRadius) {
      return { cmdIndex: item.cmdIndex, part: 'anchor' };
    }
    if (
      item.handle1 &&
      Math.hypot(pointerWorld.x - item.handle1.x, pointerWorld.y - item.handle1.y) <= hitRadius
    ) {
      return { cmdIndex: item.cmdIndex, part: 'handle1' };
    }
    if (
      item.handle2 &&
      Math.hypot(pointerWorld.x - item.handle2.x, pointerWorld.y - item.handle2.y) <= hitRadius
    ) {
      return { cmdIndex: item.cmdIndex, part: 'handle2' };
    }
  }
  return null;
}

export function updateDirectSelectionHandle(
  pathObj: FabricPath,
  hit: DirectSelectionHit,
  newWorldPos: Point2D,
): void {
  const commands = pathObj.path as unknown as Array<[string, ...number[]]>;
  const cmd = commands[hit.cmdIndex];
  if (!cmd) return;

  const invMatrix = util.invertTransform(pathObj.calcTransformMatrix());
  const local = util.transformPoint(new Point(newWorldPos.x, newWorldPos.y), invMatrix);
  const targetX = local.x + pathObj.pathOffset.x;
  const targetY = local.y + pathObj.pathOffset.y;

  const type = cmd[0];
  if (type === 'M' || type === 'L') {
    cmd[1] = targetX;
    cmd[2] = targetY;
  } else if (type === 'C') {
    if (hit.part === 'handle1') {
      cmd[1] = targetX;
      cmd[2] = targetY;
    } else if (hit.part === 'handle2') {
      cmd[3] = targetX;
      cmd[4] = targetY;
    } else {
      const dx = targetX - (cmd[5] ?? targetX);
      const dy = targetY - (cmd[6] ?? targetY);
      cmd[5] = targetX;
      cmd[6] = targetY;
      if (cmd[3] !== undefined && cmd[4] !== undefined) {
        cmd[3] += dx;
        cmd[4] += dy;
      }
      const nextCmd = commands[hit.cmdIndex + 1];
      if (nextCmd && nextCmd[0] === 'C' && nextCmd[1] !== undefined && nextCmd[2] !== undefined) {
        nextCmd[1] += dx;
        nextCmd[2] += dy;
      }
    }
  }

  const dims = (
    pathObj as unknown as { _calcDimensions: () => Record<string, unknown> }
  )._calcDimensions();
  pathObj.set(dims);
  pathObj.setCoords();
}

export function renderDirectSelectionOverlay(
  ctx: CanvasRenderingContext2D,
  pathObj: FabricPath,
  activeHit: DirectSelectionHit | null,
  v?: readonly number[] | null,
): void {
  const anchors = extractPathWorldAnchors(pathObj);
  if (anchors.length === 0) return;
  const toScr = (p: Point2D): Point2D => toScreenPoint(p, v);

  ctx.save();
  for (const item of anchors) {
    const sAnchor = toScr(item.anchor);
    const drawHandle = (h: Point2D | undefined, part: 'handle1' | 'handle2'): void => {
      if (!h) return;
      const pt = toScr(h);
      ctx.strokeStyle = 'rgba(0, 113, 227, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sAnchor.x, sAnchor.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      ctx.fillStyle =
        activeHit?.cmdIndex === item.cmdIndex && activeHit.part === part ? '#0071E3' : '#FFFFFF';
      ctx.strokeStyle = '#0071E3';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };
    drawHandle(item.handle1, 'handle1');
    drawHandle(item.handle2, 'handle2');

    const isSel = activeHit?.cmdIndex === item.cmdIndex && activeHit.part === 'anchor';
    ctx.fillStyle = isSel ? '#0071E3' : '#FFFFFF';
    ctx.strokeStyle = '#0071E3';
    ctx.lineWidth = 1.5;
    ctx.fillRect(sAnchor.x - 3.5, sAnchor.y - 3.5, 7, 7);
    ctx.strokeRect(sAnchor.x - 3.5, sAnchor.y - 3.5, 7, 7);
  }
  ctx.restore();
}

export type EditorToolMode = 'select' | 'directSelect' | 'pen' | 'brush' | 'eraser';

export class VectorInteractiveController {
  public toolMode: EditorToolMode = 'select';
  public penState = createInitialPenState();
  public directHit: DirectSelectionHit | null = null;
  public isDirectDragging = false;

  public handleMouseDown(
    fabricCanvas: FabricCanvas,
    pt: Point2D,
    onFinish: (isClosed: boolean) => void,
  ): void {
    if (this.toolMode === 'pen') {
      const res = handlePenMouseDown(this.penState, pt);
      if (res.finalized) onFinish(res.isClosed);
      fabricCanvas.requestRenderAll();
    } else if (this.toolMode === 'directSelect') {
      let active = fabricCanvas.getActiveObject() as FabricPath | null;
      if (!active || active.type !== 'path') {
        const paths = fabricCanvas.getObjects().filter((o) => o.type === 'path') as FabricPath[];
        for (const p of paths) {
          const hit = hitTestDirectSelection(p, pt, 12);
          if (hit) {
            fabricCanvas.setActiveObject(p);
            active = p;
            break;
          }
        }
      }
      if (active && active.type === 'path') {
        const hit = hitTestDirectSelection(active, pt, 12);
        this.directHit = hit;
        this.isDirectDragging = Boolean(hit);
      } else {
        this.directHit = null;
      }
      fabricCanvas.requestRenderAll();
    }
  }

  public handleDoubleClick(
    fabricCanvas: FabricCanvas,
    onFinish: (isClosed: boolean) => void,
  ): void {
    if (this.toolMode === 'pen' && this.penState.nodes.length >= 2) {
      onFinish(this.penState.nodes.length >= 3);
      fabricCanvas.requestRenderAll();
    }
  }

  public handleMouseMove(fabricCanvas: FabricCanvas, pt: Point2D): void {
    if (this.toolMode === 'pen') {
      handlePenMouseMove(this.penState, pt);
      fabricCanvas.requestRenderAll();
    } else if (this.toolMode === 'directSelect' && this.isDirectDragging && this.directHit) {
      const active = fabricCanvas.getActiveObject();
      if (active && active.type === 'path') {
        updateDirectSelectionHandle(active as FabricPath, this.directHit, pt);
        fabricCanvas.requestRenderAll();
      }
    }
  }

  public handleMouseUp(fabricCanvas: FabricCanvas, onCommit: () => void): void {
    if (this.toolMode === 'pen') {
      handlePenMouseUp(this.penState);
      fabricCanvas.requestRenderAll();
    } else if (this.toolMode === 'directSelect' && this.isDirectDragging) {
      this.isDirectDragging = false;
      onCommit();
    }
  }

  public renderOverlay(ctx: CanvasRenderingContext2D, fabricCanvas: FabricCanvas): void {
    const v = fabricCanvas.viewportTransform;
    if (this.toolMode === 'pen') {
      renderPenToolOverlay(ctx, this.penState, v);
    } else if (this.toolMode === 'directSelect') {
      const active = fabricCanvas.getActiveObject();
      if (active && active.type === 'path') {
        renderDirectSelectionOverlay(ctx, active as FabricPath, this.directHit, v);
      }
    }
  }
}
