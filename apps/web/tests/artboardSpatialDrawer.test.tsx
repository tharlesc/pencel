import type { DesignPage } from '@pencel/editor-core';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ArtboardThumbnailsDrawer } from '../src/features/editor/components/ArtboardThumbnailsDrawer.js';

describe('ArtboardThumbnailsDrawer (Staggered Spatial Artboard Reel)', () => {
  const mockPages: DesignPage[] = [
    {
      id: 'page-1',
      name: 'Prancheta Capa',
      dimensions: { width: 1080, height: 1080 },
      backgroundColor: '#FFFFFF',
      elements: [],
    },
    {
      id: 'page-2',
      name: 'Prancheta Conteúdo',
      dimensions: { width: 1080, height: 1350 },
      backgroundColor: '#F2F2F7',
      elements: [],
    },
    {
      id: 'page-3',
      name: 'Prancheta Final',
      dimensions: { width: 1920, height: 1080 },
      backgroundColor: '#000000',
      elements: [],
    },
  ];

  it('renders clean cards with artboard titles, dimensions, and active indicator without verbose badges', () => {
    render(
      <ArtboardThumbnailsDrawer
        open={true}
        pages={mockPages}
        activePageIndex={1}
        onClose={vi.fn()}
        onSelectPage={vi.fn()}
        onAddPage={vi.fn()}
        onDuplicatePage={vi.fn()}
        onDeletePage={vi.fn()}
      />,
    );

    expect(screen.getByText('Prancheta Capa')).toBeInTheDocument();
    expect(screen.getByText('Prancheta Conteúdo')).toBeInTheDocument();
    expect(screen.getByText('Prancheta Final')).toBeInTheDocument();
    expect(screen.queryByText('prancheta em visualização')).not.toBeInTheDocument();
    expect(screen.queryByText('anterior se tiver')).not.toBeInTheDocument();
    expect(screen.queryByText('posterior se tiver')).not.toBeInTheDocument();
  });

  it('calls onSelectPage when an artboard card is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <ArtboardThumbnailsDrawer
        open={true}
        pages={mockPages}
        activePageIndex={1}
        onClose={vi.fn()}
        onSelectPage={handleSelect}
        onAddPage={vi.fn()}
        onDuplicatePage={vi.fn()}
        onDeletePage={vi.fn()}
      />,
    );

    const prevCard = screen.getByRole('button', {
      name: /^Prancheta Capa$/i,
    });
    fireEvent.click(prevCard);
    expect(handleSelect).toHaveBeenCalledWith(0);
  });

  it('navigates through artboards using ArrowUp and ArrowDown keys', () => {
    const handleSelect = vi.fn();
    render(
      <ArtboardThumbnailsDrawer
        open={true}
        pages={mockPages}
        activePageIndex={1}
        onClose={vi.fn()}
        onSelectPage={handleSelect}
        onAddPage={vi.fn()}
        onDuplicatePage={vi.fn()}
        onDeletePage={vi.fn()}
      />,
    );

    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(handleSelect).toHaveBeenCalledWith(0);

    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(handleSelect).toHaveBeenCalledWith(2);
  });

  it('triggers onDuplicatePage and onDeletePage and displays dimensions in footer instead of #1', () => {
    const handleDup = vi.fn();
    const handleDel = vi.fn();

    render(
      <ArtboardThumbnailsDrawer
        open={true}
        pages={mockPages}
        activePageIndex={0}
        onClose={vi.fn()}
        onSelectPage={vi.fn()}
        onDuplicatePage={handleDup}
        onDeletePage={handleDel}
      />,
    );

    // Dimensions shown in footer
    expect(screen.getAllByText('1080 × 1080').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('#1')).not.toBeInTheDocument();

    const dupBtn = screen.getByRole('button', { name: /Duplicar prancheta 1/i });
    fireEvent.click(dupBtn);
    expect(handleDup).toHaveBeenCalledWith('page-1');

    const delBtn = screen.getByRole('button', { name: /Excluir prancheta 1/i });
    fireEvent.click(delBtn);
    expect(handleDel).toHaveBeenCalledWith('page-1');
  });

  it('renders visible artboard thumbnail images when thumbnails are provided', () => {
    const mockThumbnails = {
      'page-2': 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
    };

    render(
      <ArtboardThumbnailsDrawer
        open={true}
        pages={mockPages}
        activePageIndex={1}
        thumbnails={mockThumbnails}
        onClose={vi.fn()}
        onSelectPage={vi.fn()}
        onAddPage={vi.fn()}
        onDuplicatePage={vi.fn()}
        onDeletePage={vi.fn()}
      />,
    );

    const img = screen.getByRole('img', { name: /Miniatura de Prancheta Conteúdo/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', mockThumbnails['page-2']);
  });

  it('allows inline renaming of artboards by clicking rename button or double-clicking name', () => {
    const handleRename = vi.fn();
    render(
      <ArtboardThumbnailsDrawer
        open={true}
        pages={mockPages}
        activePageIndex={0}
        onClose={vi.fn()}
        onSelectPage={vi.fn()}
        onAddPage={vi.fn()}
        onDuplicatePage={vi.fn()}
        onDeletePage={vi.fn()}
        onRenamePage={handleRename}
      />,
    );

    const renameBtn = screen.getByRole('button', { name: /Renomear Prancheta Capa/i });
    fireEvent.click(renameBtn);

    const input = screen.getByRole('textbox', { name: /Renomear prancheta/i });
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('Prancheta Capa');

    fireEvent.change(input, { target: { value: 'Nova Capa 2026' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleRename).toHaveBeenCalledWith('page-1', 'Nova Capa 2026');
  });
});
