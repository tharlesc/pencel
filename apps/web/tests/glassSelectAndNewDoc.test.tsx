import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ICON_REGISTRY } from '../src/components/ui/Icon/iconRegistry.js';
import { Select } from '../src/components/ui/Select/Select.js';
import { TemplatesPanel } from '../src/features/editor/components/sidebar/TemplatesPanel.js';

describe('Apple Pro Studio Glass Select Component', () => {
  const sampleOptions = [
    { label: 'Pixels (px)', value: 'px' },
    { label: 'Centímetros (cm)', value: 'cm' },
    { label: 'Milímetros (mm)', value: 'mm' },
    { label: 'Polegadas (in)', value: 'in' },
  ];

  it('renders trigger with current value label and accessibility attributes', () => {
    render(
      <Select
        value="px"
        options={sampleOptions}
        onChange={vi.fn()}
        ariaLabel="Unidade de medida"
      />,
    );

    const combobox = screen.getByRole('combobox', { name: /Unidade de medida/i });
    expect(combobox).toBeInTheDocument();
    expect(combobox).toHaveTextContent('Pixels (px)');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens glass dropdown list on click and selects option', () => {
    const handleChange = vi.fn();
    render(
      <Select
        value="px"
        options={sampleOptions}
        onChange={handleChange}
        ariaLabel="Unidade de medida"
      />,
    );

    const combobox = screen.getByRole('combobox', { name: /Unidade de medida/i });
    fireEvent.click(combobox);

    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    const listbox = screen.getByRole('listbox', { name: /Unidade de medida/i });
    expect(listbox).toBeInTheDocument();

    const cmOption = screen.getByRole('option', { name: 'Centímetros (cm)' });
    expect(cmOption).toBeInTheDocument();

    fireEvent.click(cmOption);
    expect(handleChange).toHaveBeenCalledWith('cm');
  });

  it('navigates with keyboard (ArrowDown and Enter)', () => {
    const handleChange = vi.fn();
    render(
      <Select
        value="px"
        options={sampleOptions}
        onChange={handleChange}
        ariaLabel="Unidade de medida"
      />,
    );

    const combobox = screen.getByRole('combobox', { name: /Unidade de medida/i });
    fireEvent.keyDown(combobox, { key: 'ArrowDown' });

    expect(screen.getByRole('listbox', { name: /Unidade de medida/i })).toBeInTheDocument();

    // Navigate to next option and press enter
    fireEvent.keyDown(combobox, { key: 'ArrowDown' });
    fireEvent.keyDown(combobox, { key: 'Enter' });

    expect(handleChange).toHaveBeenCalled();
  });

  it('closes popover on Escape key', () => {
    render(
      <Select
        value="px"
        options={sampleOptions}
        onChange={vi.fn()}
        ariaLabel="Unidade de medida"
      />,
    );

    const combobox = screen.getByRole('combobox', { name: /Unidade de medida/i });
    fireEvent.click(combobox);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(combobox, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

describe('Alignment Icons Mapping', () => {
  it('correctly associates horizontal alignment actions with vertical guide glyphs and vice-versa', () => {
    // Horizontal aligning (Left, Center, Right) uses vertical guide lines
    expect(ICON_REGISTRY.objectAlignLeft.displayName || ICON_REGISTRY.objectAlignLeft.name).toBe(
      'AlignStartVertical',
    );
    expect(
      ICON_REGISTRY.objectAlignCenter.displayName || ICON_REGISTRY.objectAlignCenter.name,
    ).toBe('AlignVerticalJustifyCenter');
    expect(ICON_REGISTRY.objectAlignRight.displayName || ICON_REGISTRY.objectAlignRight.name).toBe(
      'AlignEndVertical',
    );

    // Vertical aligning (Top, Middle, Bottom) uses horizontal guide lines
    expect(ICON_REGISTRY.alignTop.displayName || ICON_REGISTRY.alignTop.name).toBe(
      'AlignStartHorizontal',
    );
    expect(ICON_REGISTRY.alignMiddle.displayName || ICON_REGISTRY.alignMiddle.name).toBe(
      'AlignHorizontalJustifyCenter',
    );
    expect(ICON_REGISTRY.alignBottom.displayName || ICON_REGISTRY.alignBottom.name).toBe(
      'AlignEndHorizontal',
    );
  });
});

describe('TemplatesPanel Custom Dimensions / Create Document', () => {
  it('triggers onOpenNewDocumentModal when "Tamanho Personalizado / Criar Novo" is clicked', () => {
    const handleOpenModal = vi.fn();
    render(<TemplatesPanel onOpenNewDocumentModal={handleOpenModal} />);

    const btn = screen.getByRole('button', { name: /Tamanho Personalizado \/ Criar Novo/i });
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(handleOpenModal).toHaveBeenCalledTimes(1);
  });
});
