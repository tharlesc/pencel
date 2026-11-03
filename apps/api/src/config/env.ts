import { existsSync } from 'node:fs';
import path from 'node:path';

export interface ApiEnvConfig {
  readonly port: number;
  readonly host: string;
  readonly nodeEnv: 'development' | 'test' | 'production';
  readonly corsOrigin: string;
  readonly photocraftCliPath?: string;
  readonly photocraftTimeoutMs: number;
  readonly maxImageBytes: number;
  readonly unsplashAccessKey?: string;
  readonly pexelsApiKey?: string;
  readonly giphyApiKey?: string;
  readonly googleFontsApiKey?: string;
  readonly geminiApiKey?: string;
  readonly openaiApiKey?: string;
  readonly anthropicApiKey?: string;
  readonly deepseekApiKey?: string;
}

const VALID_ENVIRONMENTS = new Set(['development', 'test', 'production'] as const);
const DEFAULT_PHOTOCRAFT_TIMEOUT_MS = 5000;
const DEFAULT_MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

function tryLoadEnvFile(): void {
  if (typeof process.loadEnvFile !== 'function') return;
  const candidates = [
    path.resolve(process.cwd(), 'apps/api/.env'),
    path.resolve(process.cwd(), '.env'),
  ];
  for (const envPath of candidates) {
    if (existsSync(envPath)) {
      try {
        process.loadEnvFile(envPath);
        break;
      } catch {
        // Silently skip if unable to parse
      }
    }
  }
}

tryLoadEnvFile();

/**
 * Validates and normalizes environment variables required to boot `@pencel/api`.
 * Does not require external databases or cloud secrets in the foundational stage.
 */
export function loadApiEnvConfig(rawEnv: NodeJS.ProcessEnv = process.env): ApiEnvConfig {
  const rawPort = rawEnv.PORT ?? '4000';
  const parsedPort = Number.parseInt(rawPort, 10);

  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error(`Invalid PORT environment variable: "${rawPort}". Expected integer 1..65535.`);
  }

  const rawNodeEnv = rawEnv.NODE_ENV ?? 'development';
  const nodeEnv = VALID_ENVIRONMENTS.has(rawNodeEnv as 'development' | 'test' | 'production')
    ? (rawNodeEnv as 'development' | 'test' | 'production')
    : 'development';

  const parsedTimeout = Number.parseInt(
    rawEnv.PHOTOCRAFT_TIMEOUT_MS ?? String(DEFAULT_PHOTOCRAFT_TIMEOUT_MS),
    10,
  );
  const photocraftTimeoutMs =
    Number.isInteger(parsedTimeout) && parsedTimeout > 0
      ? parsedTimeout
      : DEFAULT_PHOTOCRAFT_TIMEOUT_MS;

  const parsedMaxBytes = Number.parseInt(
    rawEnv.MAX_IMAGE_BYTES ?? String(DEFAULT_MAX_IMAGE_BYTES),
    10,
  );
  const maxImageBytes =
    Number.isInteger(parsedMaxBytes) && parsedMaxBytes > 0
      ? parsedMaxBytes
      : DEFAULT_MAX_IMAGE_BYTES;

  const photocraftCliPath = rawEnv.PHOTOCRAFT_CLI_PATH?.trim() || undefined;
  const unsplashAccessKey = rawEnv.UNSPLASH_ACCESS_KEY?.trim() || undefined;
  const pexelsApiKey = rawEnv.PEXELS_API_KEY?.trim() || undefined;
  const giphyApiKey = rawEnv.GIPHY_API_KEY?.trim() || undefined;
  const googleFontsApiKey = rawEnv.GOOGLE_FONTS_API_KEY?.trim() || undefined;
  const geminiApiKey = rawEnv.GEMINI_API_KEY?.trim() || undefined;
  const openaiApiKey = rawEnv.OPENAI_API_KEY?.trim() || undefined;
  const anthropicApiKey = rawEnv.ANTHROPIC_API_KEY?.trim() || undefined;
  const deepseekApiKey = rawEnv.DEEPSEEK_API_KEY?.trim() || undefined;

  return {
    port: parsedPort,
    host: rawEnv.HOST?.trim() || '127.0.0.1',
    nodeEnv,
    corsOrigin: rawEnv.CORS_ORIGIN?.trim() || 'http://localhost:5173',
    ...(photocraftCliPath ? { photocraftCliPath } : {}),
    photocraftTimeoutMs,
    maxImageBytes,
    ...(unsplashAccessKey ? { unsplashAccessKey } : {}),
    ...(pexelsApiKey ? { pexelsApiKey } : {}),
    ...(giphyApiKey ? { giphyApiKey } : {}),
    ...(googleFontsApiKey ? { googleFontsApiKey } : {}),
    ...(geminiApiKey ? { geminiApiKey } : {}),
    ...(openaiApiKey ? { openaiApiKey } : {}),
    ...(anthropicApiKey ? { anthropicApiKey } : {}),
    ...(deepseekApiKey ? { deepseekApiKey } : {}),
  };
}
