import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../src/app/providers/ThemeProvider.js';
import { TopToolbar } from '../src/features/editor/components/TopToolbar.js';
import { NewDocumentModal } from '../src/features/editor/components/NewDocumentModal.js';
import {
  pxToUnit,
  unitToPx,
  loadSavedPresets,
  saveSavedPresets,
} from '../src/features/editor/model/newDocumentModel.js';

describe('NewDocumentModel Units Math & Presets Engine (Photocraft Architecture)', () => {
  it('converts pixels to units and back accurately', () => {
    // 2100 px @ 300 ppi = 7 inches
    expect(pxToUnit(2100, 'in', 300)).toBe(7);
    expect(unitToPx(7, 'in', 300)).toBe(2100);

    // 25.4 mm = 1 inch = 300 px @ 300 ppi
    expect(unitToPx(25.4, 'mm', 300)).toBe(300);

    // Pixels unit is 1:1
    expect(pxToUnit(1920, 'px', 72)).toBe(1920);
    expect(unitToPx(1920, 'px', 72)).toBe(1920);
  });

  it('manages saved presets in localStorage', () => {
    localStorage.clear();
    expect(loadSavedPresets()).toEqual([]);

    const sample = [
      {
        id: 'test-1',
        name: 'Flyer Especial',
        width: 1200,
        height: 1600,
        resolution: 300,
        unit: 'px' as const,
        colorMode: 'rgb',
        depth: 8,
        background: 'white',
        createdAt: '2026-10-28T00:00:00Z',
      },
    ];

    saveSavedPresets(sample);
    expect(loadSavedPresets()).toHaveLength(1);
    expect(loadSavedPresets()[0]?.name).toBe('Flyer Especial');
  });
});

