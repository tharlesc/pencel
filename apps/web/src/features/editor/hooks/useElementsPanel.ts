import { useCallback, useEffect, useRef, useState } from 'react';
import {
  POPULAR_CURATED_EMOJIS,
  POPULAR_CURATED_ICONS,
  searchEmojis,
  searchIconifyIcons,
  type EmojiItem,
  type VectorIconItem,
} from '../services/elementsService.js';
import { searchGiphyStills, type GiphyItem } from '../services/giphyService.js';

export type ElementsSubTab = 'shapes' | 'brands' | 'stickers' | 'icons' | 'emojis';

interface FeedState<T> {
  readonly items: readonly T[];
  readonly query: string;
  readonly offset: number;
  readonly isLoading: boolean;
  readonly isLoadingMore: boolean;
  readonly hasMore: boolean;
  readonly error: string | null;
}

export function useElementsPanel() {
  const elementsSentinelRef = useRef<HTMLDivElement | null>(null);
  const [elementsSubTab, setElementsSubTab] = useState<ElementsSubTab>('shapes');
  const [brandQuery, setBrandQuery] = useState('apple');

  const [iconsState, setIconsState] = useState<FeedState<VectorIconItem>>({
    items: POPULAR_CURATED_ICONS,
    query: '',
    offset: 0,
    isLoading: false,
    isLoadingMore: false,
    hasMore: true,
    error: null,
  });

  const [emojisState, setEmojisState] = useState<FeedState<EmojiItem>>({
    items: POPULAR_CURATED_EMOJIS.slice(0, 24),
    query: '',
    offset: 0,
    isLoading: false,
    isLoadingMore: false,
    hasMore: POPULAR_CURATED_EMOJIS.length > 24,
    error: null,
  });

  const [stickersState, setStickersState] = useState<FeedState<GiphyItem>>({
    items: [],
    query: '',
    offset: 0,
    isLoading: false,
    isLoadingMore: false,
    hasMore: true,
    error: null,
  });

  useEffect(() => {
    if (elementsSubTab !== 'icons') return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setIconsState((s) => ({ ...s, isLoading: true, error: null, offset: 0, hasMore: true }));
      searchIconifyIcons(iconsState.query, 24, 0)
        .then((items) => {
          if (!cancelled) {
            setIconsState((s) => ({
              ...s,
              items,
              hasMore: items.length >= 12,
              isLoading: false,
            }));
          }
        })
        .catch(() => {
          if (!cancelled) {
            setIconsState((s) => ({
              ...s,
              error: 'Falha ao carregar ícones. Verifique sua conexão.',
              isLoading: false,
            }));
          }
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [elementsSubTab, iconsState.query]);

  useEffect(() => {
    if (elementsSubTab !== 'emojis') return;
    let cancelled = false;
    searchEmojis(emojisState.query, 24, 0)
      .then((items) => {
        if (!cancelled) {
          setEmojisState((s) => ({
            ...s,
            items,
            offset: 0,
            hasMore: items.length >= 24,
          }));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [elementsSubTab, emojisState.query]);

  useEffect(() => {
    if (elementsSubTab !== 'stickers') return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setStickersState((s) => ({ ...s, isLoading: true, error: null, offset: 0, hasMore: true }));
      searchGiphyStills(stickersState.query, 24, 0)
        .then((items) => {
          if (!cancelled) {
            setStickersState((s) => ({
              ...s,
              items,
              hasMore: items.length >= 12,
              isLoading: false,
            }));
          }
        })
        .catch(() => {
          if (!cancelled) {
            setStickersState((s) => ({
              ...s,
              error: 'Não foi possível carregar figurinhas.',
              isLoading: false,
            }));
          }
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [elementsSubTab, stickersState.query]);

  const handleLoadMoreElements = useCallback(async (): Promise<void> => {
    if (elementsSubTab === 'icons') {
      if (iconsState.isLoading || iconsState.isLoadingMore || !iconsState.hasMore) return;
      setIconsState((s) => ({ ...s, isLoadingMore: true, error: null }));
      const nextOffset = iconsState.offset + 24;
      try {
        const nextBatch = await searchIconifyIcons(iconsState.query, 24, nextOffset);
        setIconsState((s) => {
          const seen = new Set(s.items.map((item) => item.id));
          const unique = nextBatch.filter((item) => !seen.has(item.id));
          return {
            ...s,
            items: [...s.items, ...unique],
            offset: nextOffset,
            hasMore: nextBatch.length >= 12,
            isLoadingMore: false,
          };
        });
      } catch {
        setIconsState((s) => ({
          ...s,
          error: 'Erro ao carregar mais ícones.',
          isLoadingMore: false,
        }));
      }
    } else if (elementsSubTab === 'stickers') {
      if (stickersState.isLoading || stickersState.isLoadingMore || !stickersState.hasMore) return;
      setStickersState((s) => ({ ...s, isLoadingMore: true, error: null }));
      const nextOffset = stickersState.offset + 24;
      try {
        const nextBatch = await searchGiphyStills(stickersState.query, 24, nextOffset);
        setStickersState((s) => {
          const seen = new Set(s.items.map((item) => item.id));
          const unique = nextBatch.filter((item) => !seen.has(item.id));
          return {
            ...s,
            items: [...s.items, ...unique],
            offset: nextOffset,
            hasMore: nextBatch.length >= 12,
            isLoadingMore: false,
          };
        });
      } catch {
        setStickersState((s) => ({
          ...s,
          error: 'Erro ao carregar mais figurinhas.',
          isLoadingMore: false,
        }));
      }
    } else if (elementsSubTab === 'emojis') {
      if (emojisState.isLoadingMore || !emojisState.hasMore) return;
      setEmojisState((s) => ({ ...s, isLoadingMore: true }));
      const nextOffset = emojisState.offset + 24;
      const nextBatch = await searchEmojis(emojisState.query, 24, nextOffset);
      setEmojisState((s) => {
        const seen = new Set(s.items.map((item) => item.id));
        const unique = nextBatch.filter((item) => !seen.has(item.id));
        return {
          ...s,
          items: [...s.items, ...unique],
          offset: nextOffset,
          hasMore: nextBatch.length >= 24,
          isLoadingMore: false,
        };
      });
    }
  }, [elementsSubTab, iconsState, stickersState, emojisState]);

  useEffect(() => {
    const sentinel = elementsSentinelRef.current;
    if (
      !sentinel ||
      !['icons', 'stickers', 'emojis'].includes(elementsSubTab) ||
      typeof IntersectionObserver === 'undefined'
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
  }, [elementsSubTab, handleLoadMoreElements]);

  return {
    elementsSentinelRef,
    elementsSubTab,
    setElementsSubTab,
    brandQuery,
    setBrandQuery,
    iconsState,
    setIconQuery: (query: string) => setIconsState((s) => ({ ...s, query })),
    emojisState,
    setEmojiQuery: (query: string) => setEmojisState((s) => ({ ...s, query })),
    stickersState,
    setGiphyQuery: (query: string) => setStickersState((s) => ({ ...s, query })),
    handleLoadMoreElements,
  };
}
