export interface ApiEnvConfig {
  readonly port: number;
  readonly host: string;
  readonly nodeEnv: 'development' | 'test' | 'production';
  readonly corsOrigin: string;
}

const VALID_ENVIRONMENTS = new Set(['development', 'test', 'production'] as const);

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

  return {
    port: parsedPort,
    host: rawEnv.HOST?.trim() || '127.0.0.1',
    nodeEnv,
    corsOrigin: rawEnv.CORS_ORIGIN?.trim() || 'http://localhost:5173',
  };
}
