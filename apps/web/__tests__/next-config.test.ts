import { describe, it, expect } from 'vitest'

import nextConfig from '../next.config.mjs'

/**
 * PGlite là package WASM/native và `pg` là native binding. Nếu Next bundler
 * gói chúng vào server bundle, server sẽ lỗi lúc runtime (fs/worker path
 * hỏng) chứ không lỗi lúc build — nên phải khai báo serverExternalPackages.
 */
describe('next.config', () => {
  it('đánh dấu PGlite và pg là server external package', () => {
    expect(nextConfig.serverExternalPackages).toEqual(
      expect.arrayContaining(['@electric-sql/pglite', 'pg']),
    )
  })

  it('vẫn transpile các package workspace dùng source TS', () => {
    expect(nextConfig.transpilePackages).toEqual(
      expect.arrayContaining(['@pbl/db', '@pbl/validators']),
    )
  })
})
