export const MODES = ['work', 'break', 'longBreak'] as const
export type PomodoroMode = (typeof MODES)[number]

const DURATIONS: Record<PomodoroMode, number> = {
  work: 25,
  break: 5,
  longBreak: 15,
}

const LONG_BREAK_EVERY = 4

export function modeDuration(mode: PomodoroMode): number {
  return DURATIONS[mode]
}

export function nextMode(current: PomodoroMode, completedWorkCount: number): PomodoroMode {
  if (current === 'break') return 'work'
  if (current === 'longBreak') return 'work'
  return completedWorkCount > 0 && completedWorkCount % LONG_BREAK_EVERY === 0
    ? 'longBreak'
    : 'break'
}

export function describeSession(
  mode: PomodoroMode,
  minutes: number,
  completed: boolean,
): string {
  if (mode !== 'work') {
    return completed ? `Nghỉ ${minutes} phút hoàn tất` : `Nghỉ ${minutes} phút bị bỏ dở`
  }
  return completed
    ? `Phiên tập trung ${minutes} phút hoàn tất`
    : `Phiên tập trung ${minutes} phút bị dở`
}
