import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CanvasBottomHud } from '../src/features/editor/components/CanvasBottomHud/index.js';
import { FloatingStudioToolbar } from '../src/features/editor/components/FloatingStudioToolbar/index.js';
import { CanvasGuidesOverlay } from '../src/features/editor/components/Ruler/CanvasGuidesOverlay/index.js';
import { CanvasRulers } from '../src/features/editor/components/Ruler/CanvasRulers/index.js';
import { StudioAdjustmentsSection } from '../src/features/editor/components/sidebar/SettingsPanel/StudioAdjustmentsSection.js';

describe('Floating Studio Toolbar & Photoshop Rulers/Guides System', () => {
  describe('FloatingStudioToolbar (Apple-inspired Glass HUD)', () => {
    it('renders the floating glass toolbar with all tool buttons and accessible labels', () => {
      const handleSetToolMode = vi.fn();
      const handleSetDrawingMode = vi.fn();
      const handleAddShape = vi.fn();
      const handleToggleRulers = vi.fn();
      const handleReset = vi.fn();
      const handleToggleArtboardDrawer = vi.fn();

      render(
        <FloatingStudioToolbar
          currentToolMode="select"
          currentDrawingTool="none"
          onSetToolMode={handleSetToolMode}
          onSetDrawingMode={handleSetDrawingMode}
          onAddShape={handleAddShape}
          onToggleRulers={handleToggleRulers}
          onToggleArtboardDrawer={handleToggleArtboardDrawer}
          onReset={handleReset}
          showRulers={true}
        />,
      );

      const nav = screen.getByRole('navigation', { name: /Ferramentas principais do estúdio/i });
      expect(nav).toBeInTheDocument();

      const selectBtn = screen.getByRole('button', { name: /Ferramenta Seleção \(V\)/i });
      expect(selectBtn).toHaveAttribute('aria-pressed', 'true');

      const directSelectBtn = screen.getByRole('button', {
        name: /Seleção Direta de Âncoras \(A\)/i,
      });
      fireEvent.click(directSelectBtn);
      expect(handleSetToolMode).toHaveBeenCalledWith('directSelect');

      const penBtn = screen.getByRole('button', { name: /Caneta Bézier Vetorial \(P\)/i });
      fireEvent.click(penBtn);
      expect(handleSetToolMode).toHaveBeenCalledWith('pen');

      const rectBtn = screen.getByRole('button', { name: /Adicionar Retângulo \(R\)/i });
      fireEvent.click(rectBtn);
      expect(handleAddShape).toHaveBeenCalledWith('rectangle');

      const artboardDrawerBtn = screen.getByRole('button', { name: /Miniaturas de Pranchetas/i });
      fireEvent.click(artboardDrawerBtn);
      expect(handleToggleArtboardDrawer).toHaveBeenCalled();

      const rulerBtn = screen.getByRole('button', { name: /Alternar Réguas \(Ctrl\+R\)/i });
      expect(rulerBtn).toHaveAttribute('aria-pressed', 'true');
      fireEvent.click(rulerBtn);
      expect(handleToggleRulers).toHaveBeenCalled();

      const fitBtn = screen.getByRole('button', { name: /Centralizar e Ajustar Tela/i });
      fireEvent.click(fitBtn);
      expect(handleReset).toHaveBeenCalled();
    });

    it('renders with vertical orientation styling when orientation="vertical"', () => {
      render(<FloatingStudioToolbar orientation="vertical" />);
      const nav = screen.getByRole('navigation', { name: /Ferramentas principais do estúdio/i });
      expect(nav.className).toMatch(/floatingToolbarVertical/);
    });
  });

  describe('CanvasBottomHud & Floating Toolbar Settings', () => {
    it('renders clean artboard dimensions without footer settings button, and toggles floating toolbar position via adjustments section', () => {
      const handlePositionChange = vi.fn();
      const mockPage = {
        id: 'page-1',
        name: 'Prancheta 1',
        dimensions: { width: 1080, height: 1080 },
        backgroundColor: '#FFFFFF',
        elements: [],
      };

      render(
        <CanvasBottomHud
          page={mockPage}
          activePageIndex={0}
          pageCount={1}
          zoom={1}
          elementCount={5}
          clipArtboard={true}
          onSetClipArtboard={vi.fn()}
          onZoomIn={vi.fn()}
          onZoomOut={vi.fn()}
          onReset={vi.fn()}
        />,
      );

      // Verify clean stats readout in bottom HUD without settings gear button
      expect(screen.getByText('1080 × 1080 px')).toBeInTheDocument();
      expect(screen.getByText('5 elementos')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', {
          name: /Configurações do Palco e Layout/i,
        }),
      ).not.toBeInTheDocument();

      // Render adjustments section to verify position switching
      render(
        <StudioAdjustmentsSection
          toolbarPosition="bottom"
          onPositionToggle={handlePositionChange}
          showRulers={true}
          onToggleRulers={vi.fn()}
          showGuides={true}
          onToggleGuides={vi.fn()}
          clipToArtboard={true}
          onToggleClipToArtboard={vi.fn()}
        />,
      );

      const leftBtn = screen.getByRole('button', { name: /Left Side|Lateral Esquerda/i });
      expect(leftBtn).toBeInTheDocument();
      fireEvent.click(leftBtn);
      expect(handlePositionChange).toHaveBeenCalledWith('left');
    });
  });

  describe('CanvasRulers (Photoshop Pixel Ticks & Origin)', () => {
    it('renders horizontal and vertical rulers with origin box and tick marks', () => {
      const handleStartCreateGuide = vi.fn();
      const handleResetOrigin = vi.fn();

      render(
        <CanvasRulers
          zoom={1.0}
          pan={{ x: 0, y: 0 }}
          pageSize={{ width: 1080, height: 1080 }}
          viewportWidth={1200}
          viewportHeight={900}
          mousePos={{ x: 300, y: 400 }}
          onStartCreateGuide={handleStartCreateGuide}
          onResetOrigin={handleResetOrigin}
        />,
      );

      const cornerBox = screen.getByTitle(/Origem \(0, 0\) em pixels/i);
      expect(cornerBox).toHaveTextContent('px');
      fireEvent.click(cornerBox);
      expect(handleResetOrigin).toHaveBeenCalled();

      const hRuler = screen.getByTitle(/Régua horizontal/i);
      fireEvent.mouseDown(hRuler, { clientX: 200, clientY: 10 });
      expect(handleStartCreateGuide).toHaveBeenCalledWith(
        'horizontal',
        expect.objectContaining({ clientX: 200 }),
      );

      const vRuler = screen.getByTitle(/Régua vertical/i);
      fireEvent.mouseDown(vRuler, { clientX: 10, clientY: 350 });
      expect(handleStartCreateGuide).toHaveBeenCalledWith(
        'vertical',
        expect.objectContaining({ clientY: 350 }),
      );
    });
  });

  describe('CanvasGuidesOverlay (Magnetic Guides & Live Tooltips)', () => {
    it('renders horizontal and vertical guides and allows double click deletion', () => {
      const handleStartDrag = vi.fn();
      const handleDeleteGuide = vi.fn();

      const guides = [
        { id: 'h1', orientation: 'horizontal' as const, position: 200 },
        { id: 'v1', orientation: 'vertical' as const, position: 400 },
      ];

      render(
        <CanvasGuidesOverlay
          guides={guides}
          activeGuideDrag={null}
          artboardOrigin={{ x: 100, y: 50 }}
          zoom={1.0}
          onStartDragExistingGuide={handleStartDrag}
          onDeleteGuide={handleDeleteGuide}
        />,
      );

      const hGuide = screen.getByTitle(/Guia horizontal em 200px/i);
      expect(hGuide).toBeInTheDocument();
      fireEvent.doubleClick(hGuide);
      expect(handleDeleteGuide).toHaveBeenCalledWith('h1');

      const vGuide = screen.getByTitle(/Guia vertical em 400px/i);
      expect(vGuide).toBeInTheDocument();
      fireEvent.mouseDown(vGuide);
      expect(handleStartDrag).toHaveBeenCalledWith(guides[1], expect.anything());
    });

    it('deletes guide on two rapid mousedown clicks within 350ms even if native dblclick is swallowed', () => {
      const handleStartDrag = vi.fn();
      const handleDeleteGuide = vi.fn();

      const guides = [{ id: 'h2', orientation: 'horizontal' as const, position: 150 }];

      render(
        <CanvasGuidesOverlay
          guides={guides}
          activeGuideDrag={null}
          artboardOrigin={{ x: 100, y: 50 }}
          zoom={1.0}
          onStartDragExistingGuide={handleStartDrag}
          onDeleteGuide={handleDeleteGuide}
        />,
      );

      const hGuide = screen.getByTitle(/Guia horizontal em 150px/i);
      fireEvent.mouseDown(hGuide);
      fireEvent.mouseDown(hGuide);

      expect(handleDeleteGuide).toHaveBeenCalledWith('h2');
    });

    it('renders live coordinate badge and snapped label when actively dragging a guide', () => {
      render(
        <CanvasGuidesOverlay
          guides={[]}
          activeGuideDrag={{
            orientation: 'horizontal',
            currentDocPos: 540,
            isSnapped: true,
            snappedTarget: 'Centro da prancheta',
            isDeleting: false,
            screenX: 250,
            screenY: 320,
          }}
          artboardOrigin={{ x: 100, y: 50 }}
          zoom={1.0}
          onStartDragExistingGuide={vi.fn()}
        />,
      );

      expect(screen.getByText(/Y: 540 px • Centro da prancheta/i)).toBeInTheDocument();
    });
  });
});
