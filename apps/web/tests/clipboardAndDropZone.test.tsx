import { act, render, renderHook, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CanvasStageViewport } from '../src/features/editor/components/CanvasStageViewport/CanvasStageViewport.js';
import { useCanvasDropZone } from '../src/features/editor/hooks/useCanvasDropZone.js';
import { useCanvasShortcuts } from '../src/features/editor/hooks/useCanvasShortcuts.js';
import type { UseCanvasEngineResult } from '../src/features/editor/hooks/useCanvasEngine.js';

describe('Clipboard Paste & Drag-and-Drop Image/Text Insertion', () => {
  let mockEngine: Partial<UseCanvasEngineResult>;

  beforeEach(() => {
    mockEngine = {
      addImageFromUrl: vi.fn().mockResolvedValue(undefined),
      addText: vi.fn(),
      setToolMode: vi.fn(),
      getToolMode: vi.fn().mockReturnValue('select'),
      hasInternalClipboard: vi.fn().mockReturnValue(false),
      pasteCopied: vi.fn().mockResolvedValue(true),
    };
  });

  describe('useCanvasShortcuts paste handling', () => {
    it('pastes image file from clipboard items', async () => {
      renderHook(() =>
        useCanvasShortcuts({
          engine: mockEngine as UseCanvasEngineResult,
          onSpaceStateChange: vi.fn(),
        }),
      );

      const fakeFile = new File(['fake-png-binary'], 'test-image.png', { type: 'image/png' });
      const fakeItem = {
        kind: 'file',
        type: 'image/png',
        getAsFile: () => fakeFile,
      };

      const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(pasteEvent, 'clipboardData', {
        value: {
          items: [fakeItem],
          files: [fakeFile],
          getData: vi.fn().mockReturnValue(''),
        },
      });

      // Mock FileReader
      const readAsDataUrlSpy = vi
        .spyOn(FileReader.prototype, 'readAsDataURL')
        .mockImplementation(function (this: FileReader) {
          Object.defineProperty(this, 'result', {
            value: 'data:image/png;base64,TEST_DATA_URL',
          });
          this.onload?.({} as ProgressEvent<FileReader>);
        });

      window.dispatchEvent(pasteEvent);

      expect(pasteEvent.defaultPrevented).toBe(true);
      expect(mockEngine.addImageFromUrl).toHaveBeenCalledWith(
        'data:image/png;base64,TEST_DATA_URL',
        'test-image',
      );

      readAsDataUrlSpy.mockRestore();
    });

    it('pastes plain text as a text layer on the canvas', () => {
      renderHook(() =>
        useCanvasShortcuts({
          engine: mockEngine as UseCanvasEngineResult,
          onSpaceStateChange: vi.fn(),
        }),
      );

      const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(pasteEvent, 'clipboardData', {
        value: {
          items: [],
          files: [],
          getData: vi.fn((format: string) =>
            format === 'text/plain' ? 'Texto de Exemplo Colado' : '',
          ),
        },
      });

      window.dispatchEvent(pasteEvent);

      expect(pasteEvent.defaultPrevented).toBe(true);
      expect(mockEngine.addText).toHaveBeenCalledWith({
        text: 'Texto de Exemplo Colado',
        fontSize: 36,
      });
    });

    it('pastes SVG markup as vector image instead of plain text', () => {
      renderHook(() =>
        useCanvasShortcuts({
          engine: mockEngine as UseCanvasEngineResult,
          onSpaceStateChange: vi.fn(),
        }),
      );

      const svgMarkup = '<svg width="100" height="100"><circle cx="50" cy="50" r="40" /></svg>';
      const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(pasteEvent, 'clipboardData', {
        value: {
          items: [],
          files: [],
          getData: vi.fn((format: string) => (format === 'text/plain' ? svgMarkup : '')),
        },
      });

      window.dispatchEvent(pasteEvent);

      expect(pasteEvent.defaultPrevented).toBe(true);
      expect(mockEngine.addImageFromUrl).toHaveBeenCalledWith(
        expect.stringContaining('data:image/svg+xml'),
        'Vetor SVG',
      );
    });

    it('pastes HTML img tag source when copied from external websites', () => {
      renderHook(() =>
        useCanvasShortcuts({
          engine: mockEngine as UseCanvasEngineResult,
          onSpaceStateChange: vi.fn(),
        }),
      );

      const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(pasteEvent, 'clipboardData', {
        value: {
          items: [],
          files: [],
          getData: vi.fn((format: string) =>
            format === 'text/html' ? '<img src="https://images.unsplash.com/photo-123.jpg" />' : '',
          ),
        },
      });

      window.dispatchEvent(pasteEvent);

      expect(pasteEvent.defaultPrevented).toBe(true);
      expect(mockEngine.addImageFromUrl).toHaveBeenCalledWith(
        'https://images.unsplash.com/photo-123.jpg',
        'Imagem Colada',
      );
    });

    it('does not intercept paste when typing inside form input or textarea', () => {
      renderHook(() =>
        useCanvasShortcuts({
          engine: mockEngine as UseCanvasEngineResult,
          onSpaceStateChange: vi.fn(),
        }),
      );

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(pasteEvent, 'target', { value: input });
      Object.defineProperty(pasteEvent, 'clipboardData', {
        value: {
          items: [],
          files: [],
          getData: vi.fn((format: string) => (format === 'text/plain' ? 'Ignored Text' : '')),
        },
      });

      window.dispatchEvent(pasteEvent);

      expect(pasteEvent.defaultPrevented).toBe(false);
      expect(mockEngine.addText).not.toHaveBeenCalled();

      input.remove();
    });

    it('pastes image onto canvas even when Fabric hidden textarea is focused', () => {
      renderHook(() =>
        useCanvasShortcuts({
          engine: mockEngine as UseCanvasEngineResult,
          onSpaceStateChange: vi.fn(),
        }),
      );

      const fabricTextarea = document.createElement('textarea');
      fabricTextarea.setAttribute('data-fabric', 'textarea');
      document.body.appendChild(fabricTextarea);

      const fakeFile = new File(['fake-jpg'], 'banner.jpg', { type: 'image/jpeg' });
      const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(pasteEvent, 'target', { value: fabricTextarea });
      Object.defineProperty(pasteEvent, 'clipboardData', {
        value: {
          items: [
            {
              kind: 'file',
              type: 'image/jpeg',
              getAsFile: () => fakeFile,
            },
          ],
          files: [fakeFile],
          getData: vi.fn().mockReturnValue(''),
        },
      });

      const readAsDataUrlSpy = vi
        .spyOn(FileReader.prototype, 'readAsDataURL')
        .mockImplementation(function (this: FileReader) {
          Object.defineProperty(this, 'result', {
            value: 'data:image/jpeg;base64,BANNER_DATA',
          });
          this.onload?.({} as ProgressEvent<FileReader>);
        });

      window.dispatchEvent(pasteEvent);

      expect(pasteEvent.defaultPrevented).toBe(true);
      expect(mockEngine.addImageFromUrl).toHaveBeenCalledWith(
        'data:image/jpeg;base64,BANNER_DATA',
        'banner',
      );

      readAsDataUrlSpy.mockRestore();
      fabricTextarea.remove();
    });
  });

  describe('useCanvasDropZone drag-and-drop handling', () => {
    it('manages drag counter and toggles isDragOver without flickering', () => {
      const artboardDiv = document.createElement('div');
      const artboardRef = { current: artboardDiv };

      const { result } = renderHook(() =>
        useCanvasDropZone({
          engine: mockEngine as UseCanvasEngineResult,
          artboardRef,
          zoom: 1,
        }),
      );

      expect(result.current.isDragOver).toBe(false);

      const fakeDragEnterEvent = {
        preventDefault: vi.fn(),
        dataTransfer: { types: ['Files'] },
      } as unknown as React.DragEvent<HTMLDivElement>;

      act(() => {
        result.current.handleDragEnter(fakeDragEnterEvent);
      });
      expect(result.current.isDragOver).toBe(true);

      const fakeDragLeaveEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.DragEvent<HTMLDivElement>;

      act(() => {
        result.current.handleDragLeave(fakeDragLeaveEvent);
      });
      expect(result.current.isDragOver).toBe(false);
    });

    it('processes dropped image files and computes position relative to artboard', async () => {
      const artboardDiv = document.createElement('div');
      vi.spyOn(artboardDiv, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        top: 200,
        width: 800,
        height: 600,
        bottom: 800,
        right: 900,
        x: 100,
        y: 200,
        toJSON: () => {},
      });
      const artboardRef = { current: artboardDiv };

      const { result } = renderHook(() =>
        useCanvasDropZone({
          engine: mockEngine as UseCanvasEngineResult,
          artboardRef,
          zoom: 2,
        }),
      );

      const fakeFile = new File(['fake-data'], 'foto-perfil.webp', { type: 'image/webp' });
      const readAsDataUrlSpy = vi
        .spyOn(FileReader.prototype, 'readAsDataURL')
        .mockImplementation(function (this: FileReader) {
          Object.defineProperty(this, 'result', {
            value: 'data:image/webp;base64,WEBP_DATA',
          });
          this.onload?.({} as ProgressEvent<FileReader>);
        });

      const fakeDropEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        clientX: 300, // (300 - 100) / 2 = 100 artboard X
        clientY: 500, // (500 - 200) / 2 = 150 artboard Y
        dataTransfer: {
          files: [fakeFile],
          items: [],
          getData: vi.fn().mockReturnValue(''),
        },
      } as unknown as React.DragEvent<HTMLDivElement>;

      await act(async () => {
        await result.current.handleDrop(fakeDropEvent);
      });

      expect(mockEngine.addImageFromUrl).toHaveBeenCalledWith(
        'data:image/webp;base64,WEBP_DATA',
        'foto-perfil',
        undefined,
        { x: 100, y: 150 },
      );

      readAsDataUrlSpy.mockRestore();
    });

    it('handles dropped text as a text layer at drop position', async () => {
      const artboardDiv = document.createElement('div');
      vi.spyOn(artboardDiv, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 1000,
        height: 1000,
        bottom: 1000,
        right: 1000,
        x: 0,
        y: 0,
        toJSON: () => {},
      });
      const artboardRef = { current: artboardDiv };

      const { result } = renderHook(() =>
        useCanvasDropZone({
          engine: mockEngine as UseCanvasEngineResult,
          artboardRef,
          zoom: 1,
        }),
      );

      const fakeDropEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        clientX: 450,
        clientY: 300,
        dataTransfer: {
          files: [],
          items: [],
          getData: vi.fn((format: string) => (format === 'text/plain' ? 'Texto Arrastado' : '')),
        },
      } as unknown as React.DragEvent<HTMLDivElement>;

      await act(async () => {
        await result.current.handleDrop(fakeDropEvent);
      });

      expect(mockEngine.addText).toHaveBeenCalledWith({
        text: 'Texto Arrastado',
        fontSize: 36,
        position: { x: 450, y: 300 },
      });
    });
  });

  describe('CanvasStageViewport drop overlay UI', () => {
    it('renders the drop zone badge when isDragOver is true', () => {
      const viewportRef = { current: null };
      const artboardRef = { current: null };
      const canvasRef = { current: null };

      render(
        <CanvasStageViewport
          viewportRef={viewportRef}
          artboardRef={artboardRef}
          canvasRef={canvasRef}
          isPanning={false}
          isSpaceDown={false}
          isDrawing={false}
          brushCursor={null}
          displayWidth={800}
          displayHeight={600}
          zoom={1}
          pan={{ x: 0, y: 0 }}
          clipArtboard={true}
          backgroundColor="#FFFFFF"
          pageDimensions={{ width: 800, height: 600 }}
          activeBrushWidth={8}
          activeBrushHardness={100}
          handleMouseDown={vi.fn()}
          handleViewportMouseMove={vi.fn()}
          setBrushCursor={vi.fn()}
          handleViewportMouseLeave={vi.fn()}
          showGuides={false}
          guides={[]}
          activeGuideDrag={null}
          artboardOrigin={{ x: 0, y: 0 }}
          handleStartDragExistingGuide={vi.fn()}
          handleDeleteGuide={vi.fn()}
          showRulers={false}
          viewportDimensions={{ width: 800, height: 600 }}
          mousePos={null}
          handleStartCreateGuide={vi.fn()}
          handleResetOrigin={vi.fn()}
          isDragOver={true}
        />,
      );

      const overlay = screen.getByTestId('canvas-drop-zone-overlay');
      expect(overlay).toBeInTheDocument();
      expect(screen.getByText('Solte a imagem para adicionar ao canvas')).toBeInTheDocument();
    });
  });
});
