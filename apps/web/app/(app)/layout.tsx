'use client'

import Link from 'next/link'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/matrix', label: 'Matrix' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/focus', label: 'Focus' },
  { href: '/habits', label: 'Habits' },
  { href: '/reminders', label: 'Reminders' },
  { href: '/elearning', label: 'E-learning' },
  { href: '/myday', label: 'My Day' },
  { href: '/settings', label: 'Settings' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <header className="flex items-center justify-between border-b p-3 md:hidden">
        <span className="text-sm font-semibold">PBL Task Manager</span>
        <button
          type="button"
          aria-label={open ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="rounded border px-3 py-2 text-sm"
        >
          ☰
        </button>
      </header>

      <aside
        data-testid="app-nav"
        data-open={open ? 'true' : 'false'}
        className={[
          'border-r p-4 md:block md:w-64',
          open ? 'block' : 'hidden',
        ].join(' ')}
      >
        <nav className="flex flex-col gap-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded px-2 py-2 text-sm hover:bg-slate-100 md:px-0"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-4">{children}</main>
    </div>
  )
}
