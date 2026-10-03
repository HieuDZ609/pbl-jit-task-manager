import { describe, it, expect } from 'vitest'
import { adapterFor, csvAdapter, icsAdapter } from '../adapter'

describe('adapterFor', () => {
  it('returns the csv adapter', () => {
    expect(adapterFor('csv')).toBe(csvAdapter)
  })

  it('returns the ics adapter', () => {
    expect(adapterFor('ics')).toBe(icsAdapter)
  })
})

describe('adapters expose their format', () => {
  it('csv reports csv', () => {
    expect(csvAdapter.format).toBe('csv')
  })

  it('ics reports ics', () => {
    expect(icsAdapter.format).toBe('ics')
  })
})