describe('NewDocumentModal (Photocraft.exe High-Fidelity Dialog)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders modal dialog with category tabs and preset cards', () => {
    render(<NewDocumentModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Novo Documento')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Recentes' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Salvos' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Redes Sociais' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Foto' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Impressão' })).toBeInTheDocument();

    // Default Recents tab shows presets
    expect(screen.getByText('Padrão Pencel Full HD')).toBeInTheDocument();
  });

  it('switches category tabs and displays category-specific presets', () => {
    render(<NewDocumentModal isOpen={true} onClose={vi.fn()} />);

    const printTab = screen.getByRole('tab', { name: 'Impressão' });
    fireEvent.click(printTab);

    expect(screen.getByText('A4')).toBeInTheDocument();
    expect(screen.getByText('Carta (Letter)')).toBeInTheDocument();
  });

  it('updates details pane when a preset card is clicked', () => {
    render(<NewDocumentModal isOpen={true} onClose={vi.fn()} />);

    // Switch to Social tab
    const socialTab = screen.getByRole('tab', { name: 'Redes Sociais' });
    fireEvent.click(socialTab);

    const reelsBtn = screen.getByRole('button', { name: /Story \/ Reels/i });
    fireEvent.click(reelsBtn);

    const widthInput = screen.getByLabelText(/^Largura$/i);
    const heightInput = screen.getByLabelText(/^Altura$/i);

    expect(widthInput).toHaveValue('1080');
    expect(heightInput).toHaveValue('1920');
  });

  it('creates document immediately when a preset is double-clicked (Photocraft feature)', () => {
    const handleCreate = vi.fn();
    const handleClose = vi.fn();

    render(
      <NewDocumentModal isOpen={true} onClose={handleClose} onCreateDocument={handleCreate} />,
    );

    const socialTab = screen.getByRole('tab', { name: 'Redes Sociais' });
    fireEvent.click(socialTab);

    const reelsBtn = screen.getByRole('button', { name: /Story \/ Reels/i });
    fireEvent.doubleClick(reelsBtn);

    expect(handleCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        dimensions: { width: 1080, height: 1920 },
      }),
    );
    expect(handleClose).toHaveBeenCalled();
  });

  it('swaps width and height on orientation toggle', () => {
    render(<NewDocumentModal isOpen={true} onClose={vi.fn()} />);

    const widthInput = screen.getByLabelText(/^Largura$/i);
    const heightInput = screen.getByLabelText(/^Altura$/i);

    expect(widthInput).toHaveValue('1920');
    expect(heightInput).toHaveValue('1080');

    // Click Portrait button
    const portraitBtn = screen.getByRole('button', { name: 'Orientação Retrato' });
    fireEvent.click(portraitBtn);

    expect(widthInput).toHaveValue('1080');
    expect(heightInput).toHaveValue('1920');

    // Click Landscape button
    const landscapeBtn = screen.getByRole('button', { name: 'Orientação Paisagem' });
    fireEvent.click(landscapeBtn);

    expect(widthInput).toHaveValue('1920');
    expect(heightInput).toHaveValue('1080');
  });

  it('evaluates arithmetic expressions in dimension inputs', () => {
    render(<NewDocumentModal isOpen={true} onClose={vi.fn()} />);

    const widthInput = screen.getByLabelText(/^Largura$/i);
    fireEvent.change(widthInput, { target: { value: '1920/2' } });
    fireEvent.blur(widthInput);

    expect(widthInput).toHaveValue('960');
  });

  it('allows saving and deleting a custom preset', () => {
    render(<NewDocumentModal isOpen={true} onClose={vi.fn()} />);

    // Click Salvar Predefinição
    const saveTriggerBtn = screen.getByRole('button', { name: /Salvar Predefinição\.\.\./i });
    fireEvent.click(saveTriggerBtn);

    const nameInput = screen.getByLabelText(/Nome da predefinição para salvar/i);
    fireEvent.change(nameInput, { target: { value: 'Meu Formato 4K' } });

    const saveBtn = screen.getByRole('button', { name: 'Salvar' });
    fireEvent.click(saveBtn);

    // Now under "Salvos" tab, "Meu Formato 4K" is present
    expect(screen.getByText('Meu Formato 4K')).toBeInTheDocument();

    // Delete saved preset
    const deleteBtn = screen.getByRole('button', { name: /Excluir predefinição Meu Formato 4K/i });
    fireEvent.click(deleteBtn);

    expect(screen.queryByText('Meu Formato 4K')).not.toBeInTheDocument();
    expect(screen.getByText('Nenhuma predefinição salva ainda.')).toBeInTheDocument();
  });

  it('calls onCreateDocument when Criar button is clicked', () => {
    const handleCreate = vi.fn();
    const handleClose = vi.fn();

    render(
      <NewDocumentModal isOpen={true} onClose={handleClose} onCreateDocument={handleCreate} />,
    );

    const nameInput = screen.getByLabelText(/Nome do documento/i);
    fireEvent.change(nameInput, { target: { value: 'Projeto Criativo' } });

    const createBtn = screen.getByRole('button', { name: 'Criar' });
    fireEvent.click(createBtn);

    expect(handleCreate).toHaveBeenCalledWith({
      title: 'Projeto Criativo',
      dimensions: { width: 1920, height: 1080 },
      resolution: 72,
      backgroundColor: '#FFFFFF',
      colorMode: 'rgb',
    });
    expect(handleClose).toHaveBeenCalled();
  });
});

describe('TopToolbar New Document Integration', () => {
  it('renders "Novo" button with filePlus icon and calls onOpenNewDocumentModal', () => {
    const handleOpen = vi.fn();
    render(
      <ThemeProvider>
        <TopToolbar onOpenNewDocumentModal={handleOpen} />
      </ThemeProvider>,
    );

    const newBtn = screen.getByRole('button', { name: /Novo documento ou tamanho personalizado/i });
    expect(newBtn).toBeInTheDocument();

    fireEvent.click(newBtn);
    expect(handleOpen).toHaveBeenCalled();
  });
});
