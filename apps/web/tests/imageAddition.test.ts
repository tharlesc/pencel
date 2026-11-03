import { describe, expect, it, vi } from 'vitest';
import { FabricCanvasAdapter } from '../src/features/editor/engine/FabricCanvasAdapter.js';

describe('Image Addition to Artboard Canvas', () => {
  it('successfully mounts and places an image on the artboard canvas', async () => {
    const canvasEl = document.createElement('canvas');
    canvasEl.width = 1000;
    canvasEl.height = 1000;
    document.body.appendChild(canvasEl);

    const adapter = new FabricCanvasAdapter();
    const mounted = adapter.mount(
      canvasEl,
      {
        dimensions: { width: 800, height: 600 },
        displayScale: 1,
        backgroundColor: '#FFFFFF',
      },
      {
        onSelectionChange: vi.fn(),
        onCanvasChange: vi.fn(),
      },
    );

    expect(mounted).toBe(true);

    const testDataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    await adapter.addImage(testDataUrl, 'Test Photo');

    const layers = adapter.getLayers();
    expect(layers.length).toBeGreaterThan(0);
    expect(layers[0]?.name).toContain('img');

    adapter.dispose();
    canvasEl.remove();
  });
});
