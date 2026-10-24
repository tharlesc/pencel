import { execFile } from 'node:child_process';
import { existsSync, promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { Router } from 'express';

const execFileAsync = promisify(execFile);

const DEFAULT_PHOTOCRAFT_PATH = 'C:\\Program Files\\PhotoCraft\\photocraft-cli.exe';

export function findPhotoCraftCli(): string | null {
  if (process.env.PHOTOCRAFT_CLI_PATH && existsSync(process.env.PHOTOCRAFT_CLI_PATH)) {
    return process.env.PHOTOCRAFT_CLI_PATH;
  }
  if (existsSync(DEFAULT_PHOTOCRAFT_PATH)) {
    return DEFAULT_PHOTOCRAFT_PATH;
  }
  return null;
}

export function createImageRouter(): Router {
  const router = Router();

  router.post('/image/remove-background', async (req, res, next) => {
    try {
      const { imageBase64 } = req.body as { imageBase64?: string };
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.status(400).json({ success: false, error: 'imageBase64 é obrigatório' });
        return;
      }

      const cliPath = findPhotoCraftCli();
      if (!cliPath) {
        res
          .status(200)
          .json({ success: false, fallback: true, message: 'PhotoCraft CLI não encontrado' });
        return;
      }

      // Extract raw base64 data
      const matches = imageBase64.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      const ext = matches?.[1] || 'png';
      const base64Data = matches?.[2] || imageBase64;
      const buffer = Buffer.from(base64Data, 'base64');

      const tempId = `pencel_rmbg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const inPath = path.join(os.tmpdir(), `${tempId}.${ext}`);
      const outPath = path.join(os.tmpdir(), `${tempId}_out.png`);

      await fs.writeFile(inPath, buffer);

      try {
        const { stdout } = await execFileAsync(cliPath, [
          'run',
          inPath,
          '--cmd',
          'layer.removeBackground',
          '--out',
          outPath,
        ]);

        if (existsSync(outPath)) {
          const outBuffer = await fs.readFile(outPath);
          const outBase64 = `data:image/png;base64,${outBuffer.toString('base64')}`;

          let parsedResult: unknown = null;
          try {
            parsedResult = JSON.parse(stdout);
          } catch {
            // non-json output is fine
          }

          res.json({
            success: true,
            imageBase64: outBase64,
            result: parsedResult,
          });
          return;
        } else {
          res.json({ success: false, fallback: true, message: 'Arquivo de saída não foi gerado' });
          return;
        }
      } catch (cliErr) {
        console.warn('PhotoCraft CLI falhou ou imagem não suportada:', cliErr);
        res.json({
          success: false,
          fallback: true,
          message: 'Falha no processador PhotoCraft, acionando fallback.',
        });
        return;
      } finally {
        // Clean up temp files
        fs.unlink(inPath).catch(() => {});
        fs.unlink(outPath).catch(() => {});
      }
    } catch (err) {
      next(err);
    }
  });

  return router;
}
