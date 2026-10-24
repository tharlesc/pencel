import { unitToPixels, type BooleanPathOperation, type ShapeVariant } from '@pencel/editor-core';
import type { PresetId } from '@pencel/shared-types';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactElement,
} from 'react';
import { Button, ColorPicker, Icon, Input } from '../../../components/ui/index.js';
import type { LayerItem, SelectedObjectProperties } from '../engine/FabricCanvasAdapter.js';
import {
  CANVA_PALETTE_SWATCHES,
  CANVA_TEMPLATES,
  getFormatPresetsCatalog,
} from '../model/presetCatalog.js';
import {
  DESIGNER_PALETTES,
  generateColormindPalette,
  getColorShadesAndTints,
} from '../services/colorIntelligenceService.js';
import {
  POPULAR_CURATED_EMOJIS,
  POPULAR_CURATED_ICONS,
  getBrandIconUrl,
  searchEmojis,
  searchIconifyIcons,
  type EmojiItem,
  type VectorIconItem,
} from '../services/elementsService.js';
import { searchGiphyStills, type GiphyItem } from '../services/giphyService.js';
import {
  fetchMediaByCategory,
  getCuratedFallbackPhotos,
  searchPublicMedia,
  trackUnsplashDownload,
  type MediaCategory,
  type PublicPhotoItem,
} from '../services/publicMediaService.js';
import type { SidebarCategory } from '../types/editorUi.types.js';
import { LayersPanel } from './LayersPanel/LayersPanel.js';
import styles from './SidebarNav.module.css';

export interface SidebarNavProps {
  readonly activeCategory: SidebarCategory;
  readonly onSelectCategory: (category: SidebarCategory) => void;
  readonly isDrawerOpen: boolean;
  readonly onToggleDrawer: () => void;
  readonly activePresetId: PresetId;
  readonly onSelectPreset: (presetId: PresetId) => void;
  readonly onApplyTemplate: (templateId: string) => void;
  readonly onAddText: (options: {
    text: string;
    fontSize?: number;
    fontWeight?: string | number;
    fontFamily?: string;
    fill?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    boxMode?: 'point' | 'area';
  }) => void;
  readonly onAddShape: (options: { shapeVariant: ShapeVariant; fill?: string }) => void;
  readonly onAddImage: (url: string) => void;
  readonly pageBackground?: string;
  readonly onPageBackgroundChange: (color: string) => void;
  readonly layers: readonly LayerItem[];
  readonly selectedObject?: SelectedObjectProperties | null;
  readonly onSelectLayer: (name: string) => void;
  readonly onDeleteSelected: () => void;
  readonly onBringForward: () => void;
  readonly onSendBackward: () => void;
  readonly onToggleLayerVisibility?: (name: string) => void;
  readonly onToggleLayerLock?: (name: string) => void;
  readonly onSetLayerOpacity?: (name: string, opacity: number) => void;
  readonly onSetLayerBlendMode?: (name: string, blendMode: string) => void;
  readonly onRenameLayer?: (oldName: string, newName: string) => void;
  readonly onReorderLayer?: (name: string, direction: 'up' | 'down') => void;
  readonly onReorderLayerToIndex?: (name: string, targetVisualIndex: number) => void;
  readonly onAddGroup?: () => void;
  readonly onAddCleanLayer?: () => void;
  readonly onDeleteLayerByName?: (name: string) => void;
  readonly onDuplicateSelected?: () => void;
  readonly onSelectMultipleLayers?: (names: readonly string[]) => void;
  readonly onCustomDimensionsCreate?: (dimensions: { width: number; height: number }) => void;
  readonly onToggleLayerMask?: (
    layerName?: string,
    shape?: 'circle' | 'rounded' | 'ellipse',
  ) => void;
  readonly onInvertLayerMask?: (layerName?: string) => void;
  readonly onRemoveLayerMask?: (layerName?: string) => void;
  readonly onPerformBooleanOperation?: (operation: BooleanPathOperation) => void;
}

const RAIL_ITEMS: readonly {
  id: SidebarCategory;
  label: string;
  icon: 'templates' | 'shapes' | 'text' | 'image' | 'palette' | 'layers';
}[] = [
  { id: 'design', label: 'Design', icon: 'templates' },
  { id: 'elements', label: 'Elementos', icon: 'shapes' },
  { id: 'text', label: 'Texto', icon: 'text' },
  { id: 'media', label: 'Mídia', icon: 'image' },
  { id: 'background', label: 'Fundo', icon: 'palette' },
  { id: 'layers', label: 'Camadas', icon: 'layers' },
];

