import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ElearningList } from '../elearning-list'
import type { ElearningItem } from '@/features/elearning/types'

function item(overrides: Partial<ElearningItem> = {}): ElearningItem {
  return {
    id: 'e1',
    course: 'PBL',
    title: 'Làm PBL',
    dueAt: null,
    url: null,
    type: 'task',
    source: 'csv',
    externalId: null,
    importedAt: new Date('2026-10-03'),
    ...overrides,
  }
}

describe('ElearningList', () => {
  it('shows an empty state', () => {
    render(<ElearningList items={[]} />)
    expect(screen.getByText(/chưa nhập môn học/i)).toBeInTheDocument()
  })

  it('renders the item title', () => {
    render(<ElearningList items={[item()]} />)
    expect(screen.getByText('Làm PBL')).toBeInTheDocument()
  })

  it('renders the course', () => {
    render(<ElearningList items={[item()]} />)
    expect(screen.getByText(/PBL · CSV · task/)).toBeInTheDocument()
  })

  it('falls back to a dash when the course is empty', () => {
    render(<ElearningList items={[item({ course: '' })]} />)
    expect(screen.getByText(/—/)).toBeInTheDocument()
  })

  it('renders a link when a url is present', () => {
    render(<ElearningList items={[item({ url: 'https://a.dev/c' })]} />)
    expect(screen.getByRole('link', { name: /mở/i })).toHaveAttribute('href', 'https://a.dev/c')
  })

  it('renders no link when the url is missing', () => {
    render(<ElearningList items={[item({ url: null })]} />)
    expect(screen.queryByRole('link', { name: /mở/i })).not.toBeInTheDocument()
  })

  it('shows the due date when present', () => {
    render(<ElearningList items={[item({ dueAt: '2026-10-10' })]} />)
    expect(screen.getByText(/2026-10-10/)).toBeInTheDocument()
  })

  it('opens external links safely', () => {
    render(<ElearningList items={[item({ url: 'https://a.dev/c' })]} />)
    expect(screen.getByRole('link', { name: /mở/i })).toHaveAttribute('rel', 'noreferrer')
  })

  it('renders multiple items', () => {
    render(<ElearningList items={[item({ id: 'a', title: 'A' }), item({ id: 'b', title: 'B' })]} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })
})
