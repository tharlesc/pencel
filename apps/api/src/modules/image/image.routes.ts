import { Router } from 'express';
import { loadApiEnvConfig, type ApiEnvConfig } from '../../config/env.js';
import { removeBackgroundWithPhotoCraft, type CliRunner } from './image.service.js';
import { validateRemoveBackgroundInput } from './image.validation.js';

export function createImageRouter(customEnv?: ApiEnvConfig, customRunner?: CliRunner): Router {
  const env = customEnv ?? loadApiEnvConfig();
  const router = Router();

  router.post('/image/remove-background', async (req, res, next) => {
    try {
      const validation = validateRemoveBackgroundInput(req.body, env.maxImageBytes);
      if (!validation.ok) {
        res.status(validation.status).json({
          success: false,
          error: validation.error,
        });
        return;
      }

      const result = await removeBackgroundWithPhotoCraft(validation.value, env, customRunner);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
