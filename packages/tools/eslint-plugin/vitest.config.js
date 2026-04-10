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
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
      exclude: ['tests/**', '**/*.test.ts', 'dist/**', 'vitest.config.ts'],
    },
  },
});
//# sourceMappingURL=vitest.config.js.map
