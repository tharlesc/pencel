/// <reference types="vitest/config" />
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function vtracerWasmPlugin(): Plugin {
  return {
    name: 'vtracer-wasm',
    generateBundle() {
      const candidates = [
        path.resolve(__dirname, '../../node_modules/vtracer-browser/dist/vtracer_bg.wasm'),
        path.resolve(__dirname, 'node_modules/vtracer-browser/dist/vtracer_bg.wasm'),
        path.resolve(process.cwd(), 'node_modules/vtracer-browser/dist/vtracer_bg.wasm'),
      ];
      const found = candidates.find((p) => fs.existsSync(p));
      if (found) {
        const wasmBuffer = fs.readFileSync(found);
        this.emitFile({
          type: 'asset',
          fileName: 'assets/vtracer_bg.wasm',
          source: wasmBuffer,
        });
        this.emitFile({
          type: 'asset',
          fileName: 'vtracer_bg.wasm',
          source: wasmBuffer,
        });
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.endsWith('.wasm')) {
          res.setHeader('Content-Type', 'application/wasm');
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), vtracerWasmPlugin()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    exclude: ['@huggingface/transformers', 'vtracer-browser'],
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id: string): string | undefined {
          if (id.includes('node_modules/vtracer-browser')) {
            return 'vendor-vtracer';
          }
          if (
            id.includes('node_modules/@huggingface/transformers') ||
            id.includes('node_modules/onnxruntime-web')
          ) {
            return 'vendor-ai';
          }
          if (id.includes('node_modules/fabric')) {
            return 'vendor-fabric';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setupTests.ts'],
    globals: false,
    testTimeout: 15000,
  },
});
