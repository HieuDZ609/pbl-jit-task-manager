'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { modeDuration, nextMode, type PomodoroMode } from './pomodoro'

export type CompletedSession = {
  mode: PomodoroMode
  minutes: number
  completed: boolean
}

type Props = {
  onSessionComplete?: (session: CompletedSession) => Promise<void> | void
}

const MODE_LABEL: Record<PomodoroMode, string> = {
  work: 'Tập trung',
  break: 'Nghỉ ngắn',
  longBreak: 'Nghỉ dài',
}

function format(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function FocusTimer({ onSessionComplete }: Props) {
  const [mode, setMode] = useState<PomodoroMode>('work')
  const [remaining, setRemaining] = useState(() => modeDuration('work') * 60)
  const [running, setRunning] = useState(false)
  const [workCount, setWorkCount] = useState(0)
  const startedAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) return 0
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    if (remaining !== 0 || !running) return
    setRunning(false)
    const duration = modeDuration(mode)
    const completed = true
    if (mode === 'work') {
      setWorkCount((c) => {
        const next = c + 1
        const target = nextMode('work', next)
        setMode(target)
        setRemaining(modeDuration(target) * 60)
        return next
      })
    } else {
      const target = nextMode(mode, workCount)
      setMode(target)
      setRemaining(modeDuration(target) * 60)
    }
    if (onSessionComplete) {
      void onSessionComplete({ mode, minutes: duration, completed })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, running])

  const reset = useCallback(() => {
    setRunning(false)
    setRemaining(modeDuration(mode) * 60)
    startedAtRef.current = null
  }, [mode])

  return (
    <div className="space-y-3 rounded-lg border p-4 text-center">
      <p data-testid="mode-label" className="text-sm font-medium text-muted-foreground">
        {MODE_LABEL[mode]}
      </p>
      <p data-testid="timer-display" className="font-mono text-5xl tabular-nums">
        {format(remaining)}
      </p>
      <div className="flex justify-center gap-2">
        {running ? (
          <button type="button" onClick={() => setRunning(false)}>
            Tạm dừng
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              startedAtRef.current = Date.now()
              setRunning(true)
            }}
          >
            Bắt đầu
          </button>
        )}
        <button type="button" onClick={reset}>
          Đặt lại
        </button>
      </div>
    </div>
  )
}
