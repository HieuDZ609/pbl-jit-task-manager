import { redirect } from 'next/navigation'
import {
  completeReminder,
  createReminder,
  deleteReminder,
  snoozeReminder,
} from '@/server/actions/reminder-actions'
import { repos } from '@/server/repositories'
import { ReminderForm } from '@/features/reminders/reminder-form'
import { ReminderList } from '@/features/reminders/reminder-list'

export const dynamic = 'force-dynamic'

export default async function RemindersPage() {
  const reminders = await repos.reminders.list()

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Nhắc nhở</h1>
        <p className="text-sm text-muted-foreground">Nhắc việc theo giờ, hỗ trợ bỏ qua và lặp lại.</p>
      </div>

      <ReminderForm
        onCreate={async (input) => {
          'use server'
          await createReminder(input)
          redirect('/reminders')
        }}
      />

      <ReminderList
        reminders={reminders}
        now={new Date()}
        onDone={async (id) => {
          'use server'
          await completeReminder(id)
        }}
        onSnooze={async (id, minutes) => {
          'use server'
          await snoozeReminder(id, minutes)
        }}
        onDelete={async (id) => {
          'use server'
          await deleteReminder(id)
        }}
      />
    </section>
  )
}
