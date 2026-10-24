import { createApp } from './app.js';
import { loadApiEnvConfig } from './config/env.js';

const env = loadApiEnvConfig();
const app = createApp(env);

const server = app.listen(env.port, env.host, () => {
  console.info(
    `[@pencel/api] Server listening at http://${env.host}:${env.port}/api/v1/health (${env.nodeEnv})`,
  );
});

function shutdown(signal: string): void {
  console.info(`[@pencel/api] Received ${signal}. Closing HTTP server...`);
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
