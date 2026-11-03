import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../src/app/App.js';
import { Icon } from '../src/components/ui/index.js';

describe('@pencel/web Canva-inspired editor & accessibility', () => {
  it('renders decorative icons with aria-hidden="true" and labeled icons with role="img"', () => {
    const { rerender } = render(<Icon name="sparkles" />);
    expect(screen.queryByRole('img')).toBeNull();

    rerender(<Icon name="sparkles" label="Símbolo de destaque" />);
    expect(screen.getByRole('img', { name: 'Símbolo de destaque' })).toBeInTheDocument();
  });

  it('renders the Canva-style rail, drawer, artboard, and toggles Light/Dark theme', () => {
    render(<App />);

    // Brand logo lockup in TopToolbar
    expect(screen.getByRole('img', { name: 'pencel' })).toBeInTheDocument();

    // Top toolbar document title
    const titleInput = screen.getByLabelText('Nome do documento');
    expect(titleInput).toHaveValue('Design Criativo - Canva Style');
    expect(screen.getByText('1080 × 1080 px')).toBeInTheDocument();

    // Verify Canva Navigation Rail items
    expect(screen.getByRole('button', { name: /^Design$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^(Elementos|Elements)$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^(Texto|Text)$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^(Mídia|Media)$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^(Fundo|Background)$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^(Camadas|Layers)$/i })).toBeInTheDocument();

    // Switch format preset to Story / Reels (1080 x 1920)
    const storyPresetButton = screen.getByRole('button', { name: /Story \/ Reels/i });
    fireEvent.click(storyPresetButton);
    expect(screen.getByText('1080 × 1920 px')).toBeInTheDocument();

    // Switch to Elementos drawer
    fireEvent.click(screen.getByRole('button', { name: /Elementos|Elements/i }));
    expect(screen.getByRole('button', { name: 'Adicionar Retângulo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar Círculo' })).toBeInTheDocument();

    // Switch to Texto drawer
    fireEvent.click(screen.getByRole('button', { name: /Texto|Text/i }));
    expect(
      screen.getByRole('button', { name: /Adicionar uma caixa de texto/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Adicionar um título/i })).toBeInTheDocument();

    // Default theme is Dark by design
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    const themeToggleButton = screen.getByRole('button', { name: 'Ativar tema claro' });
    fireEvent.click(themeToggleButton);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(screen.getByRole('button', { name: 'Ativar tema escuro' })).toBeInTheDocument();

    // Open Download / Export Dialog
    const downloadButton = screen.getByRole('button', { name: /Baixar/i });
    fireEvent.click(downloadButton);
    expect(screen.getByRole('dialog', { name: /Baixar seu Design/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).toBeNull();

    // Open JSON Schema dialog and close it
    fireEvent.click(screen.getByRole('button', { name: /JSON/i }));
    expect(
      screen.getByRole('dialog', { name: /Modelo Serializado do Documento/i }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  }, 15000);
});
