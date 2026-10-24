import { useMemo, useState, type ReactElement } from 'react';
import { Icon, Input } from '../../../components/ui/index.js';
import { EXPANDED_FONT_CATALOG, loadWebFont } from '../services/fontLoaderService.js';
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

  const filteredCategories = useMemo(() => {
    const cats = ['Sans-Serif', 'Serif', 'Display', 'Script', 'Monospace'] as const;
    const query = fontSearch.trim().toLowerCase();
    return cats
      .map((cat) => {
        const fonts = EXPANDED_FONT_CATALOG.filter(
          (f) =>
            f.category === cat &&
            (f.label.toLowerCase().includes(query) || f.family.toLowerCase().includes(query)),
        );
        return { cat, fonts };
      })
      .filter((group) => group.fonts.length > 0);
  }, [fontSearch]);

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
            <span className={styles.fontCategoryHeader}>{cat}</span>
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
