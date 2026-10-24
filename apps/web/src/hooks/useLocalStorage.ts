import { useCallback, useEffect, useState } from 'react';

export type SetLocalStorageValue<T> = T | ((prevValue: T) => T);

/**
 * Strongly-typed `localStorage` state hook with safe JSON parsing, optional runtime type guard,
 * quota resilience, and cross-tab storage event synchronization.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  validator?: (value: unknown) => value is T,
): readonly [T, (value: SetLocalStorageValue<T>) => void, () => void] {
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return initialValue;
    }
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) {
        return initialValue;
      }
      const parsed: unknown = JSON.parse(raw);
      if (validator && !validator(parsed)) {
        return initialValue;
      }
      return parsed as T;
    } catch {
      return initialValue;
    }
  }, [initialValue, key, validator]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = useCallback(
    (value: SetLocalStorageValue<T>): void => {
      setStoredValue((prev) => {
        const nextValue =
          typeof value === 'function' ? (value as (prevState: T) => T)(prev) : value;
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(key, JSON.stringify(nextValue));
          }
        } catch {
          // Quota exceeded or private browsing restriction
        }
        return nextValue;
      });
    },
    [key],
  );

  const removeValue = useCallback((): void => {
    setStoredValue(initialValue);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Ignore storage access failure
    }
  }, [initialValue, key]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent): void => {
      if (event.key === key) {
        setStoredValue(readValue());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key, readValue]);

  return [storedValue, setValue, removeValue] as const;
}
