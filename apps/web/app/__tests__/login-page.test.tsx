import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

/**
 * Trang login có một server action gọi `signIn('google')`. Không có Google
 * credential thật (AUTH_GOOGLE_ID/SECRET chưa có) nên **không thể** test được
 * luồng OAuth thật; test ở đây chỉ đảm bảo UI xuất hiện đúng và action không
 * chạy nhầm lúc render.
 */
vi.mock('@/auth', () => ({
  signIn: vi.fn(),
}))

const { default: LoginPage } = await import('../login/page')

describe('trang /login', () => {
  it('hiển thị tiêu đề và nút đăng nhập bằng Google', () => {
    render(<LoginPage />)

    expect(screen.getByRole('heading', { name: /đăng nhập/i })).toBeInTheDocument()
    const button = screen.getByRole('button', { name: /tiếp tục với google/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('type', 'submit')
  })
})