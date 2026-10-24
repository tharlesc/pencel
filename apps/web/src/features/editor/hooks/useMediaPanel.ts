import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  fetchMediaByCategory,
  getCuratedFallbackPhotos,
  searchPublicMedia,
  trackUnsplashDownload,
  type MediaCategory,
  type PublicPhotoItem,
} from '../services/publicMediaService.js';

export function useMediaPanel(onAddImage: (url: string) => void) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollSentinelRef = useRef<HTMLDivElement | null>(null);

  const [userUploads, setUserUploads] = useState<string[]>([]);
  const [selectedMediaCategory, setSelectedMediaCategory] = useState<MediaCategory>('Todos');
  const [mediaSearchQuery, setMediaSearchQuery] = useState<string>('');
  const [mediaPage, setMediaPage] = useState(1);
  const [isLoadingMoreMedia, setIsLoadingMoreMedia] = useState(false);
  const [hasMoreMedia, setHasMoreMedia] = useState(true);
  const [mediaPhotos, setMediaPhotos] = useState<PublicPhotoItem[]>(() =>
    getCuratedFallbackPhotos(),
  );
  const [isLoadingPublicMedia, setIsLoadingPublicMedia] = useState(false);

  useEffect(() => {
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
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setIsLoadingPublicMedia(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedMediaCategory, mediaSearchQuery]);

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
          if (!cancelled) setMediaPhotos(items);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setIsLoadingPublicMedia(false);
        });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mediaSearchQuery]);

  const handleLoadMoreMedia = useCallback(async (): Promise<void> => {
    if (isLoadingPublicMedia || isLoadingMoreMedia || !hasMoreMedia) return;
    setIsLoadingMoreMedia(true);
    const nextPage = mediaPage + 1;
    try {
      const nextItems = mediaSearchQuery.trim()
        ? await searchPublicMedia(mediaSearchQuery.trim(), nextPage)
        : await fetchMediaByCategory(selectedMediaCategory, nextPage);

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
    } catch {
      // Fallback gracefully
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

  useEffect(() => {
    const sentinel = scrollSentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;
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
  }, [handleLoadMoreMedia]);

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

  return {
    fileInputRef,
    scrollSentinelRef,
    userUploads,
    selectedMediaCategory,
    setSelectedMediaCategory,
    mediaSearchQuery,
    setMediaSearchQuery,
    isLoadingMoreMedia,
    hasMoreMedia,
    mediaPhotos,
    isLoadingPublicMedia,
    handleLoadMoreMedia,
    handleFileUpload,
    handleSelectPhoto,
  };
}
