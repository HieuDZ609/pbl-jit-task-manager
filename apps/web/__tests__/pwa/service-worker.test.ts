import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const swPath = join(process.cwd(), 'public', 'sw.js')

describe('public/sw.js', () => {
  it('exists', () => {
    expect(existsSync(swPath)).toBe(true)
  })

  it('registers install and activate listeners', () => {
    const src = readFileSync(swPath, 'utf8')
    expect(src).toContain("addEventListener('install'")
    expect(src).toContain("addEventListener('activate'")
  })

  it('registers a fetch handler', () => {
    const src = readFileSync(swPath, 'utf8')
    expect(src).toContain("addEventListener('fetch'")
  })

  it('caches the app shell', () => {
    const src = readFileSync(swPath, 'utf8')
    expect(src).toContain('/dashboard')
  })
})
