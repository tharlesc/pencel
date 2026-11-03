import { describe, expect, it } from 'vitest';
import {
  createInitialPenState,
  handlePenMouseDown,
  handlePenMouseMove,
  handlePenMouseUp,
  nodesToSvgPathData,
  VectorInteractiveController,
  type VectorNode,
} from '../src/features/editor/engine/penToolEngine.js';

describe('Pen Tool & Vector Engine (Illustrator Mechanics)', () => {
  it('generates clean linear SVG path data when nodes have no tangent handles', () => {
    const nodes: VectorNode[] = [
      { x: 10, y: 10 },
      { x: 50, y: 10 },
      { x: 50, y: 50 },
    ];
    const openSvg = nodesToSvgPathData(nodes, false);
    expect(openSvg).toBe('M 10 10 L 50 10 L 50 50');

    const closedSvg = nodesToSvgPathData(nodes, true);
    expect(closedSvg).toBe('M 10 10 L 50 10 L 50 50 Z');
  });

  it('generates cubic Bézier curves (C commands) when nodes have tangent handles', () => {
    const nodes: VectorNode[] = [
      { x: 10, y: 10, handleOut: { x: 20, y: 5 } },
      { x: 100, y: 10, handleIn: { x: 80, y: 5 } },
    ];
    const bezierSvg = nodesToSvgPathData(nodes, false);
    expect(bezierSvg).toBe('M 10 10 C 20 5 80 5 100 10');
  });

  it('handles interactive Pen anchor placement and path closing', () => {
    const state = createInitialPenState();
    expect(state.nodes).toHaveLength(0);

    // Place Node 0
    const step1 = handlePenMouseDown(state, { x: 100, y: 100 });
    expect(step1.finalized).toBe(false);
    expect(state.nodes).toHaveLength(1);
    expect(state.isDraggingTangent).toBe(true);

    // Drag handle for Node 0
    handlePenMouseMove(state, { x: 120, y: 80 });
    expect(state.nodes[0]?.handleOut).toEqual({ x: 120, y: 80 });
    expect(state.nodes[0]?.handleIn).toEqual({ x: 80, y: 120 });

    handlePenMouseUp(state);
    expect(state.isDraggingTangent).toBe(false);

    // Place Node 1
    handlePenMouseDown(state, { x: 200, y: 100 });
    handlePenMouseUp(state);
    expect(state.nodes).toHaveLength(2);

    // Place Node 2
    handlePenMouseDown(state, { x: 150, y: 200 });
    handlePenMouseUp(state);
    expect(state.nodes).toHaveLength(3);

    // Click near start node (within snap distance <= 14px)
    const closeStep = handlePenMouseDown(state, { x: 104, y: 102 }, 14);
    expect(closeStep.finalized).toBe(true);
    expect(closeStep.isClosed).toBe(true);
  });

  it('VectorInteractiveController supports all tool modes', () => {
    const controller = new VectorInteractiveController();
    expect(controller.toolMode).toBe('select');

    controller.toolMode = 'pen';
    expect(controller.toolMode).toBe('pen');

    controller.toolMode = 'directSelect';
    expect(controller.toolMode).toBe('directSelect');

    controller.toolMode = 'brush';
    expect(controller.toolMode).toBe('brush');

    controller.toolMode = 'eraser';
    expect(controller.toolMode).toBe('eraser');
  });
});
