// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  VECTORIZE_PRESETS,
  resolveVectorizeConfig,
  terminateVTracer,
  vectorizeImageData,
} from '../src/features/editor/services/vtracerService.js';
import {
  applyVectorizedSvgToCanvas,
  getActiveImageForVectorize,
  stripSvgBackground,
  type TargetImageMetadata,
} from '../src/features/editor/engine/vectorTraceEngine.js';
import { exportCanvasDataUrl } from '../src/features/editor/engine/historyAndPageEngine.js';
import type { Canvas as FabricCanvas, FabricObject } from 'fabric';

const mockConvertPixels = vi.fn();
const mockTerminate = vi.fn();

vi.mock('vtracer-browser', () => ({
  createVTracer: () => ({
    convert: vi.fn(),
    convertPixels: mockConvertPixels,
    terminate: mockTerminate,
  }),
}));

describe('vtracerService (Image Vectorization via WebAssembly)', () => {
  beforeEach(() => {
    terminateVTracer();
    mockConvertPixels.mockReset();
    mockTerminate.mockReset();
  });

  it('defines the 4 intelligent presets matching ADR 0029', () => {
    expect(VECTORIZE_PRESETS.logo).toBeDefined();
    expect(VECTORIZE_PRESETS.logo.options.preset).toBe('poster');
    expect(VECTORIZE_PRESETS.logo.options.mode).toBe('spline');

    expect(VECTORIZE_PRESETS.silhouette).toBeDefined();
    expect(VECTORIZE_PRESETS.silhouette.options.clustering).toBe('binary');
    expect(VECTORIZE_PRESETS.silhouette.options.binaryThreshold).toBe(128);

    expect(VECTORIZE_PRESETS['high-fidelity']).toBeDefined();
    expect(VECTORIZE_PRESETS['high-fidelity'].options.preset).toBe('photo');
    expect(VECTORIZE_PRESETS['high-fidelity'].options.colorPrecision).toBe(7);

    expect(VECTORIZE_PRESETS.geometric).toBeDefined();
    expect(VECTORIZE_PRESETS.geometric.options.mode).toBe('polygon');
  });

  it('merges preset options with custom user overrides', () => {
    const config = resolveVectorizeConfig('logo', {
      filterSpeckle: 16,
      colorPrecision: 4,
    });

    expect(config.preset).toBe('poster');
    expect(config.mode).toBe('spline');
    expect(config.filterSpeckle).toBe(16);
    expect(config.colorPrecision).toBe(4);
  });

  it('successfully converts ImageData pixels to SVG string via mock worker', async () => {
    const fakeSvg = '<svg viewBox="0 0 10 10"><path d="M0,0 L10,10" fill="#000"/></svg>';
    mockConvertPixels.mockResolvedValue(fakeSvg);

    const dummyData = {
      data: new Uint8ClampedArray(16),
      width: 2,
      height: 2,
      colorSpace: 'srgb',
    } as unknown as ImageData;
    const result = await vectorizeImageData(dummyData, {
      preset: 'logo',
    });

    expect(result.success).toBe(true);
    expect(result.svgString).toBe(fakeSvg);
    expect(mockConvertPixels).toHaveBeenCalledTimes(1);
  });

  it('handles worker errors gracefully without throwing unhandled rejections', async () => {
    mockConvertPixels.mockRejectedValue(new Error('Out of WebAssembly memory'));

    const dummyData = {
      data: new Uint8ClampedArray(16),
      width: 2,
      height: 2,
      colorSpace: 'srgb',
    } as unknown as ImageData;
    const result = await vectorizeImageData(dummyData, {
      preset: 'silhouette',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Out of WebAssembly memory');
  });
});

describe('vectorTraceEngine (Canvas Stage Integration)', () => {
  it('returns null when active canvas object is not an image', () => {
    const fakeCanvas = {
      getActiveObject: () => ({ type: 'rect' }),
    } as unknown as FabricCanvas;

    const result = getActiveImageForVectorize(fakeCanvas);
    expect(result).toBeNull();
  });

  it('extracts target image coordinates and dimensions when active object is an image', () => {
    const fakeImageObj = {
      type: 'image',
      left: 100,
      top: 150,
      width: 400,
      height: 300,
      scaleX: 1.5,
      scaleY: 1.5,
      angle: 45,
      flipX: false,
      flipY: false,
      getSrc: () => 'data:image/png;base64,sample',
    } as unknown as FabricObject;

    const fakeCanvas = {
      getActiveObject: () => fakeImageObj,
    } as unknown as FabricCanvas;

    const result = getActiveImageForVectorize(fakeCanvas);
    expect(result).not.toBeNull();
    expect(result?.left).toBe(100);
    expect(result?.top).toBe(150);
    expect(result?.width).toBe(400);
    expect(result?.src).toBe('data:image/png;base64,sample');
  });

  it('applies vectorized SVG in replace mode removing original and adding vector group', async () => {
    const removedObjects: FabricObject[] = [];
    const addedObjects: FabricObject[] = [];
    let activeObject: FabricObject | null = null;
    let rendered = false;
    let completed = false;

    const fakeImageObj = { type: 'image' } as FabricObject;

    const fakeCanvas = {
      remove: (obj: FabricObject) => removedObjects.push(obj),
      add: (obj: FabricObject) => addedObjects.push(obj),
      setActiveObject: (obj: FabricObject) => {
        activeObject = obj;
      },
      requestRenderAll: () => {
        rendered = true;
      },
    } as unknown as FabricCanvas;

    const target: TargetImageMetadata = {
      object: fakeImageObj,
      src: 'fake-src',
      left: 50,
      top: 60,
      width: 200,
      height: 100,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      flipX: false,
      flipY: false,
    };

    const validSvg =
      '<svg width="200" height="100"><rect x="0" y="0" width="200" height="100" fill="blue"/></svg>';

    const res = await applyVectorizedSvgToCanvas(fakeCanvas, target, validSvg, 'replace', () => {
      completed = true;
    });

    expect(res.success).toBe(true);
    expect(removedObjects).toContain(fakeImageObj);
    expect(addedObjects.length).toBe(1);
    expect(activeObject).toBe(addedObjects[0]);
    expect(rendered).toBe(true);
    expect(completed).toBe(true);
  });

  it('strips background bounding rectangle when removeBackground is true', () => {
    const svgWithBackground = `
      <svg viewBox="0 0 100 100" width="100" height="100">
        <rect width="100" height="100" fill="#ffffff" />
        <path d="M10 10 L50 50 L10 50 Z" fill="#000000" />
      </svg>
    `;

    const cleaned = stripSvgBackground(svgWithBackground);
    expect(cleaned).not.toContain('<rect width="100" height="100" fill="#ffffff"');
    expect(cleaned).toContain('path');
  });

  it('exports canvas at full native resolution with transparent background support', () => {
    let rendered = false;
    let setDimensionsCalled = false;
    let setViewportTransformCalled = false;

    const fakeFabricCanvas = {
      viewportTransform: [0.5, 0, 0, 0.5, 100, 100],
      getWidth: () => 600,
      getHeight: () => 600,
      getActiveObject: () => null,
      discardActiveObject: vi.fn(),
      setActiveObject: vi.fn(),
      setDimensions: () => {
        setDimensionsCalled = true;
      },
      setViewportTransform: () => {
        setViewportTransformCalled = true;
      },
      renderAll: () => {
        rendered = true;
      },
      requestRenderAll: vi.fn(),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mocked-hires-png'),
      lowerCanvasEl: document.createElement('canvas'),
    } as unknown as FabricCanvas;

    const result = exportCanvasDataUrl(
      fakeFabricCanvas,
      { width: 1080, height: 1080 },
      '#ffffff',
      0.5,
      1200,
      'png',
      0.95,
      undefined,
      2, // 2x Retina
      true, // transparentBackground
    );

    expect(result).toBe('data:image/png;base64,mocked-hires-png');
    expect(setDimensionsCalled).toBe(true);
    expect(setViewportTransformCalled).toBe(true);
    expect(rendered).toBe(true);
  });
});
