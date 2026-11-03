import { PencilBrush, type Canvas as FabricCanvas } from 'fabric';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  configureDrawingBrush,
  DrawingToolManager,
  PhotoshopBrush,
} from '../src/features/editor/engine/alignmentAndDrawingEngine.js';
import {
  EraserMask,
  transformPathCommandsToLocal,
} from '../src/features/editor/engine/viewportAndGuidesEngine.js';
import { CanvasWorkspace } from '../src/features/editor/components/CanvasWorkspace.js';
import { ContextualBrushControls } from '../src/features/editor/components/ContextualBrushControls.js';

describe('Brush Hardness & Smoothing Mechanics (Photoshop Calibrated)', () => {
  function createMockCanvas(): FabricCanvas {
    const mockBrush = new PencilBrush({} as unknown as FabricCanvas);
    const canvas = {
      isDrawingMode: false,
      freeDrawingCursor: 'default',
      freeDrawingBrush: mockBrush,
      requestRenderAll: vi.fn(),
    } as unknown as FabricCanvas;
    return canvas;
  }

  it('configures hard stroke (100% hardness) using PhotoshopBrush with no shadow falloff', () => {
    const canvas = createMockCanvas();
    const result = configureDrawingBrush(canvas, true, 'brush', '#1D1D1F', 20, 50, 100);

    expect(result).toBe('brush');
    expect(canvas.isDrawingMode).toBe(true);
    expect(canvas.freeDrawingCursor).toBe('none');

    const brush = canvas.freeDrawingBrush as PhotoshopBrush;
    expect(brush).toBeInstanceOf(PhotoshopBrush);
    expect(brush.width).toBe(20);
    expect(brush.hardness).toBe(100);
    expect(brush.smoothness).toBe(50);
    expect(brush.shadow).toBeNull();
    expect(brush.color).toBe('#1D1D1F');
  });

  it('configures soft stroke (0% hardness) with maximum blur shadow and 0% core width', () => {
    const canvas = createMockCanvas();
    configureDrawingBrush(canvas, true, 'brush', '#007AFF', 20, 50, 0);

    const brush = canvas.freeDrawingBrush as PhotoshopBrush;
    expect(brush.hardness).toBe(0);
    expect(brush.shadow).not.toBeNull();
    expect(brush.shadow?.affectStroke).toBe(true);
    expect(brush.shadow?.color).toBe('#007AFF');
    // Blur is proportional to width * (1 - hardness/100) * 0.85
    expect(brush.shadow?.blur).toBe(Math.round(20 * 1.0 * 0.85 * 10) / 10);
    // Core stroke is completely 0 for pure 0% airbrush hardness
    expect(brush.width).toBe(0);
  });

  it('configures partial hardness (50% hardness) preserving scaled core and feather halo', () => {
    const canvas = createMockCanvas();
    configureDrawingBrush(canvas, true, 'brush', '#34C759', 30, 20, 50);

    const brush = canvas.freeDrawingBrush as PhotoshopBrush;
    expect(brush.hardness).toBe(50);
    expect(brush.smoothness).toBe(20);
    expect(brush.shadow).not.toBeNull();
    expect(brush.shadow?.blur).toBe(Math.round(30 * 0.5 * 0.85 * 10) / 10);
    expect(brush.width).toBe(Math.round(30 * 0.5 * 10) / 10);
  });

  it('restores default cursor and drawing mode when disabled', () => {
    const canvas = createMockCanvas();
    configureDrawingBrush(canvas, true, 'brush', '#000000', 10, 50, 100);
    expect(canvas.isDrawingMode).toBe(true);
    expect(canvas.freeDrawingCursor).toBe('none');

    const result = configureDrawingBrush(canvas, false, 'brush', '#000000', 10, 50, 100);
    expect(result).toBe('none');
    expect(canvas.isDrawingMode).toBe(false);
    expect(canvas.freeDrawingCursor).toBe('default');
  });

  it('updates DrawingToolManager options correctly for hardness and smoothness', () => {
    const manager = new DrawingToolManager();
    const canvas = createMockCanvas();

    manager.setMode(canvas, true, 'brush', {
      color: '#FF3B30',
      width: 16,
      smoothness: 75,
      hardness: 25,
    });
    expect(manager.tool).toBe('brush');
    expect(manager.color).toBe('#FF3B30');
    expect(manager.width).toBe(16);
    expect(manager.smoothness).toBe(75);
    expect(manager.hardness).toBe(25);
    expect(manager.softness).toBe(75);

    // Test direct softness input (user mental model: 100% suavidade = 0% hardness)
    manager.setMode(canvas, true, 'brush', { softness: 100 });
    expect(manager.softness).toBe(100);
    expect(manager.hardness).toBe(0);
  });
});

