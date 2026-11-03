import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { SupportedLanguage, TranslationDictionary, TranslationKey } from './i18n.types.js';
import { en } from './locales/en.js';
import { es } from './locales/es.js';
import { pt } from './locales/pt.js';

const STORAGE_KEY = 'pencel_language';
const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

const DICTIONARIES: Record<SupportedLanguage, TranslationDictionary> = {
  en,
  pt,
  es,
};

export interface I18nContextValue {
  readonly language: SupportedLanguage;
  readonly locale: SupportedLanguage;
  readonly setLanguage: (language: SupportedLanguage) => void;
  readonly t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getNestedValue(obj: unknown, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export interface I18nProviderProps {
  readonly children: ReactNode;
  readonly initialLanguage?: SupportedLanguage;
}

export function I18nProvider({ children, initialLanguage }: I18nProviderProps): ReactElement {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (
      initialLanguage &&
      (initialLanguage === 'en' || initialLanguage === 'pt' || initialLanguage === 'es')
    ) {
      return initialLanguage;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'pt' || stored === 'es') {
        return stored;
      }
    } catch {
      // Fallback if localStorage is inaccessible
    }
    return DEFAULT_LANGUAGE;
  });

  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language === 'pt' ? 'pt-BR' : language;
    }
  }, [language]);

  const activeDict = DICTIONARIES[language] ?? en;

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      let text = getNestedValue(activeDict, key) ?? getNestedValue(en, key) ?? key;
      if (params) {
        for (const [paramKey, paramValue] of Object.entries(params)) {
          text = text.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
        }
      }
      return text;
    },
    [activeDict],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      locale: language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    // Return graceful fallback when outside provider (e.g. isolated unit tests)
    return {
      language: DEFAULT_LANGUAGE,
      locale: DEFAULT_LANGUAGE,
      setLanguage: () => {},
      t: (key: TranslationKey, params?: Record<string, string | number>): string => {
        let text = getNestedValue(en, key) ?? key;
        if (params) {
          for (const [paramKey, paramValue] of Object.entries(params)) {
            text = text.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
          }
        }
        return text;
      },
    };
  }
  return context;
}
