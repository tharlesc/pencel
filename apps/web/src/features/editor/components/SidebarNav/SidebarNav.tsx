import { lazy, Suspense, type ReactElement } from 'react';
import { Button, Icon, Skeleton } from '../../../../components/ui/index.js';
import {
  useOptionalEditorSelection,
  useOptionalEditorSession,
} from '../../state/EditorProvider.js';
import type { SidebarCategory } from '../../types/editorUi.types.js';
import { useI18n } from '../../../../shared/i18n/index.js';
import { AiGeneratorPanel } from '../sidebar/AiGeneratorPanel/index.js';
import { CameraRawPanel } from '../sidebar/CameraRawPanel/index.js';
import { ElementsPanel } from '../sidebar/ElementsPanel/index.js';
import { LayersCategoryPanel } from '../sidebar/LayersCategoryPanel/index.js';
import { SettingsPanel } from '../sidebar/SettingsPanel/index.js';
import { TemplatesPanel } from '../sidebar/TemplatesPanel/index.js';
import { TextPanel } from '../sidebar/TextPanel/index.js';
import styles from './SidebarNav.module.css';

const LazyMediaPanel = lazy(async () => {
  const mod = await import('../sidebar/MediaPanel/index.js');
  return { default: mod.MediaPanel };
});

const LazyColorsPanel = lazy(async () => {
  const mod = await import('../sidebar/ColorsPanel/index.js');
  return { default: mod.ColorsPanel };
});

export interface SidebarNavProps {
  readonly activeCategory?: SidebarCategory;
  readonly onSelectCategory?: (category: SidebarCategory) => void;
  readonly isDrawerOpen?: boolean;
  readonly onToggleDrawer?: () => void;
  readonly className?: string;
}

const NOOP = (): void => {};

export function SidebarNav({
  activeCategory: propActiveCategory,
  onSelectCategory: propOnSelectCategory,
  isDrawerOpen: propIsDrawerOpen,
  onToggleDrawer: propOnToggleDrawer,
  className,
}: SidebarNavProps): ReactElement {
  const { t } = useI18n();
  const session = useOptionalEditorSession();
  const selectionCtx = useOptionalEditorSelection();
  const isImageSelected = selectionCtx?.selectedObject?.type === 'image';

  const activeCategory = propActiveCategory ?? session?.sidebarCategory ?? 'design';
  const onSelectCategory = propOnSelectCategory ?? session?.setSidebarCategory ?? NOOP;
  const isDrawerOpen = propIsDrawerOpen ?? session?.isDrawerOpen ?? true;
  const onToggleDrawer = propOnToggleDrawer ?? session?.toggleDrawer ?? NOOP;

  const isEditActive = activeCategory === 'cameraRaw' && isDrawerOpen;
  const isAiActive = activeCategory === 'ai' && isDrawerOpen;
  const isSettingsActive = activeCategory === 'settings' && isDrawerOpen;

  const railItems: readonly {
    id: SidebarCategory;
    label: string;
    icon: 'templates' | 'shapes' | 'text' | 'image' | 'palette' | 'layers';
  }[] = [
    { id: 'design', label: t('nav.design'), icon: 'templates' },
    { id: 'elements', label: t('nav.elements'), icon: 'shapes' },
    { id: 'text', label: t('nav.text'), icon: 'text' },
    { id: 'media', label: t('nav.media'), icon: 'image' },
    { id: 'background', label: t('nav.background'), icon: 'palette' },
    { id: 'layers', label: t('nav.layers'), icon: 'layers' },
  ];

  const categoryTitles: Record<SidebarCategory, string> = {
    design: t('titles.design'),
    elements: t('titles.elements'),
    text: t('titles.text'),
    media: t('titles.media'),
    uploads: t('titles.media'),
    background: t('titles.background'),
    layers: t('titles.layers'),
    cameraRaw: t('titles.cameraRaw'),
    ai: t('titles.ai'),
    settings: t('titles.settings'),
  };

  return (
    <div className={[styles.container, className].filter(Boolean).join(' ')}>
      <nav className={styles.rail} aria-label={t('nav.tools')}>
        <div className={styles.railTop}>
          {railItems.map((item) => {
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

          {isImageSelected && (
            <>
              <div className={styles.railDivider} role="separator" />
              <button
                type="button"
                className={[styles.railItem, isEditActive ? styles.railItemActive : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  if (isEditActive) {
                    onToggleDrawer();
                  } else {
                    onSelectCategory('cameraRaw');
                  }
                }}
                aria-pressed={isEditActive}
                aria-label={t('nav.edit')}
              >
                <Icon
                  name="cameraRaw"
                  size="md"
                  weight={isEditActive ? 'medium' : 'regular'}
                  tone={isEditActive ? 'active' : 'default'}
                />
                <span className={styles.railLabel}>{t('nav.edit')}</span>
              </button>
            </>
          )}
        </div>

        <div className={styles.railBottom}>
          <div className={styles.railDivider} role="separator" />
          <button
            type="button"
            className={[styles.railItem, isAiActive ? styles.railItemActive : styles.railItemAi]
              .filter(Boolean)
              .join(' ')}
            onClick={() => {
              if (activeCategory === 'ai' && isDrawerOpen) {
                onToggleDrawer();
              } else {
                onSelectCategory('ai');
              }
            }}
            aria-pressed={isAiActive}
            aria-label={t('nav.aiArt')}
            title={t('nav.aiArt')}
          >
            <Icon
              name="sparkles"
              size="md"
              weight={isAiActive ? 'medium' : 'regular'}
              tone={isAiActive ? 'active' : 'accent'}
            />
            <span className={styles.railLabel}>{t('nav.aiArt')}</span>
          </button>

          <button
            type="button"
            className={[styles.railItem, isSettingsActive ? styles.railItemActive : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => {
              if (activeCategory === 'settings' && isDrawerOpen) {
                onToggleDrawer();
              } else {
                onSelectCategory('settings');
              }
            }}
            aria-pressed={isSettingsActive}
            aria-label={t('nav.settings')}
            title={t('nav.settings')}
          >
            <Icon
              name="settings"
              size="md"
              weight={isSettingsActive ? 'medium' : 'regular'}
              tone={isSettingsActive ? 'active' : 'default'}
            />
            <span className={styles.railLabel}>{t('nav.settings')}</span>
          </button>
        </div>
      </nav>

      {isDrawerOpen ? (
        <aside className={styles.drawer} aria-label={`Painel de ${activeCategory}`}>
          <div className={styles.drawerHeader}>
            <span className={styles.drawerTitle}>{categoryTitles[activeCategory]}</span>
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
              <Suspense fallback={<Skeleton variant="rect" />}>
                <LazyMediaPanel />
              </Suspense>
            ) : null}
            {activeCategory === 'background' ? (
              <Suspense fallback={<Skeleton variant="rect" />}>
                <LazyColorsPanel />
              </Suspense>
            ) : null}
            {activeCategory === 'layers' ? <LayersCategoryPanel /> : null}
            {activeCategory === 'cameraRaw' ? <CameraRawPanel /> : null}
            {activeCategory === 'ai' ? (
              <AiGeneratorPanel onOpenSettings={() => onSelectCategory('settings')} />
            ) : null}
            {activeCategory === 'settings' ? <SettingsPanel /> : null}
          </div>
        </aside>
      ) : null}
    </div>
  );
}
