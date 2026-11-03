export type AiProvider = 'gemini' | 'openai' | 'claude' | 'deepseek';

export interface ModelOption {
  readonly id: string;
  readonly name: string;
  readonly isRecommended?: boolean;
}

export interface ProviderDefinition {
  readonly id: AiProvider;
  readonly name: string;
  readonly defaultModel: string;
  readonly keyPlaceholder: string;
  readonly helpUrl: string;
  readonly helpLabel: string;
  readonly models: readonly ModelOption[];
}

export const AI_PROVIDERS: readonly ProviderDefinition[] = [
  {
    id: 'gemini',
    name: 'Google Gemini (Free Tier / Recommended)',
    defaultModel: 'gemini-2.5-flash',
    keyPlaceholder: 'AIzaSy...',
    helpUrl: 'https://aistudio.google.com/app/apikey',
    helpLabel: 'Google AI Studio',
    models: [
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash (Recommended / Latest)',
        isRecommended: true,
      },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash (Latest)' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    ],
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    defaultModel: 'claude-3-7-sonnet-20250219',
    keyPlaceholder: 'sk-ant-api03-...',
    helpUrl: 'https://console.anthropic.com/settings/keys',
    helpLabel: 'Anthropic Console',
    models: [
      {
        id: 'claude-3-7-sonnet-20250219',
        name: 'Claude 3.7 Sonnet (Hybrid Reasoning / Recommended)',
        isRecommended: true,
      },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Fast)' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    defaultModel: 'gpt-4o-mini',
    keyPlaceholder: 'sk-proj-...',
    helpUrl: 'https://platform.openai.com/api-keys',
    helpLabel: 'OpenAI Platform',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Recommended)', isRecommended: true },
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'o3-mini', name: 'o3-mini' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    defaultModel: 'deepseek-chat',
    keyPlaceholder: 'sk-...',
    helpUrl: 'https://platform.deepseek.com/api_keys',
    helpLabel: 'DeepSeek Platform',
    models: [
      {
        id: 'deepseek-chat',
        name: 'DeepSeek-V3 (deepseek-chat / Recommended)',
        isRecommended: true,
      },
      { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (deepseek-reasoner)' },
    ],
  },
];

export function getProviderDefinition(provider: AiProvider): ProviderDefinition {
  return AI_PROVIDERS.find((p) => p.id === provider) ?? AI_PROVIDERS[0]!;
}

export function getDefaultModelForProvider(provider: AiProvider): string {
  return getProviderDefinition(provider).defaultModel;
}

export function formatProviderDisplayName(provider: AiProvider): string {
  switch (provider) {
    case 'gemini':
      return 'Google Gemini';
    case 'claude':
      return 'Anthropic Claude';
    case 'openai':
      return 'OpenAI';
    case 'deepseek':
      return 'DeepSeek';
  }
}

export interface SavedAiKey {
  readonly id: string;
  readonly name: string;
  readonly provider: AiProvider;
  readonly apiKey: string;
  readonly model: string;
  readonly createdAt: number;
}

export interface AiUserConfig {
  readonly provider: AiProvider;
  readonly apiKey: string;
  readonly model: string;
  readonly activeKeyId?: string;
  readonly savedKeys: readonly SavedAiKey[];
}

const STORAGE_PROVIDER_KEY = 'pencel_ai_provider';
const STORAGE_API_KEY_KEY = 'pencel_ai_api_key';
const STORAGE_MODEL_KEY = 'pencel_ai_model';
const STORAGE_SAVED_KEYS_KEY = 'pencel_ai_saved_keys';
const STORAGE_ACTIVE_KEY_ID_KEY = 'pencel_ai_active_key_id';

export const DEFAULT_AI_CONFIG: AiUserConfig = {
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-2.5-flash',
  savedKeys: [],
};

