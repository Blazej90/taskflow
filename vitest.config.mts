import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src/app'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.vitest.spec.ts'],
  },
});
