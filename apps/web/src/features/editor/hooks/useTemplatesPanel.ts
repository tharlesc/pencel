import type { Dimensions, PresetId } from '@pencel/shared-types';
import { useMemo, useState } from 'react';
import { CANVA_TEMPLATES, getFormatPresetsCatalog } from '../model/presetCatalog.js';

export interface UseTemplatesPanelParams {
  readonly onCustomDimensionsCreate?: (dimensions: Dimensions) => void;
}

export function useTemplatesPanel(_params?: UseTemplatesPanelParams) {
  const [searchQuery, setSearchQuery] = useState('');

  const presets = useMemo(() => getFormatPresetsCatalog(), []);
  const filteredTemplates = useMemo(
    () => CANVA_TEMPLATES.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery],
  );

  return {
    searchQuery,
    setSearchQuery,
    presets,
    filteredTemplates,
  };
}

export interface TemplatesPanelProps {
  readonly activePresetId?: PresetId;
  readonly onSelectPreset?: (presetId: PresetId) => void;
  readonly onApplyTemplate?: (templateId: string) => void;
  readonly onCustomDimensionsCreate?: (dimensions: Dimensions) => void;
  readonly onOpenNewDocumentModal?: () => void;
}
