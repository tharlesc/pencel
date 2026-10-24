import { unitToPixels } from '@pencel/editor-core';
import type { Dimensions, PresetId } from '@pencel/shared-types';
import { useMemo, useState } from 'react';
import { CANVA_TEMPLATES, getFormatPresetsCatalog } from '../model/presetCatalog.js';

export interface UseTemplatesPanelParams {
  readonly onCustomDimensionsCreate: (dimensions: Dimensions) => void;
}

export function useTemplatesPanel({ onCustomDimensionsCreate }: UseTemplatesPanelParams) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomSizeOpen, setIsCustomSizeOpen] = useState(false);
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);
  const [customUnit, setCustomUnit] = useState<'px' | 'cm' | 'mm' | 'in'>('px');
  const [customDpi, setCustomDpi] = useState<72 | 150 | 300>(72);

  const presets = useMemo(() => getFormatPresetsCatalog(), []);
  const filteredTemplates = useMemo(
    () => CANVA_TEMPLATES.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery],
  );

  const handleApplyCustomSize = (): void => {
    const pxW = unitToPixels(customWidth, customUnit, customDpi);
    const pxH = unitToPixels(customHeight, customUnit, customDpi);
    const finalW = Math.max(64, Math.min(8000, Math.round(pxW)));
    const finalH = Math.max(64, Math.min(8000, Math.round(pxH)));
    onCustomDimensionsCreate({ width: finalW, height: finalH });
    setIsCustomSizeOpen(false);
  };

  return {
    searchQuery,
    setSearchQuery,
    isCustomSizeOpen,
    setIsCustomSizeOpen,
    customWidth,
    setCustomWidth,
    customHeight,
    setCustomHeight,
    customUnit,
    setCustomUnit,
    customDpi,
    setCustomDpi,
    presets,
    filteredTemplates,
    handleApplyCustomSize,
  };
}

export interface TemplatesPanelProps {
  readonly activePresetId?: PresetId;
  readonly onSelectPreset?: (presetId: PresetId) => void;
  readonly onApplyTemplate?: (templateId: string) => void;
  readonly onCustomDimensionsCreate?: (dimensions: Dimensions) => void;
}
