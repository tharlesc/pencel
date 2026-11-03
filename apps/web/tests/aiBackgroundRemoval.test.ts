import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SEGMENTATION_MODEL,
  getBackgroundRemovalPipeline,
  removeBackgroundWithAi,
  resetBackgroundRemovalPipeline,
  type AiRemovalProgress,
} from '../src/features/editor/services/aiBackgroundRemovalService.js';

const mockPipelineFactory = vi.fn();

vi.mock('@huggingface/transformers', () => ({
  pipeline: (...args: unknown[]) => mockPipelineFactory(...args),
  env: {
    allowLocalModels: true,
    useBrowserCache: false,
  },
}));

describe('aiBackgroundRemovalService (Solution B - RMBG-1.4)', () => {
  beforeEach(() => {
    resetBackgroundRemovalPipeline();
    mockPipelineFactory.mockReset();
  });

  it('declares the briaai/RMBG-1.4 model as the default neural segmentation model', () => {
    expect(DEFAULT_SEGMENTATION_MODEL).toBe('briaai/RMBG-1.4');
  });

  it('successfully segments foreground and returns a base64 PNG data URL', async () => {
    const fakeRawImage = {
      clone: () => ({
        rgba: () => ({
          width: 2,
          height: 2,
          data: new Uint8ClampedArray([
            255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255,
          ]),
        }),
      }),
    };

    const mockPipelineFn = vi.fn().mockResolvedValue(fakeRawImage);
    mockPipelineFactory.mockResolvedValue(mockPipelineFn);

    const progressReports: AiRemovalProgress[] = [];
    const result = await removeBackgroundWithAi('data:image/png;base64,fakeInput', (progress) => {
      progressReports.push(progress);
    });

    expect(result.success).toBe(true);
    expect(result.imageBase64).toBeDefined();
    expect(result.imageBase64).toContain('data:image/png;base64,');
    expect(result.message).toContain('RMBG-1.4');

    expect(progressReports.some((p) => p.status === 'processing')).toBe(true);
    expect(progressReports.some((p) => p.status === 'done')).toBe(true);
  });

  it('handles inference failure gracefully by returning fallbackUsed=true without throwing', async () => {
    const mockFailingPipelineFn = vi.fn().mockRejectedValue(new Error('Out of WebGPU memory'));
    mockPipelineFactory.mockResolvedValue(mockFailingPipelineFn);

    const progressReports: AiRemovalProgress[] = [];
    const result = await removeBackgroundWithAi('data:image/png;base64,sample', (progress) => {
      progressReports.push(progress);
    });

    expect(result.success).toBe(false);
    expect(result.fallbackUsed).toBe(true);
    expect(result.message).toContain('Out of WebGPU memory');
    expect(progressReports.some((p) => p.status === 'error')).toBe(true);
  });

  it('resets cached pipeline when resetBackgroundRemovalPipeline is invoked', async () => {
    const mockPipelineFn1 = vi.fn().mockResolvedValue({});
    const mockPipelineFn2 = vi.fn().mockResolvedValue({});

    let callCount = 0;
    mockPipelineFactory.mockImplementation(() => {
      callCount++;
      return Promise.resolve(callCount === 1 ? mockPipelineFn1 : mockPipelineFn2);
    });

    const pipe1 = await getBackgroundRemovalPipeline();
    const pipe2 = await getBackgroundRemovalPipeline();
    expect(pipe1).toBe(pipe2);

    resetBackgroundRemovalPipeline();
    const pipe3 = await getBackgroundRemovalPipeline();
    expect(pipe3).toBe(mockPipelineFn2);
  });
});
