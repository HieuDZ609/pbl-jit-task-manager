import { redirect } from 'next/navigation'
import { isAuthBypassEnabled } from '@/server/auth-bypass'
import { auth } from '@/auth'
import { loadStats } from '@/server/actions/dashboard-actions'
import { StatsDashboard } from '@/features/dashboard/stats-dashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  if (!isAuthBypassEnabled()) {
    const session = await auth()
    if (!session) {
      redirect('/login')
    }
  }

  const stats = await loadStats(new Date())

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Bảng điều khiển</h1>
        <p className="text-sm text-muted-foreground">Tổng quan tiến độ công việc, tập trung và thói quen.</p>
      </div>
      <StatsDashboard stats={stats} />
    </section>
  )
}
