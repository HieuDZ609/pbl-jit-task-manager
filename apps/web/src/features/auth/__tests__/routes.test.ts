import { describe, expect, it } from 'vitest'

import { isPublicRoute } from '../routes'

/**
 * Task 14 — allowlist route public.
 *
 * Trước đây rule là `pathname.startsWith("/(app)")`, mà `"(app)"` là route group
 * của Next không xuất hiện trong URL thật. Hệ quả: chỉ `/dashboard` được chặn,
 * còn `/tasks`, `/habits`, `/settings`… mở cho bất kỳ ai.
 *
 * Hai loại bug mà bộ test này nhắm vào:
 * - Quên một trang app → trang đó bị lộ. Danh sách private liệt kê tường minh.
 * - So khớp bằng chuỗi con → `/loginx` hoặc `/authfake` được coi là public.
 */
describe('isPublicRoute', () => {
  it('chỉ cho phép login và các endpoint Auth.js', () => {
    expect(isPublicRoute('/login')).toBe(true)
    expect(isPublicRoute('/login/')).toBe(true)
    expect(isPublicRoute('/auth')).toBe(true)
    expect(isPublicRoute('/auth/callback/google')).toBe(true)
    expect(isPublicRoute('/auth/session')).toBe(true)
  })

  it('cho phép manifest PWA vì không chứa dữ liệu người dùng', () => {
    expect(isPublicRoute('/manifest.json')).toBe(true)
  })

  it('chặn trang chủ — nó chỉ có tiêu đề, vào thẳng là thừa', () => {
    expect(isPublicRoute('/')).toBe(false)
  })

  it('chặn mọi trang app', () => {
    const pages = [
      '/dashboard',
      '/tasks',
      '/calendar',
      '/myday',
      '/habits',
      '/reminders',
      '/focus',
      '/matrix',
      '/elearning',
      '/settings',
    ]

    for (const page of pages) {
      expect(isPublicRoute(page), `${page} phải là private`).toBe(false)
    }
  })

  it('không coi tiền tố dạng chuỗi con là public', () => {
    expect(isPublicRoute('/loginx')).toBe(false)
    expect(isPublicRoute('/authfake')).toBe(false)
    expect(isPublicRoute('/manifest.jsonx')).toBe(false)
  })

  it('bỏ query string trước khi so khớp', () => {
    expect(isPublicRoute('/login?next=/tasks')).toBe(true)
    expect(isPublicRoute('/auth/session?x=1')).toBe(true)
  })
})
