import { fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App.js';
import { FabricCanvasAdapter } from '../src/features/editor/engine/FabricCanvasAdapter.js';
import {
  searchEmojis,
  searchIconifyIcons,
} from '../src/features/editor/services/elementsService.js';

describe('Graphics Engine Subsystems & Infinite Scroll Gallery', () => {
  it('supports offset pagination for Iconify icons, stickers, and curated emojis', async () => {
    const emojiPage1 = await searchEmojis('', 10, 0);
    const emojiPage2 = await searchEmojis('', 10, 10);
    expect(emojiPage1).toHaveLength(10);
    expect(emojiPage2).toHaveLength(10);
    expect(emojiPage1[0]?.id).not.toBe(emojiPage2[0]?.id);

    const mockIconifyResponse = {
      icons: ['lucide:box', 'lucide:circle', 'lucide:star'],
      total: 3,
      limit: 3,
      start: 24,
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockIconifyResponse,
    } as unknown as Response);

    const icons = await searchIconifyIcons('shape', 24, 24);
    expect(icons).toHaveLength(3);
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('start=24'), expect.anything());

    fetchSpy.mockRestore();
  });

  it('exposes expanded vector primitives, boolean pathfinder controls, and dual text modes in the UI', () => {
    render(createElement(App));

    // Navigate to Elementos drawer
    fireEvent.click(screen.getByRole('button', { name: 'Elementos' }));

    // Verify all 9 vector shape primitives are available
    expect(screen.getByRole('button', { name: 'Adicionar Retângulo' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Adicionar Retângulo Arredondado' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar Círculo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar Elipse' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar Triângulo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar Polígono Hexágono' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar Estrela' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar Pílula' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar Linha' })).toBeInTheDocument();

    // Verify Boolean Pathfinder operations
    expect(screen.getByRole('button', { name: /União/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Interseção/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Subtrair/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Excluir/i })).toBeInTheDocument();

    // Navigate to Texto drawer and verify Area Text + Point Text creation buttons
    fireEvent.click(screen.getByRole('button', { name: 'Texto' }));
    expect(
      screen.getByRole('button', { name: /Adicionar uma caixa de texto/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Adicionar texto de ponto \(Linha\)/i }),
    ).toBeInTheDocument();

    // Verify Artboard Clipping toggle button in the workspace zoom bar
    const clipBtn = screen.getByRole('button', {
      name: /Alternar recorte de conteúdo da prancheta/i,
    });
    expect(clipBtn).toBeInTheDocument();
    fireEvent.click(clipBtn);
  });

  it('manages artboard clipping state and coordinate transformation in FabricCanvasAdapter', () => {
    const adapter = new FabricCanvasAdapter();
    expect(adapter.isClipToArtboard()).toBe(true);

    adapter.setClipToArtboard(false);
    expect(adapter.isClipToArtboard()).toBe(false);

    adapter.setClipToArtboard(true);
    expect(adapter.isClipToArtboard()).toBe(true);

    const pt = adapter.screenPointToArtboard(540, 540);
    expect(Number.isFinite(pt.x)).toBe(true);
    expect(Number.isFinite(pt.y)).toBe(true);

    adapter.dispose();
  });
});
