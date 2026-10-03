import type { Stats } from './stats'

const QUADRANT_LABEL = {
  A: 'Khẩn cấp — Quan trọng',
  B: 'Không khẩn cấp — Quan trọng',
  C: 'Khẩn cấp — Không quan trọng',
  D: 'Không khẩn cấp — Không quan trọng',
} as const

type Props = {
  stats: Stats
}

export function StatsDashboard({ stats }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded border p-3">
        <p className="text-xs text-muted-foreground">Hoàn thành hôm nay</p>
        <p data-testid="stat-completedToday" className="text-2xl font-semibold">
          {stats.completedToday}
        </p>
      </div>
      <div className="rounded border p-3">
        <p className="text-xs text-muted-foreground">Trễ hạn</p>
        <p data-testid="stat-overdue" className="text-2xl font-semibold">
          {stats.overdue}
        </p>
      </div>
      <div className="rounded border p-3">
        <p className="text-xs text-muted-foreground">Phút tập trung hôm nay</p>
        <p data-testid="stat-focusMinutesToday" className="text-2xl font-semibold">
          {stats.focusMinutesToday}
        </p>
      </div>
      <div className="rounded border p-3">
        <p className="text-xs text-muted-foreground">Tỉ lệ hoàn thành thói quen</p>
        <p data-testid="stat-habitCompletionRate" className="text-2xl font-semibold">
          {stats.habitCompletionRate}%
        </p>
      </div>

      <div className="rounded border p-3 sm:col-span-2">
        <p className="mb-2 text-xs text-muted-foreground">Ma trận Eisenhower (việc chưa xong)</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(['A', 'B', 'C', 'D'] as const).map((q) => (
            <div key={q} className="rounded bg-slate-50 p-2">
              <p className="text-[11px] text-muted-foreground">{QUADRANT_LABEL[q]}</p>
              <p data-testid={`quadrant-${q}`} className="text-lg font-semibold">
                {stats.quadrants[q]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
