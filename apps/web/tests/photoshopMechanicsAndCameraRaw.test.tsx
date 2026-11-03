// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import {
  Canvas as FabricCanvas,
  FabricImage,
  Group as FabricGroup,
  Rect as FabricRect,
} from 'fabric';
import { describe, expect, it, vi } from 'vitest';
import { CameraRawModal } from '../src/features/editor/components/CameraRawModal.js';
import { GuideLayoutModal } from '../src/features/editor/components/GuideLayoutModal.js';
import { CameraRawPanel } from '../src/features/editor/components/sidebar/CameraRawPanel.js';
import {
  EditorEngineContext,
  EditorSelectionContext,
  type EditorSelectionContextValue,
} from '../src/features/editor/state/editorContexts.js';
import {
  DEFAULT_CAMERA_RAW_ADJUSTMENTS,
  applyCameraRawToImage,
  getCameraRawAdjustments,
  resetCameraRawAdjustments,
} from '../src/features/editor/engine/cameraRawEngine.js';
import {
  computeSlicesFromGuides,
  generateGuideLayout,
} from '../src/features/editor/engine/guideLayoutEngine.js';
import {
  assignLayerToGroupOnCanvas,
  findCanvasObjectAndGroup,
} from '../src/features/editor/engine/layerAndGroupEngine.js';

