import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      thresholds: { statements: 80, branches: 75, functions: 80, lines: 80 },
      exclude: ['tests/**', '**/*.test.ts', 'dist/**', 'vitest.config.ts'],
    },
  },
});
//# sourceMappingURL=vitest.config.js.map
