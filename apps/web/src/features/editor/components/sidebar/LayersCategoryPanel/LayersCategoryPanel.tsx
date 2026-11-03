import type { ReactElement } from 'react';
import { useLayersPanel } from '../../../hooks/useLayersPanel.js';
import { LayersPanel } from '../../LayersPanel/index.js';

export function LayersCategoryPanel(): ReactElement {
  const props = useLayersPanel();
  return <LayersPanel {...props} />;
}
