import { describe, it, expect } from 'vitest'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

function pageFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return pageFiles(full)
    if (entry.name === 'page.tsx') return [full]
    return []
  })
}

describe('every route has a non-empty page module', () => {
  const pages = pageFiles('app')

  it('discovers at least ten routes', () => {
    expect(pages.length).toBeGreaterThanOrEqual(10)
  })

  it.each(pageFiles('app'))('%s is a non-empty module', (file) => {
    expect(statSync(file).size, `${file} is empty`).toBeGreaterThan(0)
  })
})
