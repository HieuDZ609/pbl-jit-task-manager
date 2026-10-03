import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { FolderListPanel } from '../folder-list-panel'
import type { FolderWithLists } from '../folder-list-types'

const tree: FolderWithLists[] = [
  {
    id: 'f1',
    name: 'Công việc',
    color: null,
    sortOrder: 0,
    lists: [{ id: 'l1', folderId: 'f1', name: 'Việc cấp bách', color: null, sortOrder: 0 }],
  },
]

const rootLists = [{ id: 'l0', folderId: null, name: 'Không folder', color: null, sortOrder: 0 }]

const handlers = {
  onCreateFolder: vi.fn(async () => ({ id: 'f2', name: 'Mới', color: null, sortOrder: 1 })),
  onRenameFolder: vi.fn(async () => ({ id: 'f1', name: 'Đổi', color: null, sortOrder: 0 })),
  onDeleteFolder: vi.fn(async () => undefined),
  onCreateList: vi.fn(async () => ({
    id: 'l2',
    folderId: 'f1',
    name: 'List mới',
    color: null,
    sortOrder: 1,
  })),
  onRenameList: vi.fn(async () => ({ id: 'l1', folderId: 'f1', name: 'List đổi', color: null, sortOrder: 0 })),
  onDeleteList: vi.fn(async () => undefined),
  onFilterChange: vi.fn(),
}

function renderPanel() {
  return render(
    <FolderListPanel
      tree={tree}
      rootLists={rootLists}
      activeFilter={{ kind: 'all' }}
      {...handlers}
    />,
  )
}

describe('FolderListPanel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('hiện folder kèm list và root list', () => {
    renderPanel()
    expect(screen.getByText(/Công việc/)).toBeInTheDocument()
    expect(screen.getByText(/Việc cấp bách/)).toBeInTheDocument()
    expect(screen.getByText(/Không folder/)).toBeInTheDocument()
  })

  it('bấm folder gọi onFilterChange với kind=folder', async () => {
    renderPanel()
    await userEvent.click(screen.getByRole('button', { name: /lọc.*Công việc/i }))
    expect(handlers.onFilterChange).toHaveBeenCalledWith({ kind: 'folder', id: 'f1' })
  })

  it('bấm list gọi onFilterChange với kind=list', async () => {
    renderPanel()
    await userEvent.click(screen.getByRole('button', { name: /lọc.*Việc cấp bách/i }))
    expect(handlers.onFilterChange).toHaveBeenCalledWith({ kind: 'list', id: 'l1' })
  })

  it('bấm "Tất cả" gọi onFilterChange với kind=all', async () => {
    renderPanel()
    await userEvent.click(screen.getByRole('button', { name: /tất cả/i }))
    expect(handlers.onFilterChange).toHaveBeenCalledWith({ kind: 'all' })
  })

  it('đánh dấu filter đang active', () => {
    render(
      <FolderListPanel
        tree={tree}
        rootLists={rootLists}
        activeFilter={{ kind: 'list', id: 'l1' }}
        {...handlers}
      />,
    )
    expect(screen.getByRole('button', { name: /lọc.*Việc cấp bách/i })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('tạo folder gọi onCreateFolder với tên đã trim', async () => {
    renderPanel()
    await userEvent.type(screen.getByLabelText(/tên folder mới/i), '  Học  ')
    await userEvent.click(screen.getByRole('button', { name: /thêm folder/i }))
    expect(handlers.onCreateFolder).toHaveBeenCalledWith('Học')
  })

  it('tạo list trong folder đang chọn', async () => {
    renderPanel()
    await userEvent.click(screen.getByRole('button', { name: /thêm list/i }))
    await userEvent.selectOptions(screen.getByLabelText(/folder của list/i), 'f1')
    await userEvent.type(screen.getByLabelText(/tên list mới/i), 'Tuần này')
    await userEvent.click(screen.getByRole('button', { name: /lưu list/i }))
    expect(handlers.onCreateList).toHaveBeenCalledWith('Tuần này', 'f1')
  })

  it('xoá folder gọi onDeleteFolder', async () => {
    renderPanel()
    await userEvent.click(screen.getByRole('button', { name: /xoá folder Công việc/i }))
    expect(handlers.onDeleteFolder).toHaveBeenCalledWith('f1')
  })

  it('xoá list gọi onDeleteList', async () => {
    renderPanel()
    await userEvent.click(screen.getByRole('button', { name: /xoá list Việc cấp bách/i }))
    expect(handlers.onDeleteList).toHaveBeenCalledWith('l1')
  })

  it('đổi tên folder qua form inline', async () => {
    renderPanel()
    await userEvent.click(screen.getByRole('button', { name: /đổi tên folder Công việc/i }))
    await userEvent.clear(screen.getByLabelText(/tên folder sau khi đổi/i))
    await userEvent.type(screen.getByLabelText(/tên folder sau khi đổi/i), 'Đổi tên')
    await userEvent.click(screen.getByRole('button', { name: /lưu tên folder/i }))
    expect(handlers.onRenameFolder).toHaveBeenCalledWith('f1', 'Đổi tên')
  })

  it('đổi tên list qua form inline', async () => {
    renderPanel()
    await userEvent.click(screen.getByRole('button', { name: /đổi tên list Việc cấp bách/i }))
    await userEvent.clear(screen.getByLabelText(/tên list sau khi đổi/i))
    await userEvent.type(screen.getByLabelText(/tên list sau khi đổi/i), 'List đổi')
    await userEvent.click(screen.getByRole('button', { name: /lưu tên list/i }))
    expect(handlers.onRenameList).toHaveBeenCalledWith('l1', 'List đổi')
  })

  it('bỏ đổi tên thì không gọi action', async () => {
    renderPanel()
    await userEvent.click(screen.getByRole('button', { name: /đổi tên folder Công việc/i }))
    await userEvent.click(screen.getByRole('button', { name: /huỷ đổi tên folder/i }))
    expect(handlers.onRenameFolder).not.toHaveBeenCalled()
  })

  it('hiện lỗi khi action thất bại', async () => {
    handlers.onCreateFolder.mockRejectedValueOnce(new Error('trùng tên'))
    renderPanel()
    await userEvent.type(screen.getByLabelText(/tên folder mới/i), 'Công việc')
    await userEvent.click(screen.getByRole('button', { name: /thêm folder/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/trùng tên/)
  })
})