export function SidebarNav({
  activeCategory,
  onSelectCategory,
  isDrawerOpen,
  onToggleDrawer,
  activePresetId,
  onSelectPreset,
  onApplyTemplate,
  onAddText,
  onAddShape,
  onAddImage,
  pageBackground = '#FBFBFD',
  onPageBackgroundChange,
  layers,
  selectedObject,
  onSelectLayer,
  onDeleteSelected,
  onBringForward: _onBringForward,
  onSendBackward: _onSendBackward,
  onToggleLayerVisibility,
  onToggleLayerLock,
  onSetLayerOpacity,
  onSetLayerBlendMode,
  onRenameLayer,
  onReorderLayer,
  onReorderLayerToIndex,
  onAddGroup,
  onAddCleanLayer,
  onDeleteLayerByName,
  onDuplicateSelected,
  onSelectMultipleLayers,
  onCustomDimensionsCreate,
  onToggleLayerMask,
  onInvertLayerMask,
  onRemoveLayerMask,
  onPerformBooleanOperation,
}: SidebarNavProps): ReactElement {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollSentinelRef = useRef<HTMLDivElement | null>(null);
  const elementsSentinelRef = useRef<HTMLDivElement | null>(null);

  // Search & Upload state
  const [searchQuery, setSearchQuery] = useState('');
  const [userUploads, setUserUploads] = useState<string[]>([]);
  const [selectedMediaCategory, setSelectedMediaCategory] = useState<string>('Todos');
  const [mediaSearchQuery, setMediaSearchQuery] = useState<string>('');

  // Custom Size Creator (Photoshop style)
  const [isCustomSizeOpen, setIsCustomSizeOpen] = useState(false);
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);
  const [customUnit, setCustomUnit] = useState<'px' | 'cm' | 'mm' | 'in'>('px');
  const [customDpi, setCustomDpi] = useState<72 | 150 | 300>(72);

  // Media infinite scroll state
  const [mediaPage, setMediaPage] = useState(1);
  const [isLoadingMoreMedia, setIsLoadingMoreMedia] = useState(false);
  const [hasMoreMedia, setHasMoreMedia] = useState(true);
  const [mediaPhotos, setMediaPhotos] = useState<PublicPhotoItem[]>(() =>
    getCuratedFallbackPhotos(),
  );
  const [isLoadingPublicMedia, setIsLoadingPublicMedia] = useState(false);

  // Elements Sub-tabs & Infinite Scroll State (Icons, Stickers, Emojis)
  const [elementsSubTab, setElementsSubTab] = useState<
    'shapes' | 'brands' | 'stickers' | 'icons' | 'emojis'
  >('shapes');
  const [vectorIcons, setVectorIcons] = useState<VectorIconItem[]>([...POPULAR_CURATED_ICONS]);
  const [iconQuery, setIconQuery] = useState('');
  const [iconsOffset, setIconsOffset] = useState(0);
  const [isLoadingIcons, setIsLoadingIcons] = useState(false);
  const [isLoadingMoreIcons, setIsLoadingMoreIcons] = useState(false);
  const [hasMoreIcons, setHasMoreIcons] = useState(true);
  const [iconsError, setIconsError] = useState<string | null>(null);

  const [emojis, setEmojis] = useState<EmojiItem[]>(() => POPULAR_CURATED_EMOJIS.slice(0, 24));
  const [emojiQuery, setEmojiQuery] = useState('');
  const [emojisOffset, setEmojisOffset] = useState(0);
  const [hasMoreEmojis, setHasMoreEmojis] = useState(POPULAR_CURATED_EMOJIS.length > 24);
  const [isLoadingMoreEmojis, setIsLoadingMoreEmojis] = useState(false);

  const [brandQuery, setBrandQuery] = useState('apple');
  const [giphyStickers, setGiphyStickers] = useState<readonly GiphyItem[]>([]);
  const [giphyQuery, setGiphyQuery] = useState('');
  const [giphyOffset, setGiphyOffset] = useState(0);
  const [isLoadingGiphy, setIsLoadingGiphy] = useState(false);
  const [isLoadingMoreGiphy, setIsLoadingMoreGiphy] = useState(false);
  const [hasMoreGiphy, setHasMoreGiphy] = useState(true);
  const [giphyError, setGiphyError] = useState<string | null>(null);

  // Background AI & Color Harmonies
  const [aiPalette, setAiPalette] = useState<string[]>([
    '#0071E3',
    '#30D158',
    '#FF9F0A',
    '#1C1C1E',
    '#F5F5F7',
  ]);
  const [isGeneratingAiPalette, setIsGeneratingAiPalette] = useState(false);
  const [savedPalettes, setSavedPalettes] = useState<
    Array<{ id: string; name: string; colors: string[] }>
  >(() => {
    try {
      const raw = localStorage.getItem('pencel_saved_palettes_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const handleSavePalette = (colorsToSave: string[]): void => {
    const newPal = {
      id: `pal-${Date.now()}`,
      name: `Paleta ${savedPalettes.length + 1}`,
      colors: colorsToSave.slice(0, 5),
    };
    const updated = [newPal, ...savedPalettes];
    setSavedPalettes(updated);
    try {
      localStorage.setItem('pencel_saved_palettes_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleDeleteSavedPalette = (id: string): void => {
    const updated = savedPalettes.filter((p) => p.id !== id);
    setSavedPalettes(updated);
    try {
      localStorage.setItem('pencel_saved_palettes_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Load photos based on category or trending feed
  useEffect(() => {
    if (activeCategory !== 'media' && activeCategory !== 'uploads') return;
    if (mediaSearchQuery.trim()) return;

    let cancelled = false;

    const timer = setTimeout(() => {
      setMediaPage(1);
      setHasMoreMedia(true);
      setIsLoadingPublicMedia(true);
      fetchMediaByCategory(selectedMediaCategory, 1)
        .then((items) => {
          if (!cancelled && items.length > 0) {
            setMediaPhotos(items);
          }
        })
        .catch((err) => {
          console.warn('Failed to load category photos:', err);
        })
        .finally(() => {
          if (!cancelled) setIsLoadingPublicMedia(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeCategory, selectedMediaCategory, mediaSearchQuery]);

  // Debounced search on mediaSearchQuery
  useEffect(() => {
    const q = mediaSearchQuery.trim();
    if (!q) return;

    let cancelled = false;

    const timer = setTimeout(() => {
      setMediaPage(1);
      setHasMoreMedia(true);
      setIsLoadingPublicMedia(true);
      searchPublicMedia(q, 1)
        .then((items) => {
          if (!cancelled) {
            setMediaPhotos(items);
          }
        })
        .catch((err) => {
          console.warn('Failed to search public media:', err);
        })
        .finally(() => {
          if (!cancelled) setIsLoadingPublicMedia(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mediaSearchQuery]);

  // Infinite scroll loader
  const handleLoadMoreMedia = useCallback(async (): Promise<void> => {
    if (isLoadingPublicMedia || isLoadingMoreMedia || !hasMoreMedia) return;
    setIsLoadingMoreMedia(true);
    const nextPage = mediaPage + 1;

    try {
      let nextItems: PublicPhotoItem[] = [];
      if (mediaSearchQuery.trim()) {
        nextItems = await searchPublicMedia(mediaSearchQuery.trim(), nextPage);
      } else {
        nextItems = await fetchMediaByCategory(selectedMediaCategory, nextPage);
      }

      if (nextItems.length > 0) {
        setMediaPhotos((prev) => {
          const seen = new Set(prev.map((p) => p.fullUrl));
          const additions = nextItems.filter((p) => !seen.has(p.fullUrl));
          return [...prev, ...additions];
        });
        setMediaPage(nextPage);
      } else {
        setHasMoreMedia(false);
      }
    } catch (err) {
      console.warn('Error loading more media page:', err);
    } finally {
      setIsLoadingMoreMedia(false);
    }
  }, [
    isLoadingPublicMedia,
    isLoadingMoreMedia,
    hasMoreMedia,
    mediaPage,
    mediaSearchQuery,
    selectedMediaCategory,
  ]);

  // IntersectionObserver for auto-infinite scrolling
  useEffect(() => {
    const sentinel = scrollSentinelRef.current;
    if (!sentinel || activeCategory !== 'media') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void handleLoadMoreMedia();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeCategory, handleLoadMoreMedia]);

  // Iconify Vector Icon Search (Initial page)
  useEffect(() => {
    if (activeCategory !== 'elements' || elementsSubTab !== 'icons') return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setIsLoadingIcons(true);
      setIconsError(null);
      setIconsOffset(0);
      setHasMoreIcons(true);
      searchIconifyIcons(iconQuery, 24, 0)
        .then((items) => {
          if (!cancelled) {
            setVectorIcons(items);
            setHasMoreIcons(items.length >= 12);
          }
        })
        .catch(() => {
          if (!cancelled) setIconsError('Falha ao carregar ícones. Verifique sua conexão.');
        })
        .finally(() => {
          if (!cancelled) setIsLoadingIcons(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeCategory, elementsSubTab, iconQuery]);

  // Emojis Search (Initial page)
  useEffect(() => {
    if (activeCategory !== 'elements' || elementsSubTab !== 'emojis') return;
    let cancelled = false;
    searchEmojis(emojiQuery, 24, 0)
      .then((items) => {
        if (!cancelled) {
          setEmojisOffset(0);
          setEmojis(items);
          setHasMoreEmojis(items.length >= 24);
        }
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [activeCategory, elementsSubTab, emojiQuery]);

  // GIPHY Stills search (Initial page)
  useEffect(() => {
    if (activeCategory !== 'elements' || elementsSubTab !== 'stickers') return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setIsLoadingGiphy(true);
      setGiphyError(null);
      setGiphyOffset(0);
      setHasMoreGiphy(true);
      searchGiphyStills(giphyQuery, 24, 0)
        .then((items) => {
          if (!cancelled) {
            setGiphyStickers(items);
            setHasMoreGiphy(items.length >= 12);
          }
        })
        .catch(() => {
          if (!cancelled) setGiphyError('Não foi possível carregar figurinhas.');
        })
        .finally(() => {
          if (!cancelled) setIsLoadingGiphy(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeCategory, elementsSubTab, giphyQuery]);

  // Infinite scroll loader for Elements & Stickers (Parte II)
  const handleLoadMoreElements = useCallback(async (): Promise<void> => {
    if (activeCategory !== 'elements') return;

    if (elementsSubTab === 'icons') {
      if (isLoadingIcons || isLoadingMoreIcons || !hasMoreIcons) return;
      setIsLoadingMoreIcons(true);
      setIconsError(null);
      const nextOffset = iconsOffset + 24;
      try {
        const nextBatch = await searchIconifyIcons(iconQuery, 24, nextOffset);
        if (nextBatch.length > 0) {
          setVectorIcons((prev) => {
            const seen = new Set(prev.map((item) => item.id));
            const unique = nextBatch.filter((item) => !seen.has(item.id));
            return [...prev, ...unique];
          });
          setIconsOffset(nextOffset);
          if (nextBatch.length < 12) {
            setHasMoreIcons(false);
          }
        } else {
          setHasMoreIcons(false);
        }
      } catch {
        setIconsError('Erro ao carregar mais ícones.');
      } finally {
        setIsLoadingMoreIcons(false);
      }
    } else if (elementsSubTab === 'stickers') {
      if (isLoadingGiphy || isLoadingMoreGiphy || !hasMoreGiphy) return;
      setIsLoadingMoreGiphy(true);
      setGiphyError(null);
      const nextOffset = giphyOffset + 24;
      try {
        const nextBatch = await searchGiphyStills(giphyQuery, 24, nextOffset);
        if (nextBatch.length > 0) {
          setGiphyStickers((prev) => {
            const seen = new Set(prev.map((item) => item.id));
            const unique = nextBatch.filter((item) => !seen.has(item.id));
            return [...prev, ...unique];
          });
          setGiphyOffset(nextOffset);
          if (nextBatch.length < 12) {
            setHasMoreGiphy(false);
          }
        } else {
          setHasMoreGiphy(false);
        }
      } catch {
        setGiphyError('Erro ao carregar mais figurinhas.');
      } finally {
        setIsLoadingMoreGiphy(false);
      }
    } else if (elementsSubTab === 'emojis') {
      if (isLoadingMoreEmojis || !hasMoreEmojis) return;
      setIsLoadingMoreEmojis(true);
      const nextOffset = emojisOffset + 24;
      try {
        const nextBatch = await searchEmojis(emojiQuery, 24, nextOffset);
        if (nextBatch.length > 0) {
          setEmojis((prev) => {
            const seen = new Set(prev.map((item) => item.id));
            const unique = nextBatch.filter((item) => !seen.has(item.id));
            return [...prev, ...unique];
          });
          setEmojisOffset(nextOffset);
          if (nextBatch.length < 24) {
            setHasMoreEmojis(false);
          }
        } else {
          setHasMoreEmojis(false);
        }
      } finally {
        setIsLoadingMoreEmojis(false);
      }
    }
  }, [
    activeCategory,
    elementsSubTab,
    isLoadingIcons,
    isLoadingMoreIcons,
    hasMoreIcons,
    iconsOffset,
    iconQuery,
    isLoadingGiphy,
    isLoadingMoreGiphy,
    hasMoreGiphy,
    giphyOffset,
    giphyQuery,
    isLoadingMoreEmojis,
    hasMoreEmojis,
    emojisOffset,
    emojiQuery,
  ]);

  // IntersectionObserver for Elements & Stickers infinite scroll (Parte II)
  useEffect(() => {
    const sentinel = elementsSentinelRef.current;
    if (
      !sentinel ||
      activeCategory !== 'elements' ||
      !['icons', 'stickers', 'emojis'].includes(elementsSubTab)
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void handleLoadMoreElements();
        }
      },
      { rootMargin: '180px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeCategory, elementsSubTab, handleLoadMoreElements]);

  const handleApplyCustomSize = (): void => {
    const pxW = unitToPixels(customWidth, customUnit, customDpi);
    const pxH = unitToPixels(customHeight, customUnit, customDpi);
    const finalW = Math.max(64, Math.min(8000, Math.round(pxW)));
    const finalH = Math.max(64, Math.min(8000, Math.round(pxH)));
    onCustomDimensionsCreate?.({ width: finalW, height: finalH });
    setIsCustomSizeOpen(false);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setUserUploads((prev) => [objectUrl, ...prev]);
      onAddImage(objectUrl);
    }
  };

  const handleSelectPhoto = (photo: PublicPhotoItem): void => {
    if (photo.downloadLocation) {
      void trackUnsplashDownload(photo.downloadLocation);
    }
    onAddImage(photo.fullUrl);
  };

  const handleGenerateAiPalette = async (): Promise<void> => {
    setIsGeneratingAiPalette(true);
    try {
      const colors = await generateColormindPalette('default');
      setAiPalette(colors);
    } finally {
      setIsGeneratingAiPalette(false);
    }
  };

  const presets = getFormatPresetsCatalog();
  const currentShades = getColorShadesAndTints(aiPalette[0] || '#0071E3');

  return (
    <div className={styles.container}>
      {/* 1. Left Vertical Rail (~68px) */}
      <nav className={styles.rail} aria-label="Ferramentas de criação">
        {RAIL_ITEMS.map((item) => {
          const isActive = activeCategory === item.id && isDrawerOpen;
          return (
            <button
              key={item.id}
              type="button"
              className={[styles.railItem, isActive ? styles.railItemActive : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                if (activeCategory === item.id && isDrawerOpen) {
                  onToggleDrawer();
                } else {
                  onSelectCategory(item.id);
                }
              }}
              aria-pressed={isActive}
            >
              <Icon
                name={item.icon}
                size="md"
                weight={isActive ? 'medium' : 'regular'}
                tone={isActive ? 'active' : 'default'}
              />
              <span className={styles.railLabel}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 2. Expandable Studio Drawer (~320px) */}
      {isDrawerOpen && (
        <aside className={styles.drawer} aria-label={`Painel de ${activeCategory}`}>
          <div className={styles.drawerHeader}>
            <span className={styles.drawerTitle}>
              {activeCategory === 'design' && 'Modelos & Formatos'}
              {activeCategory === 'elements' && 'Formas, Ícones & Emojis'}
              {activeCategory === 'text' && 'Tipografia & Textos'}
              {(activeCategory === 'media' || activeCategory === 'uploads') &&
                'Biblioteca de Imagens'}
              {activeCategory === 'background' && 'Cores & Paletas IA'}
              {activeCategory === 'layers' && 'Camadas da Página'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              icon="chevronLeft"
              onClick={onToggleDrawer}
              aria-label="Recolher painel lateral"
            />
          </div>

          <div
            className={[
              styles.drawerBody,
              activeCategory === 'layers' ? styles.drawerBodyLayers : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {/* DESIGN / TEMPLATES */}
            {activeCategory === 'design' && (
              <div className={styles.section}>
                <Input
                  prefixIcon="search"
                  placeholder="Buscar modelos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery('')}
                />

                {/* Custom Dimensions Creator (Photoshop style) */}
                <div className={styles.subSection}>
                  <button
                    type="button"
                    className={styles.customSizeHeaderBtn}
                    onClick={() => setIsCustomSizeOpen((v) => !v)}
                  >
                    <Icon name={isCustomSizeOpen ? 'minus' : 'plus'} size="xs" />
                    <span>Tamanho Personalizado / Criar Novo</span>
                  </button>

                  {isCustomSizeOpen && (
                    <div className={styles.customSizeCard}>
                      <div className={styles.customInputsRow}>
                        <div className={styles.customInputGroup}>
                          <span className={styles.customInputLabel}>Largura</span>
                          <input
                            type="number"
                            min={64}
                            max={8000}
                            value={customWidth}
                            onChange={(e) =>
                              setCustomWidth(Math.max(1, Number.parseInt(e.target.value, 10) || 1))
                            }
                            className={styles.customNumberInput}
                          />
                        </div>
                        <div className={styles.customInputGroup}>
                          <span className={styles.customInputLabel}>Altura</span>
                          <input
                            type="number"
                            min={64}
                            max={8000}
                            value={customHeight}
                            onChange={(e) =>
                              setCustomHeight(Math.max(1, Number.parseInt(e.target.value, 10) || 1))
                            }
                            className={styles.customNumberInput}
                          />
                        </div>
                      </div>

                      <div className={styles.customSelectGroup}>
                        <div className={styles.customInputGroup}>
                          <span className={styles.customInputLabel}>Unidade</span>
                          <select
                            value={customUnit}
                            onChange={(e) =>
                              setCustomUnit(e.target.value as 'px' | 'cm' | 'mm' | 'in')
                            }
                            className={styles.customSelectInput}
                          >
                            <option value="px">Pixels (px)</option>
                            <option value="cm">Centímetros (cm)</option>
                            <option value="mm">Milímetros (mm)</option>
                            <option value="in">Polegadas (in)</option>
                          </select>
                        </div>

                        <div className={styles.customInputGroup}>
                          <span className={styles.customInputLabel}>Resolução</span>
                          <select
                            value={customDpi}
                            onChange={(e) =>
                              setCustomDpi(Number.parseInt(e.target.value, 10) as 72 | 150 | 300)
                            }
                            className={styles.customSelectInput}
                          >
                            <option value={72}>72 DPI (Web)</option>
                            <option value={150}>150 DPI (Média)</option>
                            <option value={300}>300 DPI (Impressão)</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleApplyCustomSize}
                        className={styles.customApplyBtn}
                      >
                        Criar Novo Documento
                      </button>
                    </div>
                  )}
                </div>

                <div className={styles.subSection}>
                  <span className={styles.subTitle}>Formatos de Redes Sociais</span>
                  <div className={styles.presetsGrid}>
                    {presets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className={[
                          styles.presetPill,
                          preset.id === activePresetId ? styles.presetPillActive : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => onSelectPreset(preset.id)}
                      >
                        <span className={styles.presetPillName}>{preset.name}</span>
                        <span className={styles.presetPillDim}>
                          {preset.dimensions.width}×{preset.dimensions.height}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.subSection}>
                  <span className={styles.subTitle}>Modelos Prontos</span>
                  <div className={styles.templatesGrid}>
                    {CANVA_TEMPLATES.filter((t) =>
                      t.name.toLowerCase().includes(searchQuery.toLowerCase()),
                    ).map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        className={styles.templateCard}
                        style={{ backgroundColor: template.previewBg }}
                        onClick={() => onApplyTemplate(template.id)}
                      >
                        <div
                          className={styles.templateBadge}
                          style={{ backgroundColor: template.previewAccent }}
                        >
                          {template.badgeText}
                        </div>
                        <div className={styles.templateHeadline}>{template.headlineText}</div>
                        <div className={styles.templateMeta}>{template.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ELEMENTOS / SHAPES, ICONS, EMOJIS, BRANDS */}
            {activeCategory === 'elements' && (
              <div className={styles.section}>
                {/* Segmented Sub-tabs */}
                <div className={styles.segmentedSubTabs} role="tablist">
                  <button
                    type="button"
                    className={[
                      styles.subTabBtn,
                      elementsSubTab === 'shapes' ? styles.subTabBtnActive : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setElementsSubTab('shapes')}
                  >
                    Formas
                  </button>
                  <button
                    type="button"
                    className={[
                      styles.subTabBtn,
                      elementsSubTab === 'icons' ? styles.subTabBtnActive : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setElementsSubTab('icons')}
                  >
                    Ícones
                  </button>
                  <button
                    type="button"
                    className={[
                      styles.subTabBtn,
                      elementsSubTab === 'emojis' ? styles.subTabBtnActive : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setElementsSubTab('emojis')}
                  >
                    Emojis
                  </button>
                  <button
                    type="button"
                    className={[
                      styles.subTabBtn,
                      elementsSubTab === 'stickers' ? styles.subTabBtnActive : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setElementsSubTab('stickers')}
                  >
                    Figurinhas
                  </button>
                  <button
                    type="button"
                    className={[
                      styles.subTabBtn,
                      elementsSubTab === 'brands' ? styles.subTabBtnActive : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setElementsSubTab('brands')}
                  >
                    Marcas
                  </button>
                </div>

                {/* Subtab 1: Formas Vetoriais e Operações Booleanas (Parte V) */}
                {elementsSubTab === 'shapes' && (
                  <>
                    <div className={styles.subSection}>
                      <span className={styles.subTitle}>Formas Vetoriais</span>
                      <div className={styles.shapesGrid}>
                        <button
                          type="button"
                          className={styles.shapeBtn}
                          onClick={() => onAddShape({ shapeVariant: 'rectangle', fill: '#0071E3' })}
                          aria-label="Adicionar Retângulo"
                        >
                          <div className={styles.shapePreviewRect} />
                          <span>Retângulo</span>
                        </button>

                        <button
                          type="button"
                          className={styles.shapeBtn}
                          onClick={() =>
                            onAddShape({ shapeVariant: 'rounded-rectangle', fill: '#0066CC' })
                          }
                          aria-label="Adicionar Retângulo Arredondado"
                        >
                          <div className={styles.shapePreviewPill} />
                          <span>Arredondado</span>
                        </button>

                        <button
                          type="button"
                          className={styles.shapeBtn}
                          onClick={() => onAddShape({ shapeVariant: 'circle', fill: '#FF9500' })}
                          aria-label="Adicionar Círculo"
                        >
                          <div className={styles.shapePreviewCircle} />
                          <span>Círculo</span>
                        </button>

                        <button
                          type="button"
                          className={styles.shapeBtn}
                          onClick={() => onAddShape({ shapeVariant: 'ellipse', fill: '#0891B2' })}
                          aria-label="Adicionar Elipse"
                        >
                          <div className={styles.shapePreviewPill} />
                          <span>Elipse</span>
                        </button>

                        <button
                          type="button"
                          className={styles.shapeBtn}
                          onClick={() => onAddShape({ shapeVariant: 'pill', fill: '#30D158' })}
                          aria-label="Adicionar Pílula"
                        >
                          <div className={styles.shapePreviewPill} />
                          <span>Pílula</span>
                        </button>

                        <button
                          type="button"
                          className={styles.shapeBtn}
                          onClick={() => onAddShape({ shapeVariant: 'triangle', fill: '#AF52DE' })}
                          aria-label="Adicionar Triângulo"
                        >
                          <div className={styles.shapePreviewTriangle} />
                          <span>Triângulo</span>
                        </button>

                        <button
                          type="button"
                          className={styles.shapeBtn}
                          onClick={() => onAddShape({ shapeVariant: 'polygon', fill: '#2563EB' })}
                          aria-label="Adicionar Polígono Hexágono"
                        >
                          <div className={styles.shapePreviewRect} />
                          <span>Hexágono</span>
                        </button>

                        <button
                          type="button"
                          className={styles.shapeBtn}
                          onClick={() => onAddShape({ shapeVariant: 'star', fill: '#EAB308' })}
                          aria-label="Adicionar Estrela"
                        >
                          <div className={styles.shapePreviewTriangle} />
                          <span>Estrela</span>
                        </button>

                        <button
                          type="button"
                          className={styles.shapeBtn}
                          onClick={() => onAddShape({ shapeVariant: 'line', fill: '#1D1D1F' })}
                          aria-label="Adicionar Linha"
                        >
                          <div className={styles.shapePreviewLine} />
                          <span>Linha</span>
                        </button>
                      </div>
                    </div>

                    {onPerformBooleanOperation && (
                      <div className={styles.subSection}>
                        <span className={styles.subTitle}>Operações Booleanas (Pathfinder)</span>
                        <div className={styles.presetsGrid}>
                          <button
                            type="button"
                            className={styles.presetPill}
                            onClick={() => onPerformBooleanOperation('union')}
                            title="Unir duas formas selecionadas"
                          >
                            <span className={styles.presetPillName}>União</span>
                            <span className={styles.presetPillDim}>A ∪ B</span>
                          </button>
                          <button
                            type="button"
                            className={styles.presetPill}
                            onClick={() => onPerformBooleanOperation('intersect')}
                            title="Interseção de duas formas"
                          >
                            <span className={styles.presetPillName}>Interseção</span>
                            <span className={styles.presetPillDim}>A ∩ B</span>
                          </button>
                          <button
                            type="button"
                            className={styles.presetPill}
                            onClick={() => onPerformBooleanOperation('subtract')}
                            title="Subtrair forma superior da base"
                          >
                            <span className={styles.presetPillName}>Subtrair</span>
                            <span className={styles.presetPillDim}>A − B</span>
                          </button>
                          <button
                            type="button"
                            className={styles.presetPill}
                            onClick={() => onPerformBooleanOperation('exclude')}
                            title="Exclusão simétrica (XOR)"
                          >
                            <span className={styles.presetPillName}>Excluir</span>
                            <span className={styles.presetPillDim}>A ⊕ B</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className={styles.subSection}>
                      <span className={styles.subTitle}>Selos e Marcadores</span>
                      <div className={styles.badgesGrid}>
                        <button
                          type="button"
                          className={styles.badgeItemBtn}
                          onClick={() => {
                            onAddShape({ shapeVariant: 'pill', fill: '#DC2626' });
                            onAddText({
                              text: 'DESTAQUE',
                              fontSize: 22,
                              fill: '#F8FAFC',
                              fontWeight: 'bold',
                            });
                          }}
                        >
                          <span className={styles.badgeSale}>DESTAQUE</span>
                        </button>

                        <button
                          type="button"
                          className={styles.badgeItemBtn}
                          onClick={() => {
                            onAddShape({ shapeVariant: 'pill', fill: '#16A34A' });
                            onAddText({
                              text: 'LANÇAMENTO',
                              fontSize: 20,
                              fill: '#F8FAFC',
                              fontWeight: 'bold',
                            });
                          }}
                        >
                          <span className={styles.badgeNew}>LANÇAMENTO</span>
                        </button>

                        <button
                          type="button"
                          className={styles.badgeItemBtn}
                          onClick={() => {
                            onAddShape({ shapeVariant: 'pill', fill: '#0066CC' });
                            onAddText({
                              text: 'AUTÊNTICO',
                              fontSize: 20,
                              fill: '#F8FAFC',
                              fontWeight: 'bold',
                            });
                          }}
                        >
                          <span className={styles.badgeVerified}>AUTÊNTICO</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Subtab 2: Ícones Vetoriais (Iconify API com Scroll Infinito) */}
                {elementsSubTab === 'icons' && (
                  <div className={styles.subSection}>
                    <Input
                      prefixIcon="search"
                      type="search"
                      placeholder="Buscar entre +200.000 ícones..."
                      value={iconQuery}
                      onChange={(e) => setIconQuery(e.target.value)}
                      onClear={() => setIconQuery('')}
                    />
                    <span className={styles.subTitle}>Ícones Vetoriais ({vectorIcons.length})</span>

                    {isLoadingIcons && vectorIcons.length === 0 ? (
                      <span className={styles.emptySearch}>Carregando ícones vetoriais...</span>
                    ) : vectorIcons.length === 0 ? (
                      <span className={styles.emptySearch}>Nenhum ícone encontrado.</span>
                    ) : (
                      <div className={styles.iconsGrid}>
                        {vectorIcons.map((ic) => (
                          <button
                            key={ic.id}
                            type="button"
                            className={styles.iconElementCard}
                            onClick={() => onAddImage(ic.svgUrl)}
                            title={`Adicionar ${ic.name}`}
                            aria-label={`Adicionar ícone ${ic.name}`}
                          >
                            <img
                              src={ic.svgUrl}
                              alt={ic.name}
                              className={styles.iconElementSvg}
                              loading="lazy"
                            />
                            <span className={styles.iconElementName}>{ic.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Infinite Scroll Sentinel for Icons */}
                    <div ref={elementsSentinelRef} className={styles.infiniteScrollSentinel}>
                      {isLoadingMoreIcons && (
                        <span className={styles.loadingMoreText}>Carregando mais ícones...</span>
                      )}
                      {iconsError && (
                        <button
                          type="button"
                          onClick={() => void handleLoadMoreElements()}
                          className={styles.loadMoreBtn}
                        >
                          {iconsError} Tentar novamente
                        </button>
                      )}
                      {!isLoadingMoreIcons && !iconsError && hasMoreIcons && (
                        <button
                          type="button"
                          onClick={() => void handleLoadMoreElements()}
                          className={styles.loadMoreBtn}
                        >
                          Carregar mais ícones
                        </button>
                      )}
                      {!hasMoreIcons && vectorIcons.length > 0 && (
                        <span className={styles.loadingMoreText}>Fim dos resultados</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Subtab 3: Emojis (Com Scroll Infinito) */}
                {elementsSubTab === 'emojis' && (
                  <div className={styles.subSection}>
                    <Input
                      prefixIcon="search"
                      type="search"
                      placeholder="Buscar emoji..."
                      value={emojiQuery}
                      onChange={(e) => setEmojiQuery(e.target.value)}
                      onClear={() => setEmojiQuery('')}
                    />
                    <span className={styles.subTitle}>Emojis ({emojis.length})</span>
                    <div className={styles.emojisGrid}>
                      {emojis.map((em) => (
                        <button
                          key={em.id}
                          type="button"
                          className={styles.emojiCard}
                          onClick={() =>
                            onAddText({
                              text: em.char,
                              fontSize: 64,
                              boxMode: 'point',
                            })
                          }
                          title={`${em.name} (${em.char})`}
                          aria-label={`Adicionar emoji ${em.name}`}
                        >
                          <span className={styles.emojiChar}>{em.char}</span>
                        </button>
                      ))}
                    </div>

                    {/* Infinite Scroll Sentinel for Emojis */}
                    <div ref={elementsSentinelRef} className={styles.infiniteScrollSentinel}>
                      {isLoadingMoreEmojis && (
                        <span className={styles.loadingMoreText}>Carregando mais emojis...</span>
                      )}
                      {!isLoadingMoreEmojis && hasMoreEmojis && (
                        <button
                          type="button"
                          onClick={() => void handleLoadMoreElements()}
                          className={styles.loadMoreBtn}
                        >
                          Carregar mais emojis
                        </button>
                      )}
                      {!hasMoreEmojis && emojis.length > 0 && (
                        <span className={styles.loadingMoreText}>Fim dos resultados</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Subtab 4: Logos de Marcas (IconHorse / FaviconDL) */}
                {elementsSubTab === 'brands' && (
                  <div className={styles.subSection}>
                    <span className={styles.subTitle}>Logos & Favicons de Marcas</span>
                    <Input
                      prefixIcon="search"
                      placeholder="Ex: apple, google, github, spotify..."
                      value={brandQuery}
                      onChange={(e) => setBrandQuery(e.target.value)}
                      onClear={() => setBrandQuery('')}
                    />
                    <div className={styles.brandQuickGrid}>
                      {[
                        'apple.com',
                        'google.com',
                        'github.com',
                        'spotify.com',
                        'youtube.com',
                        'instagram.com',
                        'whatsapp.com',
                        'x.com',
                        'figma.com',
                        'discord.com',
                      ].map((dom) => (
                        <button
                          key={dom}
                          type="button"
                          className={styles.brandCard}
                          onClick={() => onAddImage(getBrandIconUrl(dom))}
                          title={`Adicionar logo de ${dom}`}
                        >
                          <img
                            src={getBrandIconUrl(dom)}
                            alt={dom}
                            className={styles.brandFavicon}
                          />
                          <span className={styles.brandDomainName}>{dom.replace('.com', '')}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subtab 5: Figurinhas GIPHY (Stills estáticos com Scroll Infinito) */}
                {elementsSubTab === 'stickers' && (
                  <div className={styles.subSection}>
                    <Input
                      prefixIcon="search"
                      type="search"
                      placeholder="Buscar figurinhas Giphy..."
                      value={giphyQuery}
                      onChange={(e) => setGiphyQuery(e.target.value)}
                      onClear={() => setGiphyQuery('')}
                    />
                    <span className={styles.subTitle}>
                      {giphyQuery.trim()
                        ? `Figurinhas para "${giphyQuery}" (${giphyStickers.length})`
                        : `Figurinhas em Destaque (${giphyStickers.length})`}
                    </span>

                    {isLoadingGiphy && giphyStickers.length === 0 ? (
                      <span className={styles.emptySearch}>Carregando figurinhas...</span>
                    ) : giphyStickers.length === 0 ? (
                      <span className={styles.emptySearch}>Nenhuma figurinha encontrada.</span>
                    ) : (
                      <div className={styles.giphyGrid}>
                        {giphyStickers.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={styles.giphyItemBtn}
                            onClick={() => onAddImage(item.staticUrl)}
                            title={item.title}
                          >
                            <img
                              src={item.previewUrl}
                              alt={item.title}
                              className={styles.giphyImageThumb}
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Infinite Scroll Sentinel for Stickers */}
                    <div ref={elementsSentinelRef} className={styles.infiniteScrollSentinel}>
                      {isLoadingMoreGiphy && (
                        <span className={styles.loadingMoreText}>
                          Carregando mais figurinhas...
                        </span>
                      )}
                      {giphyError && (
                        <button
                          type="button"
                          onClick={() => void handleLoadMoreElements()}
                          className={styles.loadMoreBtn}
                        >
                          {giphyError} Tentar novamente
                        </button>
                      )}
                      {!isLoadingMoreGiphy && !giphyError && hasMoreGiphy && (
                        <button
                          type="button"
                          onClick={() => void handleLoadMoreElements()}
                          className={styles.loadMoreBtn}
                        >
                          Carregar mais figurinhas
                        </button>
                      )}
                      {!hasMoreGiphy && giphyStickers.length > 0 && (
                        <span className={styles.loadingMoreText}>Fim dos resultados</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TEXTO */}
            {activeCategory === 'text' && (
              <div className={styles.section}>
                <Button
                  variant="primary"
                  size="md"
                  icon="plus"
                  className={styles.fullWidthBtn}
                  onClick={() =>
                    onAddText({
                      text: 'Seu texto aqui',
                      fontSize: 32,
                      fontWeight: 'normal',
                      boxMode: 'area',
                    })
                  }
                >
                  Adicionar uma caixa de texto
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  icon="text"
                  className={styles.fullWidthBtn}
                  onClick={() =>
                    onAddText({
                      text: 'Texto de linha livre',
                      fontSize: 36,
                      fontWeight: 'bold',
                      boxMode: 'point',
                    })
                  }
                >
                  Adicionar texto de ponto (Linha)
                </Button>

                <div className={styles.subSection}>
                  <span className={styles.subTitle}>Estilos de Texto Padrão</span>
                  <div className={styles.textPresets}>
                    <button
                      type="button"
                      className={styles.textPresetHeading}
                      onClick={() =>
                        onAddText({
                          text: 'Adicionar um título',
                          fontSize: 48,
                          fontWeight: 'bold',
                        })
                      }
                    >
                      Adicionar um título
                    </button>

                    <button
                      type="button"
                      className={styles.textPresetSubheading}
                      onClick={() =>
                        onAddText({
                          text: 'Adicionar um subtítulo',
                          fontSize: 28,
                          fontWeight: '600',
                          fill: '#515154',
                        })
                      }
                    >
                      Adicionar um subtítulo
                    </button>

                    <button
                      type="button"
                      className={styles.textPresetBody}
                      onClick={() =>
                        onAddText({
                          text: 'Inserir um pouco de texto no corpo da página para detalhar a sua mensagem.',
                          fontSize: 18,
                          fontWeight: 'normal',
                          fill: '#6E6E73',
                        })
                      }
                    >
                      Inserir um pouco de texto
                    </button>
                  </div>
                </div>

                <div className={styles.subSection}>
                  <span className={styles.subTitle}>Combinações de Fontes</span>
                  <div className={styles.fontCombosGrid}>
                    <button
                      type="button"
                      className={styles.comboCard}
                      onClick={() =>
                        onAddText({
                          text: 'EDIÇÃO ESPECIAL',
                          fontSize: 38,
                          fontWeight: 'bold',
                          fill: '#DC2626',
                        })
                      }
                    >
                      <span className={styles.comboSale}>EDIÇÃO ESPECIAL</span>
                    </button>

                    <button
                      type="button"
                      className={styles.comboCard}
                      onClick={() =>
                        onAddText({
                          text: 'Elegante & Moderno',
                          fontSize: 34,
                          fontFamily: 'Georgia, serif',
                          fontWeight: 'normal',
                          fill: '#1D1D1F',
                        })
                      }
                    >
                      <span className={styles.comboEditorial}>Elegante & Moderno</span>
                    </button>

                    <button
                      type="button"
                      className={styles.comboCard}
                      onClick={() =>
                        onAddText({
                          text: 'FLASH SALE',
                          fontSize: 42,
                          fontFamily: 'Impact, sans-serif',
                          fill: '#0071E3',
                        })
                      }
                    >
                      <span className={styles.comboBold}>FLASH SALE</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MÍDIA & FOTOS COM FEED INFINITO E ATRIBUIÇÃO HOVER */}
            {(activeCategory === 'media' || activeCategory === 'uploads') && (
              <div className={styles.section}>
                {/* Busca de Fotos Gratuitas */}
                <Input
                  prefixIcon="search"
                  type="search"
                  placeholder="Buscar fotos gratuitas..."
                  value={mediaSearchQuery}
                  onChange={(e) => setMediaSearchQuery(e.target.value)}
                  onClear={() => setMediaSearchQuery('')}
                  aria-label="Buscar fotos gratuitas"
                />

                {/* Filtro por Categorias Principais (Estilo Segmentado dos Elementos) */}
                <div
                  className={styles.segmentedSubTabs}
                  role="tablist"
                  aria-label="Categorias principais de fotos"
                >
                  {(['Todos', 'Fotos', 'Natureza', 'Pessoas', 'Fundos'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      role="tab"
                      aria-selected={selectedMediaCategory === cat}
                      className={[
                        styles.subTabBtn,
                        selectedMediaCategory === cat ? styles.subTabBtnActive : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => setSelectedMediaCategory(cat as MediaCategory)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <Button
                  variant="primary"
                  size="md"
                  icon="upload"
                  className={styles.fullWidthBtn}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Fazer upload do seu dispositivo
                </Button>

                {userUploads.length > 0 && (
                  <div className={styles.subSection}>
                    <span className={styles.subTitle}>Seus Arquivos</span>
                    <div className={styles.photosGrid}>
                      {userUploads.map((src, i) => (
                        <button
                          key={i}
                          type="button"
                          className={styles.photoThumb}
                          onClick={() => onAddImage(src)}
                        >
                          <img src={src} alt="Upload do usuário" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.subSection}>
                  <div className={styles.mediaHeaderRow}>
                    <span className={styles.subTitle}>Galeria de Fotos ({mediaPhotos.length})</span>
                    <div className={styles.mediaHeaderRight}>
                      {isLoadingPublicMedia && (
                        <span className={styles.loadingTag}>Carregando...</span>
                      )}
                      <a
                        href="https://unsplash.com/?utm_source=pencelstudio&utm_medium=referral"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.unsplashBadgeLink}
                        title="Acervo oficial Unsplash & Picsum"
                      >
                        via Unsplash
                      </a>
                    </div>
                  </div>

                  {/* Grid com Atribuição Unsplash no Hover */}
                  <div className={styles.photosGrid}>
                    {mediaPhotos.map((photo) => (
                      <div key={photo.id} className={styles.photoCard}>
                        <div className={styles.photoThumbWrapper}>
                          <button
                            type="button"
                            className={styles.photoThumb}
                            onClick={() => handleSelectPhoto(photo)}
                            title={`${photo.title} (${photo.source}) - Clique para adicionar à prancheta`}
                            aria-label={`Adicionar foto ${photo.title}`}
                          >
                            <img src={photo.thumbUrl} alt={photo.title} loading="lazy" />
                            <span className={styles.photoSourceTag}>{photo.source}</span>
                          </button>

                          {/* Hover Overlay de Atribuição (exibido apenas ao passar o mouse) */}
                          <div className={styles.photoHoverOverlay}>
                            <span className={styles.hoverTitle}>{photo.title}</span>
                            {photo.authorUrl ? (
                              <div className={styles.hoverAttribution}>
                                <span>Foto por </span>
                                <a
                                  href={photo.authorUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.hoverLink}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {photo.author}
                                </a>
                                <span> na </span>
                                <a
                                  href="https://unsplash.com/?utm_source=pencelstudio&utm_medium=referral"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.hoverLink}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Unsplash
                                </a>
                              </div>
                            ) : (
                              <span className={styles.hoverAttribution}>{photo.author}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Infinite Scroll Sentinel & Loader */}
                  <div ref={scrollSentinelRef} className={styles.infiniteScrollSentinel}>
                    {isLoadingMoreMedia && (
                      <span className={styles.loadingMoreText}>
                        Carregando mais imagens do acervo...
                      </span>
                    )}
                    {!isLoadingMoreMedia && hasMoreMedia && (
                      <button
                        type="button"
                        onClick={handleLoadMoreMedia}
                        className={styles.loadMoreBtn}
                      >
                        Carregar mais imagens
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* FUNDO / PALETAS IA & HARMONIA PICKSHADE */}
            {activeCategory === 'background' && (
              <div className={styles.section}>
                {/* Sistema de Coloração Harmônica */}
                <div className={styles.subSection}>
                  <div className={styles.aiPaletteHeader}>
                    <span className={styles.subTitle}>Paleta Harmônica</span>
                    <button
                      type="button"
                      onClick={handleGenerateAiPalette}
                      disabled={isGeneratingAiPalette}
                      className={styles.studioSuggestBtn}
                      title="Sugerir combinação de cores"
                    >
                      <Icon name="palette" size="xs" />
                      <span>{isGeneratingAiPalette ? 'Gerando...' : 'Sugerir Cores'}</span>
                    </button>
                  </div>

                  <div className={styles.paletteBarPreview}>
                    {aiPalette.map((color, idx) => (
                      <button
                        key={`${color}-${idx}`}
                        type="button"
                        className={styles.paletteBarItem}
                        style={{ backgroundColor: color }}
                        onClick={() => onPageBackgroundChange(color)}
                        title={`Aplicar ${color} ao fundo`}
                        aria-label={`Cor da paleta ${color}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Minhas Paletas Salvas */}
                <div className={styles.subSection}>
                  <div className={styles.savedPalettesHeader}>
                    <span className={styles.subTitle}>Minhas Paletas</span>
                    <button
                      type="button"
                      onClick={() => handleSavePalette(aiPalette)}
                      className={styles.studioSuggestBtn}
                      title="Salvar paleta atual"
                    >
                      <Icon name="plus" size="xs" />
                      <span>Salvar Atual</span>
                    </button>
                  </div>

                  {savedPalettes.length === 0 ? (
                    <span className={styles.savedPalettesEmpty}>
                      Nenhuma paleta salva. Clique em &quot;Salvar Atual&quot; para guardar.
                    </span>
                  ) : (
                    <div className={styles.savedPalettesList}>
                      {savedPalettes.map((pal) => (
                        <div key={pal.id} className={styles.savedPaletteCard}>
                          <span className={styles.savedPaletteName}>{pal.name}</span>
                          <div className={styles.savedPaletteSwatches}>
                            {pal.colors.map((c) => (
                              <button
                                key={c}
                                type="button"
                                className={styles.savedSwatchItem}
                                style={{ backgroundColor: c }}
                                onClick={() => onPageBackgroundChange(c)}
                                title={`Aplicar ${c}`}
                              />
                            ))}
                          </div>
                          <button
                            type="button"
                            className={styles.savedPaletteDeleteBtn}
                            onClick={() => handleDeleteSavedPalette(pal.id)}
                            title="Excluir paleta"
                            aria-label={`Excluir ${pal.name}`}
                          >
                            <Icon name="trash" size="xs" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Harmonia de Tons e Sombras (Pickshade style) */}
                <div className={styles.subSection}>
                  <span className={styles.subTitle}>Tons & Sombras da Cor Ativa</span>
                  <div className={styles.shadesStrip}>
                    <span className={styles.shadesLabel}>Tons Claros</span>
                    <div className={styles.shadesRow}>
                      {currentShades.tints.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={styles.shadeSwatch}
                          style={{ backgroundColor: c }}
                          onClick={() => onPageBackgroundChange(c)}
                          title={`Tom claro: ${c}`}
                        />
                      ))}
                    </div>
                    <span className={styles.shadesLabel}>Tons Escuros</span>
                    <div className={styles.shadesRow}>
                      {currentShades.shades.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={styles.shadeSwatch}
                          style={{ backgroundColor: c }}
                          onClick={() => onPageBackgroundChange(c)}
                          title={`Tom escuro: ${c}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Paletas de Designer Curadas */}
                <div className={styles.subSection}>
                  <span className={styles.subTitle}>Paletas de Design Selecionadas</span>
                  <div className={styles.curatedPalettesList}>
                    {DESIGNER_PALETTES.map((pal) => (
                      <div key={pal.id} className={styles.curatedPaletteRow}>
                        <span className={styles.curatedPaletteName}>{pal.name}</span>
                        <div className={styles.curatedPaletteSwatches}>
                          {pal.colors.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={styles.curatedSwatchItem}
                              style={{ backgroundColor: c }}
                              onClick={() => onPageBackgroundChange(c)}
                              title={`Aplicar ${c}`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cores Padrão & Espectro Contínuo */}
                <div className={styles.subSection}>
                  <span className={styles.subTitle}>Espectro e Cores de Fundo</span>

                  <div className={styles.sidebarColorPickerWrapper}>
                    <ColorPicker
                      color={
                        pageBackground.startsWith('#') && pageBackground.length === 7
                          ? pageBackground
                          : '#0071E3'
                      }
                      onChange={onPageBackgroundChange}
                    />
                  </div>

                  <div className={styles.colorSwatchesGrid}>
                    {CANVA_PALETTE_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.value}
                        type="button"
                        className={styles.colorGridItem}
                        style={{ backgroundColor: swatch.value }}
                        onClick={() => onPageBackgroundChange(swatch.value)}
                        title={`${swatch.label} (${swatch.value})`}
                      >
                        <span className={styles.swatchHoverLabel}>{swatch.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CAMADAS */}
            {activeCategory === 'layers' && (
              <LayersPanel
                layers={layers}
                selectedObject={selectedObject ?? null}
                onSelectLayer={onSelectLayer}
                onSelectMultipleLayers={onSelectMultipleLayers}
                onToggleVisibility={onToggleLayerVisibility ?? (() => {})}
                onToggleLock={onToggleLayerLock ?? (() => {})}
                onSetOpacity={onSetLayerOpacity ?? (() => {})}
                onSetBlendMode={onSetLayerBlendMode ?? (() => {})}
                onRenameLayer={onRenameLayer ?? (() => {})}
                onReorderLayer={onReorderLayer ?? (() => {})}
                onReorderLayerToIndex={onReorderLayerToIndex}
                onDeleteLayer={onDeleteLayerByName ?? onDeleteSelected}
                onDuplicateLayer={onDuplicateSelected ?? (() => {})}
                onAddNewLayer={onAddCleanLayer ?? (() => onAddText({ text: 'Nova Camada' }))}
                onAddGroup={onAddGroup}
                onToggleLayerMask={onToggleLayerMask}
                onInvertLayerMask={onInvertLayerMask}
                onRemoveLayerMask={onRemoveLayerMask}
              />
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
