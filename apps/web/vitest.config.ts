import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // e2e/ chạy bằng Playwright runner, không phải Vitest.
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**', '**/*.e2e.{ts,tsx}'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}', '__tests__/**/*.{ts,tsx}'],
      exclude: ['**/__tests__/**', '**/*.d.ts', 'vitest.setup.ts'],
      thresholds: {
        branches: 90,
        statements: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Test-only: app chạy migration ngoài process (xem `packages/db/scripts`),
      // chỉ contract test cần gọi trực tiếp để dựng schema trên PGlite.
      '@pbl/db/scripts/migrate': path.resolve(__dirname, '../../packages/db/scripts/migrate.ts'),
      '@pbl/db/client': path.resolve(__dirname, '../../packages/db/src/client.ts'),
      '@pbl/validators': path.resolve(__dirname, '../../packages/validators/src/index.ts'),
      '@pbl/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
      '@pbl/db': path.resolve(__dirname, '../../packages/db/src/index.ts'),
    },
  },
})
