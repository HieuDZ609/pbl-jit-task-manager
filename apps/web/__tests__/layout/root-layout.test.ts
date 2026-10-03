import { describe, it, expect } from 'vitest'
import RootLayout, { metadata, viewport } from '../../app/layout'

function renderToString(node: React.ReactElement): string {
  return JSON.stringify(node, (_k, v) => (typeof v === 'function' ? '[fn]' : v))
}

describe('Root layout', () => {
  it('declares the vi language', () => {
    const el = RootLayout({ children: 'x' })
    expect(el.props.lang).toBe('vi')
  })

  it('links the web manifest', () => {
    const el = RootLayout({ children: 'x' })
    expect(renderToString(el)).toContain('/manifest.json')
  })

  it('applies an apple touch icon', () => {
    const el = RootLayout({ children: 'x' })
    expect(renderToString(el)).toContain('/icons/icon-192.png')
  })

  it('exports a title', () => {
    expect(metadata.title).toBeTruthy()
  })

  it('exports a description', () => {
    expect((metadata as { description?: string }).description).toBeTruthy()
  })

  it('exports a manifest path', () => {
    expect((metadata as { manifest?: string }).manifest).toBe('/manifest.json')
  })

  it('declares a theme colour through viewport', () => {
    expect(viewport.themeColor).toMatch(/^#/)
  })

  it('declares width device-width', () => {
    expect(viewport.width).toBe('device-width')
  })

  it('wraps children in html and body', () => {
    const el = RootLayout({ children: 'x' })
    expect(el.type).toBe('html')
  })
})
