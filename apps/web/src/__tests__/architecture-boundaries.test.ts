import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const FEATURES_DIR = join(process.cwd(), 'src/features')

function collectSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return collectSourceFiles(full)
    return /\.(ts|tsx)$/.test(full) ? [full] : []
  })
}

describe('architecture: features layer không được import server layer', () => {
  it('không có file nào trong src/features import @/server', () => {
    const violations = collectSourceFiles(FEATURES_DIR)
      .filter((file) => /from\s+['"]@\/server/.test(readFileSync(file, 'utf8')))
      .map((file) => relative(process.cwd(), file))

    expect(violations).toEqual([])
  })
})