describe('Photoshop Mechanics & Camera Raw Filter Engine', () => {
  describe('CameraRawModal (Apple Pro Studio Grading Dialog)', () => {
    it('renders sliders for lighting, color, and effects with accessible labels', () => {
      const handleApply = vi.fn();
      const handleLivePreview = vi.fn();
      const handleClose = vi.fn();

      render(
        <CameraRawModal
          isOpen={true}
          initialAdjustments={{
            ...DEFAULT_CAMERA_RAW_ADJUSTMENTS,
            exposure: 20,
            temperature: 15,
          }}
          onApply={handleApply}
          onLivePreview={handleLivePreview}
          onClose={handleClose}
        />,
      );

      const title = screen.getByRole('heading', { name: /Filtro Camera Raw/i });
      expect(title).toBeInTheDocument();

      const exposureSlider = screen.getByLabelText(/Ajustar exposição/i);
      expect(exposureSlider).toHaveValue('20');

      fireEvent.change(exposureSlider, { target: { value: '45' } });
      expect(handleLivePreview).toHaveBeenCalledWith(expect.objectContaining({ exposure: 45 }));

      const applyBtn = screen.getByRole('button', { name: /Aplicar Filtro/i });
      fireEvent.click(applyBtn);
      expect(handleApply).toHaveBeenCalledWith(expect.objectContaining({ exposure: 45 }));
      expect(handleClose).toHaveBeenCalled();
    });

    it('resets sliders to default when clicking Redefinir Padrões', () => {
      const handleLivePreview = vi.fn();
      render(
        <CameraRawModal
          isOpen={true}
          initialAdjustments={{
            ...DEFAULT_CAMERA_RAW_ADJUSTMENTS,
            contrast: 50,
            saturation: -30,
          }}
          onApply={vi.fn()}
          onLivePreview={handleLivePreview}
          onClose={vi.fn()}
        />,
      );

      const resetBtn = screen.getByRole('button', { name: /Redefinir Padrões/i });
      fireEvent.click(resetBtn);
      expect(handleLivePreview).toHaveBeenCalledWith(DEFAULT_CAMERA_RAW_ADJUSTMENTS);
    });
  });

  describe('CameraRawPanel (Sidebar Tab)', () => {
    it('shows empty state when no image is selected', () => {
      render(<CameraRawPanel />);
      expect(screen.getByText(/Nenhuma imagem selecionada/i)).toBeInTheDocument();
    });

    it('renders Luz, Cor, and Efeitos sections when an image is selected', () => {
      const mockApplyCameraRaw = vi.fn();
      const mockEngine = {
        applyCameraRaw: mockApplyCameraRaw,
        getCameraRaw: vi.fn().mockReturnValue(DEFAULT_CAMERA_RAW_ADJUSTMENTS),
      } as unknown as Parameters<typeof EditorEngineContext.Provider>[0]['value'];

      const mockSelection: EditorSelectionContextValue = {
        selectedObject: {
          id: 'img1',
          type: 'image',
          left: 0,
          top: 0,
          width: 500,
          height: 300,
          angle: 0,
          opacity: 1,
        },
        setSelectedObject: vi.fn(),
      };

      render(
        <EditorEngineContext.Provider value={mockEngine}>
          <EditorSelectionContext.Provider value={mockSelection}>
            <CameraRawPanel />
          </EditorSelectionContext.Provider>
        </EditorEngineContext.Provider>,
      );

      expect(screen.getByRole('button', { name: /▼Luz/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /▼Cor/i })).toBeInTheDocument();
      expect(screen.getByText(/Equilíbrio de branco: como fotografado/i)).toBeInTheDocument();

      const exposureSlider = screen.getByLabelText(/^Exposição$/i);
      expect(exposureSlider).toBeInTheDocument();

      fireEvent.change(exposureSlider, { target: { value: '25' } });
      expect(mockApplyCameraRaw).toHaveBeenCalledWith(expect.objectContaining({ exposure: 25 }));
    });
  });

  describe('Camera Raw Filter Engine Pipeline', () => {
    it('instantiates and attaches Brightness, Contrast, ColorMatrix, and Gamma filters', () => {
      const mockImage = {
        filters: [],
        applyFilters: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
      } as unknown as FabricImage;

      applyCameraRawToImage(mockImage, {
        ...DEFAULT_CAMERA_RAW_ADJUSTMENTS,
        exposure: 20,
        contrast: 15,
        highlights: -10,
        shadows: 25,
        temperature: 30,
        tint: -15,
        vibrance: 20,
        saturation: 10,
        clarity: 15,
        vignette: 0,
      });

      expect(mockImage.filters.length).toBeGreaterThanOrEqual(4);
      expect(mockImage.applyFilters).toHaveBeenCalled();
      expect(mockImage.set).toHaveBeenCalledWith(
        'cameraRawAdjustments',
        expect.objectContaining({ exposure: 20, temperature: 30 }),
      );
    });

    it('applies PhotoCraft-cloned Vignette and Grain filters in effects pipeline', () => {
      const mockImage = {
        filters: [],
        applyFilters: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
      } as unknown as FabricImage;

      applyCameraRawToImage(mockImage, {
        ...DEFAULT_CAMERA_RAW_ADJUSTMENTS,
        vignette: -40,
        vignetteMidpoint: 45,
        vignetteRoundness: 20,
        vignetteFeather: 60,
        grainAmount: 35,
        grainSize: 20,
      });

      expect(mockImage.filters.length).toBe(2);
      expect(mockImage.applyFilters).toHaveBeenCalled();
      expect(mockImage.set).toHaveBeenCalledWith(
        'cameraRawAdjustments',
        expect.objectContaining({ vignette: -40, grainAmount: 35 }),
      );
    });

    it('retrieves saved adjustments and resets them correctly', () => {
      const mockImage = {
        filters: [{}],
        applyFilters: vi.fn(),
        get: vi.fn().mockReturnValue({ exposure: 40 }),
        set: vi.fn(),
      } as unknown as FabricImage;

      const loaded = getCameraRawAdjustments(mockImage);
      expect(loaded.exposure).toBe(40);

      resetCameraRawAdjustments(mockImage);
      expect(mockImage.filters).toEqual([]);
      expect(mockImage.applyFilters).toHaveBeenCalled();
    });
  });

  describe('New Guide Layout & Slices from Guides Engine', () => {
    const pageDimensions = { width: 1200, height: 800 };

    it('generates 12 columns with gutters and margins', () => {
      const guides = generateGuideLayout(pageDimensions, {
        preset: 'columns-12',
        columns: 12,
        columnGutter: 20,
        rows: 0,
        rowGutter: 0,
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 40,
        marginRight: 40,
        clearExisting: true,
      });

      expect(guides.length).toBeGreaterThan(12);
      expect(guides.every((g) => g.orientation === 'vertical')).toBe(true);
      expect(guides.some((g) => g.position === 40)).toBe(true);
      expect(guides.some((g) => g.position === 1160)).toBe(true);
    });

    it('generates Instagram 3-slice carousel guides', () => {
      const carouselDimensions = { width: 3240, height: 1080 };
      const guides = generateGuideLayout(carouselDimensions, {
        preset: 'instagram-3',
        columns: 3,
        columnGutter: 0,
        rows: 0,
        rowGutter: 0,
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
        clearExisting: true,
      });

      expect(guides).toHaveLength(2);
      expect(guides[0]!.position).toBe(1080);
      expect(guides[1]!.position).toBe(2160);

      const slices = computeSlicesFromGuides(carouselDimensions, guides);
      expect(slices).toHaveLength(3);
      expect(slices[0]!.width).toBe(1080);
      expect(slices[1]!.width).toBe(1080);
      expect(slices[2]!.width).toBe(1080);
    });

    it('renders GuideLayoutModal with presets and handles apply', () => {
      const handleApplyGuides = vi.fn();
      const handleClose = vi.fn();

      render(
        <GuideLayoutModal
          isOpen={true}
          pageDimensions={pageDimensions}
          existingGuides={[]}
          onApplyGuides={handleApplyGuides}
          onClose={handleClose}
        />,
      );

      const modalTitle = screen.getByRole('heading', {
        name: /Layout de Guias & Fatiamento/i,
      });
      expect(modalTitle).toBeInTheDocument();

      const instaBtn = screen.getByRole('button', { name: /Carrossel 3 Telas/i });
      fireEvent.click(instaBtn);

      const applyBtn = screen.getByRole('button', { name: /Aplicar Layout de Guias/i });
      fireEvent.click(applyBtn);

      expect(handleApplyGuides).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe('Photoshop Grouping & Single Element Extraction', () => {
    it('finds nested layers inside FabricGroup and extracts them preserving plane', () => {
      const child1 = new FabricRect({ left: 10, top: 10, width: 40, height: 40 });
      child1.set('name', 'CamadaFilho1');

      const child2 = new FabricRect({ left: 60, top: 10, width: 40, height: 40 });
      child2.set('name', 'CamadaFilho2');

      const group = new FabricGroup([child1, child2], { left: 100, top: 100 });
      group.set('name', 'GrupoPrincipal');

      const mockCanvas = {
        getObjects: () => [group],
        getActiveObject: () => null,
        getActiveObjects: () => [],
        discardActiveObject: vi.fn(),
        setActiveObject: vi.fn(),
        add: vi.fn(),
        remove: vi.fn(),
        requestRenderAll: vi.fn(),
      } as unknown as FabricCanvas;

      const found = findCanvasObjectAndGroup(mockCanvas, 'CamadaFilho1');
      expect(found).not.toBeNull();
      expect(found?.target.get('name')).toBe('CamadaFilho1');
      expect(found?.parentGroup).toBe(group);

      const onComplete = vi.fn();
      assignLayerToGroupOnCanvas(mockCanvas, 'CamadaFilho1', null, onComplete);

      expect(mockCanvas.add).toHaveBeenCalledWith(child1);
      expect(child1.get('groupName')).toBeUndefined();
      expect(mockCanvas.setActiveObject).toHaveBeenCalledWith(child1);
      expect(onComplete).toHaveBeenCalled();
    });
  });
});
