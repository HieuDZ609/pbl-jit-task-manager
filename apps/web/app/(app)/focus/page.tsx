import { logFocusSession } from '@/server/actions/focus-actions'
import { FocusTimer } from '@/features/focus/focus-timer'
import { WhiteNoisePlayer } from '@/features/focus/white-noise'

export default function FocusPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Tập trung</h1>
        <p className="text-sm text-muted-foreground">
          Pomodoro 25/5 kèm âm thanh nền để chống xao nhãng.
        </p>
      </div>
      <FocusTimer
        onSessionComplete={(s) =>
          logFocusSession({
            mode: s.mode,
            minutes: s.minutes,
            completed: s.completed,
          })
        }
      />
      <WhiteNoisePlayer />
    </section>
  )
}
