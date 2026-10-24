/**
 * @pencel/web - Persistent Media Cache
 * Caches photo search results and editorial feeds in localStorage with a 24-hour TTL.
 * Avoids exhausting the Unsplash API rate limit (50 req/hr demo) across browser reloads.
 */

import type { PublicPhotoItem } from './publicMediaService.js';

interface CacheEntry<T> {
  readonly timestamp: number;
  readonly ttlMs: number;
  readonly data: T;
}

const CACHE_PREFIX = 'pencel_media_v2_';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

export function getPersistentCache<T>(key: string): T | null {
  try {
    const storage = getStorage();
    if (!storage) return null;

    const raw = storage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;

    const entry = JSON.parse(raw) as CacheEntry<T>;
    const now = Date.now();

    if (now - entry.timestamp > entry.ttlMs) {
      storage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

export function setPersistentCache<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
  try {
    const storage = getStorage();
    if (!storage) return;

    if (!data) return;
    const entry: CacheEntry<T> = {
      timestamp: Date.now(),
      ttlMs,
      data,
    };
    storage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch {
    // Gracefully handle storage quota exceeded
  }
}

export function getCachedMedia(key: string): PublicPhotoItem[] | null {
  return getPersistentCache<PublicPhotoItem[]>(key);
}

export function setCachedMedia(key: string, data: PublicPhotoItem[], ttlMs = DEFAULT_TTL_MS): void {
  setPersistentCache<PublicPhotoItem[]>(key, data, ttlMs);
}

export function clearExpiredMediaCache(): void {
  try {
    const storage = getStorage();
    if (!storage) return;

    const now = Date.now();
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) {
        try {
          const raw = storage.getItem(k);
          if (raw) {
            const entry = JSON.parse(raw) as CacheEntry<unknown>;
            if (now - entry.timestamp > entry.ttlMs) {
              storage.removeItem(k);
            }
          }
        } catch {
          storage.removeItem(k);
        }
      }
    }
  } catch {
    // Ignore storage errors
  }
}
