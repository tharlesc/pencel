import type { BooleanPathOperation, ShapeVariant } from '@pencel/editor-core';
import type { ReactElement } from 'react';
import type { AddTextOptions } from '../../hooks/useTextPanel.js';
import styles from '../SidebarNav.module.css';

const SHAPE_CATALOG: readonly {
  variant: ShapeVariant;
  fill: string;
  label: string;
  ariaLabel: string;
  previewClass: string;
}[] = [
  {
    variant: 'rectangle',
    fill: '#0066CC',
    label: 'Retângulo',
    ariaLabel: 'Adicionar Retângulo',
    previewClass: 'shapePreviewRect',
  },
  {
    variant: 'rounded-rectangle',
    fill: '#0066CC',
    label: 'Arredondado',
    ariaLabel: 'Adicionar Retângulo Arredondado',
    previewClass: 'shapePreviewPill',
  },
  {
    variant: 'circle',
    fill: '#D97706',
    label: 'Círculo',
    ariaLabel: 'Adicionar Círculo',
    previewClass: 'shapePreviewCircle',
  },
  {
    variant: 'ellipse',
    fill: '#0891B2',
    label: 'Elipse',
    ariaLabel: 'Adicionar Elipse',
    previewClass: 'shapePreviewPill',
  },
  {
    variant: 'pill',
    fill: '#16A34A',
    label: 'Pílula',
    ariaLabel: 'Adicionar Pílula',
    previewClass: 'shapePreviewPill',
  },
  {
    variant: 'triangle',
    fill: '#6D28D9',
    label: 'Triângulo',
    ariaLabel: 'Adicionar Triângulo',
    previewClass: 'shapePreviewTriangle',
  },
  {
    variant: 'polygon',
    fill: '#0066CC',
    label: 'Hexágono',
    ariaLabel: 'Adicionar Polígono Hexágono',
    previewClass: 'shapePreviewRect',
  },
  {
    variant: 'star',
    fill: '#EAB308',
    label: 'Estrela',
    ariaLabel: 'Adicionar Estrela',
    previewClass: 'shapePreviewTriangle',
  },
  {
    variant: 'line',
    fill: '#18181B',
    label: 'Linha',
    ariaLabel: 'Adicionar Linha',
    previewClass: 'shapePreviewLine',
  },
];

const BOOLEAN_OPERATIONS: readonly {
  op: BooleanPathOperation;
  name: string;
  symbol: string;
  title: string;
}[] = [
  { op: 'union', name: 'União', symbol: 'A ∪ B', title: 'Unir duas formas selecionadas' },
  { op: 'intersect', name: 'Interseção', symbol: 'A ∩ B', title: 'Interseção de duas formas' },
  {
    op: 'subtract',
    name: 'Subtrair',
    symbol: 'A − B',
    title: 'Subtrair forma superior da base',
  },
  { op: 'exclude', name: 'Excluir', symbol: 'A ⊕ B', title: 'Exclusão simétrica (XOR)' },
];

export interface ShapesSubPanelProps {
  readonly onAddShape: (options: { shapeVariant: ShapeVariant; fill?: string }) => void;
  readonly onAddText: (options: AddTextOptions) => void;
  readonly onPerformBooleanOperation?: (operation: BooleanPathOperation) => void;
}

export function ShapesSubPanel({
  onAddShape,
  onAddText,
  onPerformBooleanOperation,
}: ShapesSubPanelProps): ReactElement {
  return (
    <>
      <div className={styles.subSection}>
        <span className={styles.subTitle}>Formas Vetoriais</span>
        <div className={styles.shapesGrid}>
          {SHAPE_CATALOG.map((shape) => (
            <button
              key={shape.variant}
              type="button"
              className={styles.shapeBtn}
              onClick={() => onAddShape({ shapeVariant: shape.variant, fill: shape.fill })}
              aria-label={shape.ariaLabel}
            >
              <div className={styles[shape.previewClass]} />
              <span>{shape.label}</span>
            </button>
          ))}
        </div>
      </div>

      {onPerformBooleanOperation ? (
        <div className={styles.subSection}>
          <span className={styles.subTitle}>Operações Booleanas (Pathfinder)</span>
          <div className={styles.presetsGrid}>
            {BOOLEAN_OPERATIONS.map((item) => (
              <button
                key={item.op}
                type="button"
                className={styles.presetPill}
                onClick={() => onPerformBooleanOperation(item.op)}
                title={item.title}
              >
                <span className={styles.presetPillName}>{item.name}</span>
                <span className={styles.presetPillDim}>{item.symbol}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className={styles.subSection}>
        <span className={styles.subTitle}>Selos e Marcadores</span>
        <div className={styles.badgesGrid}>
          <button
            type="button"
            className={styles.badgeItemBtn}
            onClick={() => {
              onAddShape({ shapeVariant: 'pill', fill: '#DC2626' });
              onAddText({ text: 'DESTAQUE', fontSize: 22, fill: '#F8FAFC', fontWeight: 'bold' });
            }}
          >
            <span className={styles.badgeSale}>DESTAQUE</span>
          </button>

          <button
            type="button"
            className={styles.badgeItemBtn}
            onClick={() => {
              onAddShape({ shapeVariant: 'pill', fill: '#16A34A' });
              onAddText({ text: 'LANÇAMENTO', fontSize: 20, fill: '#F8FAFC', fontWeight: 'bold' });
            }}
          >
            <span className={styles.badgeNew}>LANÇAMENTO</span>
          </button>

          <button
            type="button"
            className={styles.badgeItemBtn}
            onClick={() => {
              onAddShape({ shapeVariant: 'pill', fill: '#0066CC' });
              onAddText({ text: 'AUTÊNTICO', fontSize: 20, fill: '#F8FAFC', fontWeight: 'bold' });
            }}
          >
            <span className={styles.badgeVerified}>AUTÊNTICO</span>
          </button>
        </div>
      </div>
    </>
  );
}
