import { Router } from 'express';
import { loadApiEnvConfig, type ApiEnvConfig } from '../../config/env.js';
import {
  fetchPhotosFromProvider,
  fetchStickersFromGiphy,
  synthesizeHarmonicPalette,
  trackUnsplashDownloadOnServer,
} from './media.service.js';

export function createMediaRouter(customEnv?: ApiEnvConfig): Router {
  const env = customEnv ?? loadApiEnvConfig();
  const router = Router();

  router.get('/media/photos', async (req, res, next) => {
    try {
      const provider = typeof req.query.provider === 'string' ? req.query.provider : 'unsplash';
      const query = typeof req.query.query === 'string' ? req.query.query : '';
      const mode = typeof req.query.mode === 'string' ? req.query.mode : undefined;
      const page = Number.parseInt(String(req.query.page ?? '1'), 10);
      const perPage = Number.parseInt(String(req.query.perPage ?? '24'), 10);

      const data = await fetchPhotosFromProvider(
        {
          provider,
          query,
          ...(mode ? { mode } : {}),
          page: Number.isFinite(page) ? page : 1,
          perPage: Number.isFinite(perPage) ? perPage : 24,
        },
        env,
      );

      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  });

  router.post('/media/download', async (req, res, next) => {
    try {
      const body = req.body as { readonly downloadLocation?: unknown } | undefined;
      const downloadLocation =
        typeof body?.downloadLocation === 'string' ? body.downloadLocation.trim() : '';

      if (!downloadLocation) {
        res.status(400).json({ success: false, error: 'downloadLocation é obrigatório.' });
        return;
      }

      const result = await trackUnsplashDownloadOnServer(downloadLocation, env);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  });

  router.get('/media/stickers', async (req, res, next) => {
    try {
      const query = typeof req.query.query === 'string' ? req.query.query : '';
      const limit = Number.parseInt(String(req.query.limit ?? '24'), 10);
      const offset = Number.parseInt(String(req.query.offset ?? '0'), 10);

      const data = await fetchStickersFromGiphy(
        {
          query,
          limit: Number.isFinite(limit) ? limit : 24,
          offset: Number.isFinite(offset) ? offset : 0,
        },
        env,
      );

      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  });

  router.post('/media/palettes', (req, res) => {
    const body = req.body as { readonly seedHex?: unknown } | undefined;
    const seedHex = typeof body?.seedHex === 'string' ? body.seedHex.trim() : undefined;
    const palette = synthesizeHarmonicPalette(seedHex);
    res.status(200).json(palette);
  });

  return router;
}
