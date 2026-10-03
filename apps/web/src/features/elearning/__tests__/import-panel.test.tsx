import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImportPanel } from '../import-panel'

const CSV = 'course,title,due_at,url,type\nPBL,Làm PBL,2026-10-10,https://a.dev,course\nPBL,Làm PBL,2026-10-10,https://a.dev,course'
const ICS = 'BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:evt-1\nSUMMARY:Khoá học PBL\nDTSTART:20261010T090000Z\nEND:VEVENT\nEND:VCALENDAR'

describe('ImportPanel', () => {
  it('renders format selectors for csv and ics', () => {
    render(<ImportPanel existing={[]} onConfirm={vi.fn()} />)
    expect(screen.getByRole('button', { name: /^csv$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^ics$/i })).toBeInTheDocument()
  })

  it('renders a paste area', () => {
    render(<ImportPanel existing={[]} onConfirm={vi.fn()} />)
    expect(screen.getByLabelText(/nội dung/i)).toBeInTheDocument()
  })

  it('shows no preview before parsing', () => {
    render(<ImportPanel existing={[]} onConfirm={vi.fn()} />)
    expect(screen.queryByTestId('import-preview')).not.toBeInTheDocument()
  })

  it('previews parsed rows after clicking xem trước', async () => {
    render(<ImportPanel existing={[]} onConfirm={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/nội dung/i), CSV)
    await userEvent.click(screen.getByRole('button', { name: /xem trước/i }))
    expect(screen.getByTestId('import-preview')).toBeInTheDocument()
  })

  it('previews only unique rows', async () => {
    render(<ImportPanel existing={[]} onConfirm={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/nội dung/i), CSV)
    await userEvent.click(screen.getByRole('button', { name: /xem trước/i }))
    expect(screen.getAllByTestId(/import-row-/)).toHaveLength(1)
  })

  it('reports how many duplicate rows were dropped', async () => {
    render(<ImportPanel existing={[]} onConfirm={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/nội dung/i), CSV)
    await userEvent.click(screen.getByRole('button', { name: /xem trước/i }))
    expect(screen.getByText(/1 bản ghi trùng/i)).toBeInTheDocument()
  })

  it('excludes rows already imported', async () => {
    const existing = [
      {
        course: 'PBL',
        title: 'Làm PBL',
        dueAt: '2026-10-10',
        url: 'https://a.dev',
        type: 'task' as const,
        source: 'csv' as const,
        externalId: null,
      },
    ]
    const withNewRow = `${CSV}\nPBL,Bài mới,2026-10-12,,task`
    render(<ImportPanel existing={existing} onConfirm={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/nội dung/i), withNewRow)
    await userEvent.click(screen.getByRole('button', { name: /xem trước/i }))
    expect(screen.getAllByTestId(/import-row-/)).toHaveLength(1)
    expect(screen.getByText('Bài mới')).toBeInTheDocument()
  })

  it('parses ICS when the ics tab is selected', async () => {
    render(<ImportPanel existing={[]} onConfirm={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /^ics$/i }))
    await userEvent.type(screen.getByLabelText(/nội dung/i), ICS)
    await userEvent.click(screen.getByRole('button', { name: /xem trước/i }))
    expect(screen.getByText('Khoá học PBL')).toBeInTheDocument()
  })

  it('confirms with the unique rows', async () => {
    const onConfirm = vi.fn()
    render(<ImportPanel existing={[]} onConfirm={onConfirm} />)
    await userEvent.type(screen.getByLabelText(/nội dung/i), CSV)
    await userEvent.click(screen.getByRole('button', { name: /xem trước/i }))
    await userEvent.click(screen.getByRole('button', { name: /xác nhận/i }))
    expect(onConfirm).toHaveBeenCalledWith([
      expect.objectContaining({ title: 'Làm PBL', type: 'course' }),
    ])
  })

  it('disables confirm before a preview', () => {
    render(<ImportPanel existing={[]} onConfirm={vi.fn()} />)
    expect(screen.getByRole('button', { name: /xác nhận/i })).toBeDisabled()
  })

  it('shows an error for unparsable content', async () => {
    render(<ImportPanel existing={[]} onConfirm={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/nội dung/i), 'không phải dữ liệu')
    await userEvent.click(screen.getByRole('button', { name: /xem trước/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/không tìm thấy/i)
  })

  it('clears the preview after confirming', async () => {
    render(<ImportPanel existing={[]} onConfirm={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/nội dung/i), CSV)
    await userEvent.click(screen.getByRole('button', { name: /xem trước/i }))
    await userEvent.click(screen.getByRole('button', { name: /xác nhận/i }))
    expect(screen.queryByTestId('import-preview')).not.toBeInTheDocument()
  })
})