export function maskApiKey(key: string): string {
  if (!key) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '••••••••';
  const start = trimmed.slice(0, 4);
  const end = trimmed.slice(-4);
  return `${start}••••${end}`;
}

export function getStoredAiConfig(): AiUserConfig {
  if (typeof localStorage === 'undefined') {
    return DEFAULT_AI_CONFIG;
  }

  try {
    let savedKeys: SavedAiKey[] = [];
    const rawSavedKeys = localStorage.getItem(STORAGE_SAVED_KEYS_KEY);
    if (rawSavedKeys) {
      try {
        const parsed = JSON.parse(rawSavedKeys) as unknown;
        if (Array.isArray(parsed)) {
          savedKeys = parsed.filter(
            (k): k is SavedAiKey =>
              typeof k === 'object' &&
              k !== null &&
              typeof (k as SavedAiKey).id === 'string' &&
              typeof (k as SavedAiKey).apiKey === 'string' &&
              ((k as SavedAiKey).provider === 'gemini' ||
                (k as SavedAiKey).provider === 'openai' ||
                (k as SavedAiKey).provider === 'claude' ||
                (k as SavedAiKey).provider === 'deepseek'),
          );
        }
      } catch {
        // Ignore
      }
    }

    const legacyKey = localStorage.getItem(STORAGE_API_KEY_KEY)?.trim() ?? '';
    const rawProvider = localStorage.getItem(STORAGE_PROVIDER_KEY);
    const legacyProvider: AiProvider =
      rawProvider === 'openai' ||
      rawProvider === 'gemini' ||
      rawProvider === 'claude' ||
      rawProvider === 'deepseek'
        ? rawProvider
        : 'gemini';
    const defaultModel = getDefaultModelForProvider(legacyProvider);
    const rawModel = localStorage.getItem(STORAGE_MODEL_KEY)?.trim();
    const legacyModel =
      !rawModel || rawModel === 'gemini-1.5-flash' || rawModel === 'gemini-3.8-flash'
        ? defaultModel
        : rawModel;

    // Auto-migrate legacy single key to savedKeys if savedKeys is empty and legacyKey exists
    if (savedKeys.length === 0 && legacyKey) {
      const initialKey: SavedAiKey = {
        id: 'key-' + Date.now().toString(36),
        name: `${formatProviderDisplayName(legacyProvider)} Principal`,
        provider: legacyProvider,
        apiKey: legacyKey,
        model: legacyModel,
        createdAt: Date.now(),
      };
      savedKeys = [initialKey];
      try {
        localStorage.setItem(STORAGE_SAVED_KEYS_KEY, JSON.stringify(savedKeys));
        localStorage.setItem(STORAGE_ACTIVE_KEY_ID_KEY, initialKey.id);
      } catch {
        // Ignore
      }
    }

    let activeKeyId = localStorage.getItem(STORAGE_ACTIVE_KEY_ID_KEY) || undefined;
    let activeKey = savedKeys.find((k) => k.id === activeKeyId);

    // If activeKeyId doesn't exist, activate the first available key
    if (!activeKey && savedKeys.length > 0) {
      activeKey = savedKeys[0];
      activeKeyId = activeKey?.id;
    }

    const provider: AiProvider = activeKey ? activeKey.provider : legacyProvider;
    const apiKey = activeKey ? activeKey.apiKey : legacyKey;
    const model = activeKey ? activeKey.model : legacyModel;

    return {
      provider,
      apiKey,
      model,
      ...(activeKeyId ? { activeKeyId } : {}),
      savedKeys,
    };
  } catch {
    return DEFAULT_AI_CONFIG;
  }
}

