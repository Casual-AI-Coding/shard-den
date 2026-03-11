import { defineConfig } from 'vitest/config';
import path from 'path';

const webRoot = path.resolve(__dirname, './');

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.tsx'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/.next/**'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/app/tools/json-extractor/**/*.tsx',
        'src/app/tools/json-extractor/**/*.ts',
        'src/app/tools/uml-styler/**/*.tsx',
        'src/app/tools/uml-styler/**/*.ts',
      ],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'public/',
        'e2e/',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(webRoot, './src'),
    },
  },
});
