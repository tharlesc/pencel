import type { BooleanPathOperation, ShapeVariant } from '@pencel/editor-core';
import type { ReactElement } from 'react';
import { Input } from '../../../../../components/ui/index.js';
import {
  useElementsPanel,
  ELEMENTS_SUB_TABS,
  QUICK_BRAND_DOMAINS,
} from '../../../hooks/useElementsPanel.js';
import type { AddTextOptions } from '../../../hooks/useTextPanel.js';
import { getBrandIconUrl } from '../../../services/elementsService.js';
import {
  useOptionalEditorEngine,
  useOptionalEditorSelection,
} from '../../../state/EditorProvider.js';
import styles from '../../SidebarNav/SidebarNav.module.css';
import { ShapesSubPanel } from './ShapesSubPanel.js';

export interface ElementsPanelProps {
  readonly onAddShape?: (options: { shapeVariant: ShapeVariant; fill?: string }) => void;
  readonly onAddText?: (options: AddTextOptions) => void;
  readonly onAddImage?: (url: string) => void;
  readonly onPerformBooleanOperation?: (operation: BooleanPathOperation) => void;
}

export function ElementsPanel({
  onAddShape: propOnAddShape,
  onAddText: propOnAddText,
  onAddImage: propOnAddImage,
  onPerformBooleanOperation: propOnPerformBooleanOperation,
}: ElementsPanelProps): ReactElement {
  const engine = useOptionalEditorEngine();
  const selection = useOptionalEditorSelection();
  const isMultiSelection = selection?.selectedObject?.type === 'activeselection';
  const onAddShape = propOnAddShape ?? engine?.addShape ?? (() => {});
  const onAddText = propOnAddText ?? engine?.addText ?? (() => {});
  const onAddImage =
    propOnAddImage ??
    ((url: string) => {
      void engine?.addImage(url);
    });
  const onPerformBooleanOperation =
    propOnPerformBooleanOperation ?? engine?.performBooleanOperation;

  const {
    elementsSentinelRef,
    elementsSubTab,
    setElementsSubTab,
    brandQuery,
    setBrandQuery,
    iconsState,
    setIconQuery,
    emojisState,
    setEmojiQuery,
    stickersState,
    setGiphyQuery,
    handleLoadMoreElements,
  } = useElementsPanel();

  return (
    <div className={styles.section}>
      <div className={styles.segmentedSubTabs} role="tablist">
        {ELEMENTS_SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={[styles.subTabBtn, elementsSubTab === tab.id ? styles.subTabBtnActive : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => setElementsSubTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {elementsSubTab === 'shapes' ? (
        <ShapesSubPanel
          onAddShape={onAddShape}
          onAddText={onAddText}
          onPerformBooleanOperation={onPerformBooleanOperation}
          isMultiSelection={isMultiSelection}
        />
      ) : null}

      {elementsSubTab === 'icons' ? (
        <div className={styles.subSection}>
          <Input
            prefixIcon="search"
            type="search"
            placeholder="Buscar entre +200.000 ícones..."
            value={iconsState.query}
            onChange={(e) => setIconQuery(e.target.value)}
            onClear={() => setIconQuery('')}
          />
          <span className={styles.subTitle}>Ícones Vetoriais ({iconsState.items.length})</span>

          {iconsState.isLoading && iconsState.items.length === 0 ? (
            <span className={styles.emptySearch}>Carregando ícones vetoriais...</span>
          ) : iconsState.items.length === 0 ? (
            <span className={styles.emptySearch}>Nenhum ícone encontrado.</span>
          ) : (
            <div className={styles.iconsGrid}>
              {iconsState.items.map((ic) => (
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

          <div ref={elementsSentinelRef} className={styles.infiniteScrollSentinel}>
            {iconsState.isLoadingMore ? (
              <span className={styles.loadingMoreText}>Carregando mais ícones...</span>
            ) : null}
            {iconsState.error ? (
              <button
                type="button"
                onClick={() => void handleLoadMoreElements()}
                className={styles.loadMoreBtn}
              >
                {iconsState.error} Tentar novamente
              </button>
            ) : null}
            {!iconsState.isLoadingMore && !iconsState.error && iconsState.hasMore ? (
              <button
                type="button"
                onClick={() => void handleLoadMoreElements()}
                className={styles.loadMoreBtn}
              >
                Carregar mais ícones
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {elementsSubTab === 'emojis' ? (
        <div className={styles.subSection}>
          <Input
            prefixIcon="search"
            type="search"
            placeholder="Buscar emoji..."
            value={emojisState.query}
            onChange={(e) => setEmojiQuery(e.target.value)}
            onClear={() => setEmojiQuery('')}
          />
          <span className={styles.subTitle}>Emojis ({emojisState.items.length})</span>
          <div className={styles.emojisGrid}>
            {emojisState.items.map((em) => (
              <button
                key={em.id}
                type="button"
                className={styles.emojiCard}
                onClick={() => onAddText({ text: em.char, fontSize: 64, boxMode: 'point' })}
                title={`${em.name} (${em.char})`}
                aria-label={`Adicionar emoji ${em.name}`}
              >
                <span className={styles.emojiChar}>{em.char}</span>
              </button>
            ))}
          </div>

          <div ref={elementsSentinelRef} className={styles.infiniteScrollSentinel}>
            {emojisState.isLoadingMore ? (
              <span className={styles.loadingMoreText}>Carregando mais emojis...</span>
            ) : null}
            {!emojisState.isLoadingMore && emojisState.hasMore ? (
              <button
                type="button"
                onClick={() => void handleLoadMoreElements()}
                className={styles.loadMoreBtn}
              >
                Carregar mais emojis
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {elementsSubTab === 'brands' ? (
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
            {QUICK_BRAND_DOMAINS.map((dom) => (
              <button
                key={dom}
                type="button"
                className={styles.brandCard}
                onClick={() => onAddImage(getBrandIconUrl(dom))}
                title={`Adicionar logo de ${dom}`}
              >
                <img src={getBrandIconUrl(dom)} alt={dom} className={styles.brandFavicon} />
                <span className={styles.brandDomainName}>{dom.replace('.com', '')}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {elementsSubTab === 'stickers' ? (
        <div className={styles.subSection}>
          <Input
            prefixIcon="search"
            type="search"
            placeholder="Buscar figurinhas Giphy..."
            value={stickersState.query}
            onChange={(e) => setGiphyQuery(e.target.value)}
            onClear={() => setGiphyQuery('')}
          />
          <span className={styles.subTitle}>
            {stickersState.query.trim()
              ? `Figurinhas para "${stickersState.query}" (${stickersState.items.length})`
              : `Figurinhas em Destaque (${stickersState.items.length})`}
          </span>

          {stickersState.isLoading && stickersState.items.length === 0 ? (
            <span className={styles.emptySearch}>Carregando figurinhas...</span>
          ) : stickersState.items.length === 0 ? (
            <span className={styles.emptySearch}>Nenhuma figurinha encontrada.</span>
          ) : (
            <div className={styles.giphyGrid}>
              {stickersState.items.map((item) => (
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

          <div ref={elementsSentinelRef} className={styles.infiniteScrollSentinel}>
            {stickersState.isLoadingMore ? (
              <span className={styles.loadingMoreText}>Carregando mais figurinhas...</span>
            ) : null}
            {stickersState.error ? (
              <button
                type="button"
                onClick={() => void handleLoadMoreElements()}
                className={styles.loadMoreBtn}
              >
                {stickersState.error} Tentar novamente
              </button>
            ) : null}
            {!stickersState.isLoadingMore && !stickersState.error && stickersState.hasMore ? (
              <button
                type="button"
                onClick={() => void handleLoadMoreElements()}
                className={styles.loadMoreBtn}
              >
                Carregar mais figurinhas
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