export function saveStoredAiConfig(config: Partial<AiUserConfig>): AiUserConfig {
  const current = getStoredAiConfig();
  const next: AiUserConfig = {
    provider: config.provider ?? current.provider,
    apiKey: config.apiKey !== undefined ? config.apiKey.trim() : current.apiKey,
    model: config.model ?? current.model,
    activeKeyId: config.activeKeyId !== undefined ? config.activeKeyId : current.activeKeyId,
    savedKeys: config.savedKeys !== undefined ? config.savedKeys : current.savedKeys,
  };

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_PROVIDER_KEY, next.provider);
      localStorage.setItem(STORAGE_API_KEY_KEY, next.apiKey);
      localStorage.setItem(STORAGE_MODEL_KEY, next.model);
      if (next.activeKeyId) {
        localStorage.setItem(STORAGE_ACTIVE_KEY_ID_KEY, next.activeKeyId);
      } else {
        localStorage.removeItem(STORAGE_ACTIVE_KEY_ID_KEY);
      }
      localStorage.setItem(STORAGE_SAVED_KEYS_KEY, JSON.stringify(next.savedKeys));
      window.dispatchEvent(new CustomEvent('pencel_ai_config_changed', { detail: next }));
    } catch {
      // Ignore storage errors
    }
  }

  return next;
}

export function addSavedAiKey(newKey: {
  readonly name?: string;
  readonly provider: AiProvider;
  readonly apiKey: string;
  readonly model?: string;
  readonly makeActive?: boolean;
}): AiUserConfig {
  const current = getStoredAiConfig();
  const trimmedKey = newKey.apiKey.trim();
  if (!trimmedKey) return current;

  const defaultModel = getDefaultModelForProvider(newKey.provider);
  const model = newKey.model?.trim() || defaultModel;
  const name = newKey.name?.trim() || `${formatProviderDisplayName(newKey.provider)} (${model})`;

  const createdItem: SavedAiKey = {
    id: 'key-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
    name,
    provider: newKey.provider,
    apiKey: trimmedKey,
    model,
    createdAt: Date.now(),
  };

  const makeActive = newKey.makeActive ?? true;
  const nextSavedKeys = [...current.savedKeys, createdItem];

  return saveStoredAiConfig({
    savedKeys: nextSavedKeys,
    ...(makeActive
      ? {
          activeKeyId: createdItem.id,
          provider: createdItem.provider,
          apiKey: createdItem.apiKey,
          model: createdItem.model,
        }
      : {}),
  });
}

export function removeSavedAiKey(id: string): AiUserConfig {
  const current = getStoredAiConfig();
  const nextSavedKeys = current.savedKeys.filter((k) => k.id !== id);

  if (current.activeKeyId === id) {
    const nextActive = nextSavedKeys[0];
    if (nextActive) {
      return saveStoredAiConfig({
        savedKeys: nextSavedKeys,
        activeKeyId: nextActive.id,
        provider: nextActive.provider,
        apiKey: nextActive.apiKey,
        model: nextActive.model,
      });
    } else {
      return saveStoredAiConfig({
        savedKeys: [],
        activeKeyId: undefined,
        apiKey: '',
      });
    }
  }

  return saveStoredAiConfig({ savedKeys: nextSavedKeys });
}

export function setActiveAiKey(id: string): AiUserConfig {
  const current = getStoredAiConfig();
  const target = current.savedKeys.find((k) => k.id === id);
  if (!target) return current;

  return saveStoredAiConfig({
    activeKeyId: target.id,
    provider: target.provider,
    apiKey: target.apiKey,
    model: target.model,
  });
}

export function clearStoredAiConfig(): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_API_KEY_KEY);
      localStorage.removeItem(STORAGE_PROVIDER_KEY);
      localStorage.removeItem(STORAGE_MODEL_KEY);
      localStorage.removeItem(STORAGE_SAVED_KEYS_KEY);
      localStorage.removeItem(STORAGE_ACTIVE_KEY_ID_KEY);
      window.dispatchEvent(
        new CustomEvent('pencel_ai_config_changed', {
          detail: DEFAULT_AI_CONFIG,
        }),
      );
    } catch {
      // Ignore storage errors
    }
  }
}
