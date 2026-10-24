import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LayersPanel } from '../src/features/editor/components/LayersPanel/LayersPanel.js';
import type { LayerItem } from '../src/features/editor/engine/FabricCanvasAdapter.js';

describe('LayersPanel (Photoshop / PhotoCraft High-Fidelity Layers Engine)', () => {
  const mockLayers: readonly LayerItem[] = [
    {
      id: 'layer-1',
      name: 'Título Principal',
      type: 'textbox',
      isSelected: true,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'source-over',
      effects: ['Effects', 'Color Overlay'],
    },
    {
      id: 'layer-2',
      name: 'Card de Fundo',
      type: 'rect',
      isSelected: false,
      visible: false,
      locked: true,
      opacity: 0.8,
      blendMode: 'multiply',
    },
  ];

  it('renders filter bar, controls bar, and layer items', () => {
    render(
      <LayersPanel
        layers={mockLayers}
        selectedObject={null}
        onSelectLayer={vi.fn()}
        onToggleVisibility={vi.fn()}
        onToggleLock={vi.fn()}
        onSetOpacity={vi.fn()}
        onSetBlendMode={vi.fn()}
        onRenameLayer={vi.fn()}
        onReorderLayer={vi.fn()}
        onDeleteLayer={vi.fn()}
        onDuplicateLayer={vi.fn()}
        onAddNewLayer={vi.fn()}
      />,
    );

    // Verify Filter Options
    expect(screen.getByLabelText('Filtrar camadas por tipo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtrar Textos' })).toBeInTheDocument();

    // Verify Blend Mode
    expect(screen.getByLabelText('Modo de mesclagem')).toHaveValue('source-over');

    // Verify Layer Names
    expect(screen.getByText('Título Principal')).toBeInTheDocument();
    expect(screen.getByText('Card de Fundo')).toBeInTheDocument();
  });

  it('triggers visibility toggle and lock toggle callbacks', () => {
    const handleToggleVisibility = vi.fn();
    const handleToggleLock = vi.fn();

    render(
      <LayersPanel
        layers={mockLayers}
        selectedObject={null}
        onSelectLayer={vi.fn()}
        onToggleVisibility={handleToggleVisibility}
        onToggleLock={handleToggleLock}
        onSetOpacity={vi.fn()}
        onSetBlendMode={vi.fn()}
        onRenameLayer={vi.fn()}
        onReorderLayer={vi.fn()}
        onDeleteLayer={vi.fn()}
        onDuplicateLayer={vi.fn()}
        onAddNewLayer={vi.fn()}
      />,
    );

    const eyeButton = screen.getByRole('button', { name: 'Ocultar camada' });
    fireEvent.click(eyeButton);
    expect(handleToggleVisibility).toHaveBeenCalledWith('Título Principal');

    const lockButton = screen.getByRole('button', { name: 'Bloquear camada' });
    fireEvent.click(lockButton);
    expect(handleToggleLock).toHaveBeenCalledWith('Título Principal');
  });

  it('allows inline layer renaming with Enter key', () => {
    const handleRename = vi.fn();

    render(
      <LayersPanel
        layers={mockLayers}
        selectedObject={null}
        onSelectLayer={vi.fn()}
        onToggleVisibility={vi.fn()}
        onToggleLock={vi.fn()}
        onSetOpacity={vi.fn()}
        onSetBlendMode={vi.fn()}
        onRenameLayer={handleRename}
        onReorderLayer={vi.fn()}
        onDeleteLayer={vi.fn()}
        onDuplicateLayer={vi.fn()}
        onAddNewLayer={vi.fn()}
      />,
    );

    const layerTitle = screen.getByText('Título Principal');
    fireEvent.doubleClick(layerTitle);

    const input = screen.getByLabelText('Editar nome da camada');
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Novo Título Hero' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(handleRename).toHaveBeenCalledWith('Título Principal', 'Novo Título Hero');
  });

  it('handles layer reordering via drag and drop', () => {
    const handleReorderToIndex = vi.fn();

    render(
      <LayersPanel
        layers={mockLayers}
        selectedObject={null}
        onSelectLayer={vi.fn()}
        onToggleVisibility={vi.fn()}
        onToggleLock={vi.fn()}
        onSetOpacity={vi.fn()}
        onSetBlendMode={vi.fn()}
        onRenameLayer={vi.fn()}
        onReorderLayer={vi.fn()}
        onReorderLayerToIndex={handleReorderToIndex}
        onDeleteLayer={vi.fn()}
        onDuplicateLayer={vi.fn()}
        onAddNewLayer={vi.fn()}
      />,
    );

    const rows = screen.getAllByRole('treeitem');
    const firstRow = rows[0];
    const secondRow = rows[1];

    if (!firstRow || !secondRow) {
      throw new Error('Expected at least two rows in layer tree');
    }

    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn().mockReturnValue('Título Principal'),
      effectAllowed: 'move',
      dropEffect: 'move',
    };

    fireEvent.dragStart(firstRow, { dataTransfer });
    fireEvent.dragOver(secondRow, { dataTransfer });
    fireEvent.drop(secondRow, { dataTransfer });

    expect(handleReorderToIndex).toHaveBeenCalledWith('Título Principal', 1);
  });
});
