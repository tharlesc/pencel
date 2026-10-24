import { execFile } from 'node:child_process';
import { existsSync, promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import type { ApiEnvConfig } from '../../config/env.js';
import type { ValidatedImagePayload } from './image.validation.js';

const execFileAsync = promisify(execFile);

export interface RemoveBackgroundResult {
  readonly success: boolean;
  readonly fallback?: boolean;
  readonly imageBase64?: string;
  readonly result?: unknown;
  readonly message?: string;
}

export type CliRunner = (
  cliPath: string,
  args: readonly string[],
  timeoutMs: number,
) => Promise<{ readonly stdout: string; readonly stderr: string }>;

const defaultCliRunner: CliRunner = async (cliPath, args, timeoutMs) => {
  return execFileAsync(cliPath, [...args], { timeout: timeoutMs });
};

/**
 * Resolves the PhotoCraft CLI binary path strictly from environment configuration.
 * Never falls back to hardcoded OS paths.
 */
export function resolvePhotoCraftCliPath(env: ApiEnvConfig): string | null {
  const configuredPath = env.photocraftCliPath?.trim();
  if (!configuredPath) {
    return null;
  }
  return existsSync(configuredPath) ? configuredPath : null;
}

/**
 * Executes PhotoCraft CLI background removal with timeout enforcement and guaranteed temp file cleanup.
 */
export async function removeBackgroundWithPhotoCraft(
  payload: ValidatedImagePayload,
  env: ApiEnvConfig,
  runner: CliRunner = defaultCliRunner,
): Promise<RemoveBackgroundResult> {
  const cliPath = resolvePhotoCraftCliPath(env);
  if (!cliPath) {
    return {
      success: false,
      fallback: true,
      message: 'PhotoCraft CLI não configurado ou não encontrado.',
    };
  }

  const tempId = `pencel_rmbg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const inPath = path.join(os.tmpdir(), `${tempId}.${payload.extension}`);
  const outPath = path.join(os.tmpdir(), `${tempId}_out.png`);

  try {
    await fs.writeFile(inPath, payload.buffer);

    const { stdout } = await runner(
      cliPath,
      ['run', inPath, '--cmd', 'layer.removeBackground', '--out', outPath],
      env.photocraftTimeoutMs,
    );

    if (existsSync(outPath)) {
      const outBuffer = await fs.readFile(outPath);
      const outBase64 = `data:image/png;base64,${outBuffer.toString('base64')}`;

      let parsedResult: unknown = null;
      try {
        parsedResult = JSON.parse(stdout);
      } catch {
        // Non-JSON CLI output is acceptable
      }

      return {
        success: true,
        imageBase64: outBase64,
        result: parsedResult,
      };
    }

    return {
      success: false,
      fallback: true,
      message: 'Arquivo de saída não foi gerado pelo PhotoCraft CLI.',
    };
  } catch {
    return {
      success: false,
      fallback: true,
      message: 'Falha ou timeout no processador PhotoCraft; acionando fallback.',
    };
  } finally {
    await Promise.allSettled([fs.unlink(inPath), fs.unlink(outPath)]);
  }
}
