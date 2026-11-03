import { useMemo, useState, type ReactElement } from 'react';
import { Icon, Input } from '../../../../components/ui/index.js';
import styles from './LayersPanel.module.css';

export interface BlendModeOption {
  readonly value: string;
  readonly label: string;
  readonly photoshopName: string;
  readonly category: 'Normal' | 'Escurecer' | 'Clarear' | 'Contraste' | 'Inversão' | 'Componente';
}

export const CATEGORIZED_BLEND_MODES: readonly BlendModeOption[] = [
  // Normal
  { value: 'source-over', label: 'Normal', photoshopName: 'Normal', category: 'Normal' },
  { value: 'destination-over', label: 'Atrás', photoshopName: 'Behind', category: 'Normal' },
  // Escurecer (Darken)
  { value: 'darken', label: 'Escurecer', photoshopName: 'Darken', category: 'Escurecer' },
  { value: 'multiply', label: 'Multiplicação', photoshopName: 'Multiply', category: 'Escurecer' },
  {
    value: 'color-burn',
    label: 'Superexposição de Cores',
    photoshopName: 'Color Burn',
    category: 'Escurecer',
  },
  // Clarear (Lighten)
  { value: 'lighten', label: 'Clarear', photoshopName: 'Lighten', category: 'Clarear' },
  { value: 'screen', label: 'Divisão / Tela', photoshopName: 'Screen', category: 'Clarear' },
  {
    value: 'color-dodge',
    label: 'Subexposição de Cores',
    photoshopName: 'Color Dodge',
    category: 'Clarear',
  },
  {
    value: 'lighter',
    label: 'Adicionar Linear',
    photoshopName: 'Linear Dodge (Add)',
    category: 'Clarear',
  },
  // Contraste (Contrast)
  { value: 'overlay', label: 'Sobrepor', photoshopName: 'Overlay', category: 'Contraste' },
  { value: 'soft-light', label: 'Luz Suave', photoshopName: 'Soft Light', category: 'Contraste' },
  { value: 'hard-light', label: 'Luz Direta', photoshopName: 'Hard Light', category: 'Contraste' },
  // Inversão (Inversion / Difference)
  { value: 'difference', label: 'Diferença', photoshopName: 'Difference', category: 'Inversão' },
  { value: 'exclusion', label: 'Exclusão', photoshopName: 'Exclusion', category: 'Inversão' },
  { value: 'xor', label: 'Exclusão Mútua (XOR)', photoshopName: 'XOR', category: 'Inversão' },
  // Componente (Component / Color)
  { value: 'hue', label: 'Matiz', photoshopName: 'Hue', category: 'Componente' },
  { value: 'saturation', label: 'Saturação', photoshopName: 'Saturation', category: 'Componente' },
  { value: 'color', label: 'Cor', photoshopName: 'Color', category: 'Componente' },
  {
    value: 'luminosity',
    label: 'Luminosidade',
    photoshopName: 'Luminosity',
    category: 'Componente',
  },
];

export interface BlendModePopoverProps {
  readonly currentBlendMode: string;
  readonly onSelectBlendMode: (value: string) => void;
  readonly onClose: () => void;
}

export function BlendModePopover({
  currentBlendMode,
  onSelectBlendMode,
  onClose,
}: BlendModePopoverProps): ReactElement {
  const [search, setSearch] = useState('');

  const filteredCategories = useMemo(() => {
    const cats = ['Normal', 'Escurecer', 'Clarear', 'Contraste', 'Inversão', 'Componente'] as const;
    const q = search.trim().toLowerCase();

    return cats
      .map((cat) => {
        const modes = CATEGORIZED_BLEND_MODES.filter(
          (m) =>
            m.category === cat &&
            (m.label.toLowerCase().includes(q) ||
              m.photoshopName.toLowerCase().includes(q) ||
              m.value.toLowerCase().includes(q)),
        );
        return { cat, modes };
      })
      .filter((group) => group.modes.length > 0);
  }, [search]);

  return (
    <div className={styles.blendMenuPopover} onClick={(e) => e.stopPropagation()}>
      <div className={styles.blendSearchContainer}>
        <Input
          prefixIcon="search"
          placeholder="Buscar modo de mesclagem..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          autoFocus
        />
      </div>

      <div className={styles.blendMenuList}>
        {filteredCategories.map(({ cat, modes }) => (
          <div key={cat} className={styles.blendMenuCategory}>
            <span className={styles.blendCategoryHeader}>{cat}</span>
            {modes.map((mode) => {
              const isSelected = mode.value === currentBlendMode;
              return (
                <button
                  key={mode.value}
                  type="button"
                  className={[styles.blendMenuItem, isSelected ? styles.blendMenuItemActive : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => {
                    onSelectBlendMode(mode.value);
                    onClose();
                  }}
                  title={`${mode.label} (${mode.photoshopName})`}
                >
                  <span className={styles.blendItemLabel}>{mode.label}</span>
                  <span className={styles.blendItemEn}>{mode.photoshopName}</span>
                  {isSelected && <Icon name="check" size="xs" tone="accent" />}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
