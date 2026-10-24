import { lazy, Suspense, type ReactElement } from 'react';
import { Button, Icon, Skeleton } from '../../../components/ui/index.js';
import { useOptionalEditorSession } from '../state/EditorProvider.js';
import type { SidebarCategory } from '../types/editorUi.types.js';
import { ElementsPanel } from './sidebar/ElementsPanel.js';
import { LayersCategoryPanel } from './sidebar/LayersCategoryPanel.js';
import { TemplatesPanel } from './sidebar/TemplatesPanel.js';
import { TextPanel } from './sidebar/TextPanel.js';
import styles from './SidebarNav.module.css';

const LazyMediaPanel = lazy(async () => {
  const mod = await import('./sidebar/MediaPanel.js');
  return { default: mod.MediaPanel };
});

const LazyColorsPanel = lazy(async () => {
  const mod = await import('./sidebar/ColorsPanel.js');
  return { default: mod.ColorsPanel };
});

export interface SidebarNavProps {
  readonly activeCategory?: SidebarCategory;
  readonly onSelectCategory?: (category: SidebarCategory) => void;
  readonly isDrawerOpen?: boolean;
  readonly onToggleDrawer?: () => void;
  readonly className?: string;
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

const CATEGORY_TITLES: Readonly<Record<SidebarCategory, string>> = {
  design: 'Modelos & Formatos',
  elements: 'Formas, Ícones & Emojis',
  text: 'Tipografia & Textos',
  media: 'Biblioteca de Imagens',
  uploads: 'Biblioteca de Imagens',
  background: 'Cores & Paletas IA',
  layers: 'Camadas da Página',
};

const NOOP = (): void => {};

export function SidebarNav({
  activeCategory: propActiveCategory,
  onSelectCategory: propOnSelectCategory,
  isDrawerOpen: propIsDrawerOpen,
  onToggleDrawer: propOnToggleDrawer,
  className,
}: SidebarNavProps): ReactElement {
  const session = useOptionalEditorSession();

  const activeCategory = propActiveCategory ?? session?.sidebarCategory ?? 'design';
  const onSelectCategory = propOnSelectCategory ?? session?.setSidebarCategory ?? NOOP;
  const isDrawerOpen = propIsDrawerOpen ?? session?.isDrawerOpen ?? true;
  const onToggleDrawer = propOnToggleDrawer ?? session?.toggleDrawer ?? NOOP;

  return (
    <div className={[styles.container, className].filter(Boolean).join(' ')}>
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

      {isDrawerOpen ? (
        <aside className={styles.drawer} aria-label={`Painel de ${activeCategory}`}>
          <div className={styles.drawerHeader}>
            <span className={styles.drawerTitle}>{CATEGORY_TITLES[activeCategory]}</span>
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
            {activeCategory === 'design' ? <TemplatesPanel /> : null}
            {activeCategory === 'elements' ? <ElementsPanel /> : null}
            {activeCategory === 'text' ? <TextPanel /> : null}
            {activeCategory === 'media' || activeCategory === 'uploads' ? (
              <Suspense fallback={<Skeleton variant="rect" count={4} />}>
                <LazyMediaPanel />
              </Suspense>
            ) : null}
            {activeCategory === 'background' ? (
              <Suspense fallback={<Skeleton variant="rect" count={3} />}>
                <LazyColorsPanel />
              </Suspense>
            ) : null}
            {activeCategory === 'layers' ? <LayersCategoryPanel /> : null}
          </div>
        </aside>
      ) : null}
    </div>
  );
}
