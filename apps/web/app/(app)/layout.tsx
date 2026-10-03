import Link from "next/link"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r p-4">
        <nav className="flex flex-col gap-2">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/tasks">Tasks</Link>
          <Link href="/matrix">Matrix</Link>
          <Link href="/calendar">Calendar</Link>
          <Link href="/focus">Focus</Link>
          <Link href="/habits">Habits</Link>
          <Link href="/reminders">Reminders</Link>
          <Link href="/elearning">E-learning</Link>
          <Link href="/myday">My Day</Link>
          <Link href="/settings">Settings</Link>
        </nav>
      </aside>
      <main className="flex-1 p-4">{children}</main>
    </div>
  )
}
