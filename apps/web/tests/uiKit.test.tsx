import fs from 'node:fs';
import path from 'node:path';
import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  Badge,
  BrandLogo,
  Button,
  ColorPicker,
  Dialog,
  EmptyState,
  Icon,
  Input,
  ListRow,
  Menu,
  NumberField,
  PanelSection,
  Popover,
  SegmentedControl,
  Skeleton,
  Slider,
  Tabs,
  ToolbarDivider,
  ToolbarGroup,
  Tooltip,
} from '../src/components/ui/index.js';

function collectCssModules(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectCssModules(fullPath));
    } else if (entry.isFile() && fullPath.endsWith('.module.css')) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('Pencel UI Kit Primitives & Material Pencel Compliance', () => {
  it('enforces zero hex, zero rgba(), and zero px literals in apps/web/src/components/ui/*.module.css', () => {
    const uiDir = path.resolve(process.cwd(), 'src/components/ui');
    const cssFiles = collectCssModules(uiDir);
    expect(cssFiles.length).toBeGreaterThanOrEqual(19);

    for (const file of cssFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const hexMatches = content.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
      const rgbaMatches = content.match(/rgba?\(/g) ?? [];
      const pxMatches = content.match(/\b\d+(\.\d+)?px\b/g) ?? [];
      expect(hexMatches, `Hex found in ${path.basename(file)}`).toEqual([]);
      expect(rgbaMatches, `rgb/rgba found in ${path.basename(file)}`).toEqual([]);
      expect(pxMatches, `px literal found in ${path.basename(file)}`).toEqual([]);
    }
  });

  it('renders Badge, BrandLogo, Button, Icon, and Tooltip with ref and className', () => {
    const btnRef = createRef<HTMLButtonElement>();
    const badgeRef = createRef<HTMLSpanElement>();
    const logoRef = createRef<SVGSVGElement>();

    render(
      <div>
        <Badge ref={badgeRef} tone="accent" className="custom-badge">
          Ativo
        </Badge>
        <BrandLogo ref={logoRef} variant="symbol" size="sm" label="Pencel" />
        <Tooltip content="Adicionar camada" shortcut="⌘N">
          <Button ref={btnRef} variant="primary" size="sm" icon="plus" className="custom-btn">
            Criar
          </Button>
        </Tooltip>
        <Icon name="layers" size="md" label="Camadas" />
      </div>,
    );

    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /criar/i })).toHaveClass('custom-btn');
    expect(btnRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(badgeRef.current).toBeInstanceOf(HTMLSpanElement);
    expect(logoRef.current).toBeInstanceOf(SVGSVGElement);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Adicionar camada');
  });

  it('renders Input, NumberField, and Slider with tabular numeric discipline', () => {
    const onInputChange = vi.fn();
    const onNumberChange = vi.fn();
    const onSliderChange = vi.fn();
    const numRef = createRef<HTMLInputElement>();

    render(
      <div>
        <Input
          label="Buscar"
          value="texto"
          onChange={onInputChange}
          onClear={() => onInputChange('')}
          monospace
        />
        <NumberField
          ref={numRef}
          label="Opacidade"
          value={80}
          min={0}
          max={100}
          suffix="%"
          variant="stepper"
          onChange={onNumberChange}
        />
        <Slider
          label="Desfoque"
          value={24}
          min={0}
          max={100}
          suffix="px"
          onChange={onSliderChange}
        />
      </div>,
    );

    expect(numRef.current).toBeInstanceOf(HTMLInputElement);
    fireEvent.click(screen.getByRole('button', { name: /aumentar opacidade/i }));
    expect(onNumberChange).toHaveBeenCalledWith(81);

    const slider = screen.getByRole('slider', { name: /desfoque/i });
    fireEvent.change(slider, { target: { value: '40' } });
    expect(onSliderChange).toHaveBeenCalledWith(40);
  });

  it('renders SegmentedControl, Tabs, PanelSection, ToolbarGroup, and ListRow', () => {
    const onSegChange = vi.fn();
    const onTabChange = vi.fn();

    render(
      <PanelSection title="Propriedades" variant="compact">
        <ToolbarGroup ariaLabel="Ferramentas" floating>
          <SegmentedControl
            ariaLabel="Modo"
            value="fill"
            options={[
              { value: 'fill', label: 'Preenchimento' },
              { value: 'stroke', label: 'Traçado' },
            ]}
            onChange={onSegChange}
          />
          <ToolbarDivider />
        </ToolbarGroup>
        <Tabs
          ariaLabel="Seções"
          activeId="tab1"
          items={[
            { id: 'tab1', label: 'Aba 1' },
            { id: 'tab2', label: 'Aba 2' },
          ]}
          onChange={onTabChange}
        />
        <ListRow title="Camada 1" subtitle="100%" selected />
      </PanelSection>,
    );

    fireEvent.click(screen.getByRole('radio', { name: /traçado/i }));
    expect(onSegChange).toHaveBeenCalledWith('stroke');
    fireEvent.click(screen.getByRole('tab', { name: /aba 2/i }));
    expect(onTabChange).toHaveBeenCalledWith('tab2');
    expect(screen.getByText('Camada 1')).toBeInTheDocument();
  });

  it('renders Popover, Menu, Dialog, EmptyState, Skeleton, and ColorPicker', () => {
    const onClose = vi.fn();
    const onSelect = vi.fn();
    const onColorChange = vi.fn();

    render(
      <div>
        <Popover open ariaLabel="Opções" onClose={onClose}>
          <Menu
            ariaLabel="Ações da camada"
            items={[{ id: 'dup', label: 'Duplicar', shortcut: '⌘D', onSelect }]}
          />
        </Popover>
        <Dialog open title="Exportar" description="Configurações" onClose={onClose}>
          <EmptyState icon="image" title="Sem prévia" description="Selecione um formato" />
          <Skeleton variant="rect" />
          <ColorPicker color="#0066CC" onChange={onColorChange} />
        </Dialog>
      </div>,
    );

    fireEvent.click(screen.getByRole('menuitem', { name: /duplicar/i }));
    expect(onSelect).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
