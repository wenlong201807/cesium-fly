import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // 默认用 node 环境（不需要 jsdom），仅 DOM 相关测试用 happy-dom
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        'vite.config.ts',
        'vitest.config.ts',
        'src/main.tsx',
        'src/App.tsx',
      ],
    },
  },
});
