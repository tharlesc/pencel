import type { Dimensions } from '@pencel/shared-types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { evaluateDimensionExpression } from '../../../shared/lib/mathUtils.js';
import {
  NEW_DOCUMENT_CATEGORIES,
  addRecentPreset,
  loadRecentPresets,
  loadSavedPresets,
  pxToUnit,
  saveSavedPresets,
  unitToPx,
  type PresetItem,
  type RecentDocumentPreset,
  type SavedDocumentPreset,
  type UnitId,
} from '../model/newDocumentModel.js';
import { useOptionalEditorEngine, useOptionalEditorSession } from '../state/EditorProvider.js';

export interface UseNewDocumentModalOptions {
  readonly isOpen?: boolean;
  readonly onClose?: () => void;
  readonly onCreateDocument?: (options: {
    readonly title: string;
    readonly dimensions: Dimensions;
    readonly resolution: number;
    readonly backgroundColor: string;
    readonly colorMode: string;
  }) => void;
}

export function useNewDocumentModal(options: UseNewDocumentModalOptions) {
  const session = useOptionalEditorSession();
  const engine = useOptionalEditorEngine();

  const isOpen = options.isOpen ?? session?.isNewDocumentModalOpen ?? false;
  const sessionClose = session?.closeNewDocumentModal;
  const propClose = options.onClose;
  const onClose = useMemo(() => propClose ?? sessionClose ?? (() => {}), [propClose, sessionClose]);

  const [activeCategory, setActiveCategory] = useState<string>('recent');
  const [selectedPresetName, setSelectedPresetName] = useState<string>('Padrão Pencel Full HD');

  // Form Fields
  const [docName, setDocName] = useState<string>('Sem título-1');
  const [unit, setUnit] = useState<UnitId>('px');
  const [widthPx, setWidthPx] = useState<number>(1920);
  const [heightPx, setHeightPx] = useState<number>(1080);
  const [widthText, setWidthText] = useState<string>('1920');
  const [heightText, setHeightText] = useState<string>('1080');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [artboard, setArtboard] = useState<boolean>(true);
  const [resolution, setResolution] = useState<number>(72);
  const [resUnit, setResUnit] = useState<'in' | 'cm'>('in');
  const [colorMode, setColorMode] = useState<string>('rgb');
  const [bitDepth, setBitDepth] = useState<number>(8);
  const [backgroundType, setBackgroundType] = useState<string>('white');
  const [customBgColor, setCustomBgColor] = useState<string>('#FFFFFF');

  // Presets State
  const [savedPresets, setSavedPresets] = useState<readonly SavedDocumentPreset[]>(() =>
    loadSavedPresets(),
  );
  const [recentPresets] = useState<readonly RecentDocumentPreset[]>(() => loadRecentPresets());
  const [isSavingPreset, setIsSavingPreset] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [presetSaveError, setPresetSaveError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const colorInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        nameInputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSelectPreset = useCallback((preset: PresetItem) => {
    setSelectedPresetName(preset.name);
    setWidthPx(preset.width);
    setHeightPx(preset.height);
    setResolution(preset.resolution);
    const targetUnit = preset.defaultUnit ?? (preset.resolution >= 300 ? 'in' : 'px');
    setUnit(targetUnit);
    setWidthText(String(pxToUnit(preset.width, targetUnit, preset.resolution)));
    setHeightText(String(pxToUnit(preset.height, targetUnit, preset.resolution)));
    setOrientation(preset.height > preset.width ? 'portrait' : 'landscape');
  }, []);

  const handleConfirmCreate = useCallback(() => {
    const finalW = Math.max(1, widthPx);
    const finalH = Math.max(1, heightPx);
    const finalTitle = docName.trim() || 'Sem título-1';

    let finalBg = '#FFFFFF';
    if (backgroundType === 'black') finalBg = '#000000';
    else if (backgroundType === 'transparent') finalBg = 'transparent';
    else if (backgroundType === 'custom') finalBg = customBgColor;

    addRecentPreset({
      name: finalTitle,
      width: finalW,
      height: finalH,
      resolution,
      unit,
      colorMode,
      depth: bitDepth,
      background: backgroundType,
      customBgColor: backgroundType === 'custom' ? customBgColor : undefined,
      createdAt: new Date().toISOString(),
    });

    if (options.onCreateDocument) {
      options.onCreateDocument({
        title: finalTitle,
        dimensions: { width: finalW, height: finalH },
        resolution,
        backgroundColor: finalBg,
        colorMode,
      });
    } else {
      engine?.clearCanvas?.();
      if (session?.createNewDocument) {
        session.createNewDocument({ width: finalW, height: finalH }, finalTitle, finalBg);
      } else {
        session?.setPageDimensions({ width: finalW, height: finalH });
        session?.setPageBackground(finalBg);
        session?.setDocumentTitle(finalTitle);
      }
    }

    onClose();
  }, [
    widthPx,
    heightPx,
    docName,
    backgroundType,
    customBgColor,
    resolution,
    unit,
    colorMode,
    bitDepth,
    options,
    engine,
    session,
    onClose,
  ]);

  const handlePresetDoubleClick = useCallback(
    (preset: PresetItem) => {
      handleSelectPreset(preset);
      const finalW = Math.max(1, preset.width);
      const finalH = Math.max(1, preset.height);
      const finalTitle = docName.trim() || preset.name;
      let finalBg = '#FFFFFF';
      if (backgroundType === 'black') finalBg = '#000000';
      else if (backgroundType === 'transparent') finalBg = 'transparent';
      else if (backgroundType === 'custom') finalBg = customBgColor;

      addRecentPreset({
        name: finalTitle,
        width: finalW,
        height: finalH,
        resolution: preset.resolution,
        unit: preset.defaultUnit ?? (preset.resolution >= 300 ? 'in' : 'px'),
        colorMode,
        depth: bitDepth,
        background: backgroundType,
        createdAt: new Date().toISOString(),
      });

      if (options.onCreateDocument) {
        options.onCreateDocument({
          title: finalTitle,
          dimensions: { width: finalW, height: finalH },
          resolution: preset.resolution,
          backgroundColor: finalBg,
          colorMode,
        });
      } else {
        engine?.clearCanvas?.();
        if (session?.createNewDocument) {
          session.createNewDocument({ width: finalW, height: finalH }, finalTitle, finalBg);
        } else {
          session?.setPageDimensions({ width: finalW, height: finalH });
          session?.setPageBackground(finalBg);
          session?.setDocumentTitle(finalTitle);
        }
      }
      onClose();
    },
    [
      handleSelectPreset,
      docName,
      backgroundType,
      customBgColor,
      colorMode,
      bitDepth,
      options,
      engine,
      session,
      onClose,
    ],
  );

  const handleUnitChange = useCallback(
    (newUnit: UnitId) => {
      setUnit(newUnit);
      setWidthText(String(pxToUnit(widthPx, newUnit, resolution)));
      setHeightText(String(pxToUnit(heightPx, newUnit, resolution)));
    },
    [widthPx, heightPx, resolution],
  );

  const commitWidth = useCallback(() => {
    const rawVal = evaluateDimensionExpression(widthText, pxToUnit(widthPx, unit, resolution));
    const newPx = unitToPx(rawVal, unit, resolution);
    setWidthPx(newPx);
    setWidthText(String(rawVal));
    setOrientation(heightPx > newPx ? 'portrait' : 'landscape');
    setSelectedPresetName('');
  }, [widthText, widthPx, heightPx, unit, resolution]);

  const commitHeight = useCallback(() => {
    const rawVal = evaluateDimensionExpression(heightText, pxToUnit(heightPx, unit, resolution));
    const newPx = unitToPx(rawVal, unit, resolution);
    setHeightPx(newPx);
    setHeightText(String(rawVal));
    setOrientation(newPx > widthPx ? 'portrait' : 'landscape');
    setSelectedPresetName('');
  }, [heightText, widthPx, heightPx, unit, resolution]);

  const handleSetOrientation = useCallback(
    (target: 'portrait' | 'landscape') => {
      const isCurrentlyPortrait = heightPx > widthPx;
      const wantsPortrait = target === 'portrait';
      if (isCurrentlyPortrait !== wantsPortrait) {
        const swappedW = heightPx;
        const swappedH = widthPx;
        setWidthPx(swappedW);
        setHeightPx(swappedH);
        setWidthText(String(pxToUnit(swappedW, unit, resolution)));
        setHeightText(String(pxToUnit(swappedH, unit, resolution)));
      }
      setOrientation(target);
      setSelectedPresetName('');
    },
    [heightPx, widthPx, unit, resolution],
  );

  const handleResolutionChange = useCallback(
    (newRes: number) => {
      const safeRes = Math.max(1, Math.min(30000, newRes));
      if (unit !== 'px') {
        const currentPhysicalW = parseFloat(widthText) || 1;
        const currentPhysicalH = parseFloat(heightText) || 1;
        const newWpx = unitToPx(currentPhysicalW, unit, safeRes);
        const newHpx = unitToPx(currentPhysicalH, unit, safeRes);
        setWidthPx(newWpx);
        setHeightPx(newHpx);
      }
      setResolution(safeRes);
    },
    [unit, widthText, heightText],
  );

  const handleSavePreset = useCallback(() => {
    const trimmed = newPresetName.trim();
    if (!trimmed) {
      setPresetSaveError('Informe um nome válido para a predefinição.');
      return;
    }
    const newPreset: SavedDocumentPreset = {
      id: `preset-${Date.now()}`,
      name: trimmed,
      width: widthPx,
      height: heightPx,
      resolution,
      unit,
      colorMode,
      depth: bitDepth,
      background: backgroundType,
      customBgColor: backgroundType === 'custom' ? customBgColor : undefined,
      createdAt: new Date().toISOString(),
    };
    const updated = [newPreset, ...savedPresets];
    setSavedPresets(updated);
    saveSavedPresets(updated);
    setIsSavingPreset(false);
    setNewPresetName('');
    setPresetSaveError(null);
    setActiveCategory('saved');
    setSelectedPresetName(trimmed);
  }, [
    newPresetName,
    widthPx,
    heightPx,
    resolution,
    unit,
    colorMode,
    bitDepth,
    backgroundType,
    customBgColor,
    savedPresets,
  ]);

  const handleDeleteSavedPreset = useCallback(
    (id: string) => {
      const updated = savedPresets.filter((p) => p.id !== id);
      setSavedPresets(updated);
      saveSavedPresets(updated);
    },
    [savedPresets],
  );

  const displayedPresets = useMemo<readonly PresetItem[]>(() => {
    if (activeCategory === 'recent') {
      const recentAsPresets: PresetItem[] = recentPresets.map((r) => ({
        name: r.name,
        width: r.width,
        height: r.height,
        resolution: r.resolution,
        defaultUnit: r.unit,
      }));
      const defaultRecents = NEW_DOCUMENT_CATEGORIES[0]?.presets ?? [];
      const combined = [...recentAsPresets];
      for (const def of defaultRecents) {
        if (!combined.some((c) => c.width === def.width && c.height === def.height)) {
          combined.push(def);
        }
      }
      return combined;
    }
    if (activeCategory === 'saved') {
      return savedPresets.map((s) => ({
        name: s.name,
        width: s.width,
        height: s.height,
        resolution: s.resolution,
        defaultUnit: s.unit,
      }));
    }
    const foundCat = NEW_DOCUMENT_CATEGORIES.find((c) => c.id === activeCategory);
    return foundCat ? foundCat.presets : [];
  }, [activeCategory, recentPresets, savedPresets]);

  return {
    isOpen,
    onClose,
    activeCategory,
    setActiveCategory,
    selectedPresetName,
    docName,
    setDocName,
    unit,
    widthPx,
    heightPx,
    widthText,
    setWidthText,
    heightText,
    setHeightText,
    orientation,
    artboard,
    setArtboard,
    resolution,
    resUnit,
    setResUnit,
    colorMode,
    setColorMode,
    bitDepth,
    setBitDepth,
    backgroundType,
    setBackgroundType,
    customBgColor,
    setCustomBgColor,
    savedPresets,
    isSavingPreset,
    setIsSavingPreset,
    newPresetName,
    setNewPresetName,
    presetSaveError,
    setPresetSaveError,
    nameInputRef,
    colorInputRef,
    displayedPresets,
    handleSelectPreset,
    handlePresetDoubleClick,
    handleUnitChange,
    commitWidth,
    commitHeight,
    handleSetOrientation,
    handleResolutionChange,
    handleSavePreset,
    handleDeleteSavedPreset,
    handleConfirmCreate,
  };
}
