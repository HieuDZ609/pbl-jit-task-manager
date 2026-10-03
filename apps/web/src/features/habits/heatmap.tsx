import type { HeatmapCell } from './streak'

const LEVEL_CLASS: Record<HeatmapCell['level'], string> = {
  0: 'bg-slate-100',
  1: 'bg-emerald-200',
  2: 'bg-emerald-300',
  3: 'bg-emerald-400',
  4: 'bg-emerald-600',
}

type Props = {
  cells: HeatmapCell[]
}

export function Heatmap({ cells }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {cells.map((cell) => (
          <div
            key={cell.dateKey}
            data-testid={`heat-cell-${cell.dateKey}`}
            title={`${cell.dateKey}: ${cell.count} lần`}
            className={`h-4 w-4 rounded-sm ${LEVEL_CLASS[cell.level]}`}
          />
        ))}
      </div>
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Ít</span>
        <span className="h-3 w-3 rounded-sm bg-slate-100" />
        <span className="h-3 w-3 rounded-sm bg-emerald-200" />
        <span className="h-3 w-3 rounded-sm bg-emerald-300" />
        <span className="h-3 w-3 rounded-sm bg-emerald-400" />
        <span className="h-3 w-3 rounded-sm bg-emerald-600" />
        <span>Nhiều</span>
      </p>
    </div>
  )
}
