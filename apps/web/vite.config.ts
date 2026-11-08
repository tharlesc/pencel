/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
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
