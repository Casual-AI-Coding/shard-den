import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.tsx'],
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
        '**/layout.tsx',
        '**/layout.test.tsx',
        '**/uml-styler/page.test.tsx',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
