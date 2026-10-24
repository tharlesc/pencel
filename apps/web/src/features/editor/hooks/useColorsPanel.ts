import { useCallback, useMemo, useState } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage.js';
import {
  DESIGNER_PALETTES,
  generateColormindPalette,
  getColorShadesAndTints,
} from '../services/colorIntelligenceService.js';

export interface SavedColorPalette {
  readonly id: string;
  readonly name: string;
  readonly colors: readonly string[];
}

const SAVED_PALETTES_STORAGE_KEY = 'pencel_saved_palettes_v1';

export function useColorsPanel() {
  const [aiPalette, setAiPalette] = useState<string[]>([
    '#0066CC',
    '#16A34A',
    '#D97706',
    '#18181B',
    '#F4F4F6',
  ]);
  const [isGeneratingAiPalette, setIsGeneratingAiPalette] = useState(false);
  const [savedPalettes, setSavedPalettes] = useLocalStorage<readonly SavedColorPalette[]>(
    SAVED_PALETTES_STORAGE_KEY,
    [],
  );

  const handleSavePalette = useCallback(
    (colorsToSave: readonly string[]): void => {
      setSavedPalettes((prev) => {
        const newPal: SavedColorPalette = {
          id: `pal-${Date.now()}`,
          name: `Paleta ${prev.length + 1}`,
          colors: colorsToSave.slice(0, 5),
        };
        return [newPal, ...prev];
      });
    },
    [setSavedPalettes],
  );

  const handleDeleteSavedPalette = useCallback(
    (id: string): void => {
      setSavedPalettes((prev) => prev.filter((p) => p.id !== id));
    },
    [setSavedPalettes],
  );

  const handleGenerateAiPalette = useCallback(async (): Promise<void> => {
    setIsGeneratingAiPalette(true);
    try {
      const colors = await generateColormindPalette('default');
      setAiPalette(colors);
    } finally {
      setIsGeneratingAiPalette(false);
    }
  }, []);

  const currentShades = useMemo(
    () => getColorShadesAndTints(aiPalette[0] ?? '#0066CC'),
    [aiPalette],
  );

  return {
    aiPalette,
    isGeneratingAiPalette,
    savedPalettes,
    currentShades,
    designerPalettes: DESIGNER_PALETTES,
    handleSavePalette,
    handleDeleteSavedPalette,
    handleGenerateAiPalette,
  };
}
