import type { ElearningItem } from '@/server/repositories/elearning-repository'

type Props = {
  items: ElearningItem[]
}

export function ElearningList({ items }: Props) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa nhập môn học nào.</p>
  }

  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-2 rounded border p-2 text-sm">
          <div>
            <p className="font-medium">{item.title}</p>
            <p className="text-xs text-muted-foreground">
              {item.course || '—'} · {item.source.toUpperCase()} · {item.type}
              {item.dueAt ? ` · hạn ${item.dueAt}` : ''}
            </p>
          </div>
          {item.url ? (
            <a href={item.url} className="text-xs underline" target="_blank" rel="noreferrer">
              Mở
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
