import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import manifest from '../../public/manifest.json'

describe('public/manifest.json', () => {
  it('declares a name', () => {
    expect(manifest.name).toBeTruthy()
  })

  it('declares a short_name', () => {
    expect(manifest.short_name).toBeTruthy()
  })

  it('declares start_url', () => {
    expect(manifest.start_url).toBe('/dashboard')
  })

  it('declares display mode', () => {
    expect(manifest.display).toBe('standalone')
  })

  it('declares a background and theme colour', () => {
    expect(manifest.background_color).toMatch(/^#/)
    expect(manifest.theme_color).toMatch(/^#/)
  })

  it('declares at least one icon', () => {
    expect(manifest.icons.length).toBeGreaterThan(0)
  })

  it('every icon has a src and a size', () => {
    for (const icon of manifest.icons) {
      expect(icon.src).toBeTruthy()
      expect(icon.sizes).toBeTruthy()
    }
  })

  it('declares vi language', () => {
    expect(manifest.lang).toBe('vi')
  })

  it('every declared icon file exists on disk', () => {
    for (const icon of manifest.icons) {
      const path = join(process.cwd(), 'public', icon.src.replace(/^\//, ''))
      expect(existsSync(path), `${icon.src} is missing`).toBe(true)
    }
  })
})
