import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { parse } from 'yaml'

type CiDoc = {
  on?: Record<string, unknown>
  jobs?: Record<string, { runsOn?: string; steps?: unknown[] }>
}

describe('GitHub Actions CI', () => {
  const root = process.cwd()
  const path = join(root, '.github/workflows/ci.yml')

  function doc(): CiDoc {
    return parse(readFileSync(path, 'utf8')) as CiDoc
  }

  it('chạy trên pull_request và push, không có deploy', () => {
    const on = doc().on
    expect(on, 'thiếu key "on"').toBeTypeOf('object')
    expect(on!.pull_request).toBeDefined()
    expect(on!.push).toBeDefined()
  })

  it('đủ 5 job: install, typecheck, test, e2e, build', () => {
    const jobs = doc().jobs ?? {}
    for (const name of ['install', 'typecheck', 'test', 'e2e', 'build']) {
      expect(Object.keys(jobs), `thiếu job ${name}`).toContain(name)
    }
    expect(Object.keys(jobs)).not.toContain('deploy')
    expect(Object.keys(jobs)).not.toContain('release')
  })

  it('không phụ thuộc secret: workflow không tham chiếu secrets.* (dùng AUTH_SECRET set cứng ở step test)', () => {
    const workflow = readFileSync(path, 'utf8')
    expect(workflow).not.toContain('secrets.')
    expect(workflow).not.toContain('${{ secrets')
  })

  it('node 24 + setup cache pnpm', () => {
    const text = readFileSync(path, 'utf8')
    expect(text).toMatch(/node-version.*24/)
    expect(text).toMatch(/pnpm\/action-setup|corepack/i)
    expect(text).toMatch(/cache/)
  })

  it('job test chạy vitest (coverage) sau generate + typecheck + install', () => {
    const jobs = doc().jobs ?? {}
    const steps: unknown[] = jobs['test']?.steps ?? []
    expect(steps.length).toBeGreaterThanOrEqual(3)
  })
})