describe('Brush Preview Circle & Hardness Core (CanvasWorkspace)', () => {
  it('displays the preview circle on mouse move when brush is active and hides on mouse leave', () => {
    const { container } = render(<CanvasWorkspace currentDrawingTool="brush" zoom={1} />);

    const viewport = container.querySelector('[class*="viewportScroll"]');
    expect(viewport).toBeInTheDocument();

    // Initially cursor indicator is not visible
    expect(screen.queryByTestId('brush-cursor-indicator')).not.toBeInTheDocument();

    // Mouse move enters the viewport
    fireEvent.mouseMove(viewport!, { clientX: 250, clientY: 300 });

    const indicator = screen.getByTestId('brush-cursor-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveStyle({ left: '250px', top: '300px' });

    // Mouse leave hides the preview circle
    fireEvent.mouseLeave(viewport!);
    expect(screen.queryByTestId('brush-cursor-indicator')).not.toBeInTheDocument();
  });

  it('scales the preview circle dynamically with the canvas zoom factor', () => {
    const { container } = render(<CanvasWorkspace currentDrawingTool="brush" zoom={2} />);

    const viewport = container.querySelector('[class*="viewportScroll"]');
    fireEvent.mouseMove(viewport!, { clientX: 100, clientY: 100 });

    const indicator = screen.getByTestId('brush-cursor-indicator');
    expect(indicator).toBeInTheDocument();
    // Default brush width is 8, zoom is 2 -> 8 * 2 = 16px
    expect(indicator).toHaveStyle({ width: '16px', height: '16px' });
  });
});

describe('ContextualBrushControls (Suavidade & Estabilização)', () => {
  it('renders the Suavidade slider and triggers updates', () => {
    const onHardnessChange = vi.fn();
    const onSoftnessChange = vi.fn();

    render(
      <ContextualBrushControls
        currentDrawingTool="brush"
        brushWidth={20}
        brushHardness={100}
        brushSmoothness={50}
        brushColor="#1D1D1F"
        onBrushWidthChange={vi.fn()}
        onBrushHardnessChange={onHardnessChange}
        onBrushSoftnessChange={onSoftnessChange}
        onBrushSmoothnessChange={vi.fn()}
        onBrushColorChange={vi.fn()}
        onExitDrawingMode={vi.fn()}
      />,
    );

    const suavidadeSlider = screen.getByLabelText('Suavidade da borda do pincel');
    expect(suavidadeSlider).toBeInTheDocument();
    expect(suavidadeSlider).toHaveValue('0');

    // Change to 100% Suavidade (0% Hardness)
    fireEvent.change(suavidadeSlider, { target: { value: '100' } });
    expect(onSoftnessChange).toHaveBeenCalledWith(100);
    expect(onHardnessChange).toHaveBeenCalledWith(0);
  });
});

describe('EraserMask & Non-Destructive Erasing (Photoshop Alpha Erase)', () => {
  it('instantiates EraserMask with inverted: true and preserves stroke data', () => {
    const mask = new EraserMask();
    expect(mask.inverted).toBe(true);
    expect(mask.absolutePositioned).toBe(false);
    expect(mask.strokes).toHaveLength(0);

    mask.addStroke(
      [
        ['M', 10, 10],
        ['L', 50, 50],
      ],
      16,
    );
    expect(mask.strokes).toHaveLength(1);
    expect(mask.strokes[0]?.width).toBe(16);

    const serialized = mask.toObject();
    expect(serialized.type).toBe('EraserMask');
    expect(Array.isArray(serialized.strokes)).toBe(true);
  });

  it('transforms path commands accurately to local coordinate space', () => {
    // Identity transform
    const identityMatrix: [number, number, number, number, number, number] = [1, 0, 0, 1, 0, 0];
    const commands = [
      ['M', 10, 20],
      ['Q', 30, 40, 50, 60],
      ['C', 70, 80, 90, 100, 110, 120],
      ['L', 130, 140],
      ['Z'],
    ];

    const localCommands = transformPathCommandsToLocal(commands, identityMatrix);
    expect(localCommands).toEqual(commands);
  });

  it('draws path commands on context during clipPath rendering with black stroke', () => {
    const mask = new EraserMask();
    mask.addStroke(
      [
        ['M', 10, 10],
        ['L', 50, 50],
      ],
      24,
    );

    const moveTo = vi.fn();
    const lineTo = vi.fn();
    const stroke = vi.fn();
    const beginPath = vi.fn();
    const save = vi.fn();
    const restore = vi.fn();

    const mockCtx = {
      save,
      restore,
      beginPath,
      moveTo,
      lineTo,
      stroke,
      strokeStyle: '',
      lineWidth: 0,
      lineCap: '',
      lineJoin: '',
    } as unknown as CanvasRenderingContext2D;

    mask.drawObject(mockCtx);

    expect(save).toHaveBeenCalled();
    expect(beginPath).toHaveBeenCalled();
    expect(moveTo).toHaveBeenCalledWith(10, 10);
    expect(lineTo).toHaveBeenCalledWith(50, 50);
    expect(mockCtx.strokeStyle).toBe('#000000');
    expect(mockCtx.lineWidth).toBe(24);
    expect(stroke).toHaveBeenCalled();
    expect(restore).toHaveBeenCalled();
  });
});
