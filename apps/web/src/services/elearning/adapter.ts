import { parseCsv } from './csv.parse'
import { parseIcs } from './ics.parse'
import type { ElearningItemInput } from './types'

export type ImportFormat = 'csv' | 'ics'

export interface ElearningAdapter {
  readonly format: ImportFormat
  parse(content: string): ElearningItemInput[]
}

export const csvAdapter: ElearningAdapter = {
  format: 'csv',
  parse: parseCsv,
}

export const icsAdapter: ElearningAdapter = {
  format: 'ics',
  parse: parseIcs,
}

export function adapterFor(format: ImportFormat): ElearningAdapter {
  return format === 'csv' ? csvAdapter : icsAdapter
}
