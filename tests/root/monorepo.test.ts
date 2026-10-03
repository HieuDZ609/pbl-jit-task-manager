import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

describe('monorepo scaffold', () => {
  const root = process.cwd()

  it('has required root files', () => {
    expect(existsSync(join(root, 'package.json'))).toBe(true)
    expect(existsSync(join(root, 'pnpm-workspace.yaml'))).toBe(true)
    expect(existsSync(join(root, 'turbo.json'))).toBe(true)
    expect(existsSync(join(root, 'tsconfig.base.json'))).toBe(true)
    expect(existsSync(join(root, '.gitignore'))).toBe(true)
    expect(existsSync(join(root, 'README.md'))).toBe(true)
  })
})
