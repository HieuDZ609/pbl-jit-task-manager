'use client'

import { useState } from 'react'
import { adapterFor, type ImportFormat } from '@/services/elearning/adapter'
import { dedupeItems } from '@/services/elearning/dedupe'
import type { ElearningItemInput } from '@/services/elearning/types'

type Props = {
  existing: ElearningItemInput[]
  onConfirm: (items: ElearningItemInput[]) => void | Promise<void>
}

const FORMATS: ImportFormat[] = ['csv', 'ics']

export function ImportPanel({ existing, onConfirm }: Props) {
  const [format, setFormat] = useState<ImportFormat>('csv')
  const [content, setContent] = useState('')
  const [preview, setPreview] = useState<ElearningItemInput[] | null>(null)
  const [dropped, setDropped] = useState(0)
  const [error, setError] = useState<string | null>(null)

  function handlePreview() {
    const parsed = adapterFor(format).parse(content)
    const unique = dedupeItems(parsed, existing)
    setPreview(unique)
    setDropped(parsed.length - unique.length)
    setError(unique.length === 0 ? 'Không tìm thấy bản ghi hợp lệ nào để nhập' : null)
  }

  async function handleConfirm() {
    if (!preview) return
    await onConfirm(preview)
    setPreview(null)
    setContent('')
    setDropped(0)
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex gap-1">
        {FORMATS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFormat(f)}
            aria-pressed={format === f}
            className={[
              'rounded border px-3 py-1 text-xs uppercase',
              format === f ? 'bg-slate-900 text-white' : '',
            ].join(' ')}
          >
            {f}
          </button>
        ))}
      </div>

      <label className="block text-xs text-muted-foreground" htmlFor="import-content">
        Nội dung {format.toUpperCase()}
      </label>
      <textarea
        id="import-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        className="w-full rounded border p-2 font-mono text-xs"
      />

      <div className="flex gap-2">
        <button type="button" onClick={handlePreview}>
          Xem trước
        </button>
        <button type="button" onClick={handleConfirm} disabled={!preview || preview.length === 0}>
          Xác nhận nhập
        </button>
      </div>

      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}

      {preview ? (
        <div data-testid="import-preview" className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {preview.length} bản ghi sẽ được nhập
            {dropped > 0 ? `, ${dropped} bản ghi trùng đã bỏ qua` : ''}
          </p>
          <ul className="space-y-1">
            {preview.map((item, index) => (
              <li key={`${item.title}-${index}`} data-testid={`import-row-${index}`} className="text-sm">
                <span className="font-medium">{item.title}</span>{' '}
                <span className="text-xs text-muted-foreground">
                  {item.course || '—'} · {item.type}
                  {item.dueAt ? ` · ${item.dueAt}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
