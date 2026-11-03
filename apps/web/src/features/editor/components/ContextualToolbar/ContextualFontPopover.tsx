import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { Icon, Input } from '../../../../components/ui/index.js';
import {
  EXPANDED_FONT_CATALOG,
  fetchDynamicGoogleFontsCatalog,
  loadWebFont,
  type FontOption,
} from '../../services/fontLoaderService.js';
import styles from './ContextualToolbar.module.css';

export interface ContextualFontPopoverProps {
  readonly currentFamily: string;
  readonly onSelectFamily: (family: string) => void;
  readonly onClose: () => void;
}

export function ContextualFontPopover({
  currentFamily,
  onSelectFamily,
  onClose,
}: ContextualFontPopoverProps): ReactElement {
  const [fontSearch, setFontSearch] = useState('');
  const [catalog, setCatalog] = useState<readonly FontOption[]>(EXPANDED_FONT_CATALOG);

  useEffect(() => {
    void fetchDynamicGoogleFontsCatalog().then((fonts) => {
      setCatalog([...fonts]);
    });
  }, []);

  const filteredCategories = useMemo(() => {
    const cats = ['Sans-Serif', 'Serif', 'Display', 'Script', 'Monospace'] as const;
    const query = fontSearch.trim().toLowerCase();
    return cats
      .map((cat) => {
        const fonts = catalog.filter(
          (f) =>
            f.category === cat &&
            (f.label.toLowerCase().includes(query) || f.family.toLowerCase().includes(query)),
        );
        return { cat, fonts };
      })
      .filter((group) => group.fonts.length > 0);
  }, [fontSearch, catalog]);

  return (
    <div className={styles.fontMenuPopover} onClick={(e) => e.stopPropagation()}>
      <div className={styles.fontSearchContainer}>
        <Input
          prefixIcon="search"
          placeholder="Buscar fonte..."
          value={fontSearch}
          onChange={(e) => setFontSearch(e.target.value)}
          onClear={() => setFontSearch('')}
          autoFocus
        />
      </div>

      <div className={styles.fontMenuList}>
        {filteredCategories.map(({ cat, fonts }) => (
          <div key={cat} className={styles.fontMenuCategory}>
            <span className={styles.fontCategoryHeader}>
              {cat} ({fonts.length})
            </span>
            {fonts.map((font) => {
              const isSelected =
                font.family.toLowerCase() === currentFamily.toLowerCase() ||
                font.label.toLowerCase() === currentFamily.toLowerCase();
              return (
                <button
                  key={font.id}
                  type="button"
                  className={[styles.fontMenuItem, isSelected ? styles.fontMenuItemActive : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => {
                    void loadWebFont(font);
                    onSelectFamily(font.family);
                    onClose();
                  }}
                  onMouseEnter={() => {
                    void loadWebFont(font);
                  }}
                  title={font.label}
                >
                  <span className={styles.fontSampleText} style={{ fontFamily: font.family }}>
                    {font.label}
                  </span>
                  {font.variants && font.variants.length > 1 && (
                    <span
                      className={styles.variantBadge}
                      style={{ fontSize: '10px', opacity: 0.6 }}
                    >
                      {font.variants.length} estilos
                    </span>
                  )}
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
