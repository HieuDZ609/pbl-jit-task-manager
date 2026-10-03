import { redirect } from 'next/navigation'
import { importElearningItems } from '@/server/actions/elearning-actions'
import { repos } from '@/server/repositories'
import { ImportPanel } from '@/features/elearning/import-panel'
import { ElearningList } from '@/features/elearning/elearning-list'

export const dynamic = 'force-dynamic'

export default async function ElearningPage() {
  const items = await repos.elearning.list()

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">E-learning</h1>
        <p className="text-sm text-muted-foreground">
          Nhập môn học từ CSV hoặc file lịch ICS, trùng lặp được loại tự động.
        </p>
      </div>

      <ImportPanel
        existing={items}
        onConfirm={async (incoming) => {
          'use server'
          await importElearningItems(incoming)
          redirect('/elearning')
        }}
      />

      <ElearningList items={items} />
    </section>
  )
}
