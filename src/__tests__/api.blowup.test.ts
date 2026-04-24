import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TEST_USER_ID, makeTask } from './helpers'
import type { TasksDoc } from '@/types'

// ---- Mocks ----
vi.mock('@/lib/onejsonfile', () => ({
  updateTasks: vi.fn(),
}))

vi.mock('@/lib/get-user-id', () => ({
  getUserId: vi.fn(),
}))

vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))

import { updateTasks } from '@/lib/onejsonfile'
import { getUserId } from '@/lib/get-user-id'
import { POST } from '@/app/api/tasks/blowup/route'

const mockUpdateTasks = updateTasks as ReturnType<typeof vi.fn>
const mockGetUserId = getUserId as ReturnType<typeof vi.fn>

function setupUpdateTasks(currentDoc: TasksDoc) {
  mockUpdateTasks.mockImplementation(async (mutate: (d: TasksDoc) => TasksDoc) => {
    const result = await mutate({ ...currentDoc })
    for (const key of Object.keys(currentDoc)) delete (currentDoc as Record<string, unknown>)[key]
    Object.assign(currentDoc, result)
    return result
  })
}

function makeBlowupRequest() {
  const { NextRequest } = require('next/server')
  return new NextRequest('http://localhost:3000/api/tasks/blowup', { method: 'POST' })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUserId.mockResolvedValue(TEST_USER_ID)
})

describe('POST /api/tasks/blowup', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetUserId.mockResolvedValue(null)
    const res = await POST()
    expect(res.status).toBe(401)
  })

  it('moves all non-done Today tasks to Not Today', async () => {
    const tasks = [
      makeTask({ id: 't1', list: 'today', state: 'not_started' }),
      makeTask({ id: 't2', list: 'today', state: 'in_progress' }),
    ]
    const doc: TasksDoc = { [TEST_USER_ID]: tasks }
    setupUpdateTasks(doc)

    const res = await POST()
    const body = await res.json()

    expect(res.status).toBe(200)
    const resultTasks: Array<{ id: string; list: string }> = body.tasks
    expect(resultTasks.find(t => t.id === 't1')?.list).toBe('not_today')
    expect(resultTasks.find(t => t.id === 't2')?.list).toBe('not_today')
  })

  it('increments blownUpCount for each moved task', async () => {
    const tasks = [
      makeTask({ id: 't1', list: 'today', state: 'not_started', blownUpCount: 2 }),
      makeTask({ id: 't2', list: 'today', state: 'in_progress', blownUpCount: 0 }),
    ]
    const doc: TasksDoc = { [TEST_USER_ID]: tasks }
    setupUpdateTasks(doc)

    const res = await POST()
    const body = await res.json()

    const resultTasks: Array<{ id: string; blownUpCount: number }> = body.tasks
    expect(resultTasks.find(t => t.id === 't1')?.blownUpCount).toBe(3)
    expect(resultTasks.find(t => t.id === 't2')?.blownUpCount).toBe(1)
  })

  it('leaves done Today tasks in Today', async () => {
    const tasks = [
      makeTask({ id: 't-done', list: 'today', state: 'done' }),
      makeTask({ id: 't-active', list: 'today', state: 'not_started' }),
    ]
    const doc: TasksDoc = { [TEST_USER_ID]: tasks }
    setupUpdateTasks(doc)

    const res = await POST()
    const body = await res.json()

    const resultTasks: Array<{ id: string; list: string }> = body.tasks
    expect(resultTasks.find(t => t.id === 't-done')?.list).toBe('today')
    expect(resultTasks.find(t => t.id === 't-active')?.list).toBe('not_today')
  })

  it('leaves Not Today tasks unchanged', async () => {
    const tasks = [
      makeTask({ id: 't-today', list: 'today', state: 'not_started' }),
      makeTask({ id: 't-nt', list: 'not_today', state: 'not_started', blownUpCount: 1 }),
    ]
    const doc: TasksDoc = { [TEST_USER_ID]: tasks }
    setupUpdateTasks(doc)

    const res = await POST()
    const body = await res.json()

    const resultTasks: Array<{ id: string; list: string; blownUpCount: number }> = body.tasks
    const ntTask = resultTasks.find(t => t.id === 't-nt')
    // The not_today task's order shifts but its list and blownUpCount remain unchanged
    expect(ntTask?.list).toBe('not_today')
    expect(ntTask?.blownUpCount).toBe(1)
  })

  it('returns the updated task list', async () => {
    const tasks = [
      makeTask({ id: 't1', list: 'today', state: 'not_started' }),
    ]
    const doc: TasksDoc = { [TEST_USER_ID]: tasks }
    setupUpdateTasks(doc)

    const res = await POST()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(body.tasks)).toBe(true)
    expect(body.tasks).toHaveLength(1)
  })

  it('handles empty task list gracefully', async () => {
    const doc: TasksDoc = { [TEST_USER_ID]: [] }
    setupUpdateTasks(doc)

    const res = await POST()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.tasks).toEqual([])
  })

  it('handles new user with no tasks entry', async () => {
    const doc: TasksDoc = {}
    setupUpdateTasks(doc)

    const res = await POST()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.tasks).toEqual([])
  })

  it('moved tasks are prepended to Not Today (lower order values) than existing Not Today tasks', async () => {
    const tasks = [
      makeTask({ id: 't-today', list: 'today', state: 'not_started', order: 0 }),
      makeTask({ id: 't-nt-existing', list: 'not_today', state: 'not_started', order: 5 }),
    ]
    const doc: TasksDoc = { [TEST_USER_ID]: tasks }
    setupUpdateTasks(doc)

    const res = await POST()
    const body = await res.json()

    const resultTasks: Array<{ id: string; order: number }> = body.tasks
    const movedTask = resultTasks.find(t => t.id === 't-today')!
    const existingNtTask = resultTasks.find(t => t.id === 't-nt-existing')!
    // Moved tasks go to top of not_today (lower order)
    expect(movedTask.order).toBeLessThan(existingNtTask.order)
  })
})
