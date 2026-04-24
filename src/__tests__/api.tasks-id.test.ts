import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TEST_USER_ID, makeTask, makeRequest } from './helpers'
import type { TasksDoc } from '@/types'

// ---- Mocks ----
vi.mock('@/lib/onejsonfile', () => ({
  readTasks: vi.fn(),
  updateTasks: vi.fn(),
}))

vi.mock('@/lib/get-user-id', () => ({
  getUserId: vi.fn(),
}))

vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))

import { updateTasks } from '@/lib/onejsonfile'
import { getUserId } from '@/lib/get-user-id'
import { PATCH, DELETE } from '@/app/api/tasks/[id]/route'

const mockUpdateTasks = updateTasks as ReturnType<typeof vi.fn>
const mockGetUserId = getUserId as ReturnType<typeof vi.fn>

function setupUpdateTasks(currentDoc: TasksDoc) {
  mockUpdateTasks.mockImplementation(async (mutate: (d: TasksDoc) => TasksDoc) => {
    const result = await mutate({ ...currentDoc })
    // Update in place
    for (const key of Object.keys(currentDoc)) delete (currentDoc as Record<string, unknown>)[key]
    Object.assign(currentDoc, result)
    return result
  })
}

function patchReq(body: unknown) {
  return makeRequest('http://localhost:3000/api/tasks/task-1', {
    method: 'PATCH',
    body,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUserId.mockResolvedValue(TEST_USER_ID)
})

// ---------------------------------------------------------------------------
// PATCH /api/tasks/[id] — standard updates
// ---------------------------------------------------------------------------
describe('PATCH /api/tasks/[id] — standard updates', () => {
  it('updates the title', async () => {
    const task = makeTask({ id: 'task-1', title: 'Old title' })
    const doc: TasksDoc = { [TEST_USER_ID]: [task] }
    setupUpdateTasks(doc)

    const res = await PATCH(patchReq({ title: 'New title' }), { params: Promise.resolve({ id: 'task-1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.task.title).toBe('New title')
  })

  it('updates notes with a non-null string', async () => {
    const task = makeTask({ id: 'task-1', notes: undefined })
    const doc: TasksDoc = { [TEST_USER_ID]: [task] }
    setupUpdateTasks(doc)

    const res = await PATCH(patchReq({ notes: 'Some notes' }), { params: Promise.resolve({ id: 'task-1' }) })
    const body = await res.json()

    expect(body.task.notes).toBe('Some notes')
  })

  it('clears notes with null — null is persisted (not dropped)', async () => {
    const task = makeTask({ id: 'task-1', notes: 'Existing notes' })
    const doc: TasksDoc = { [TEST_USER_ID]: [task] }
    setupUpdateTasks(doc)

    const res = await PATCH(patchReq({ notes: null }), { params: Promise.resolve({ id: 'task-1' }) })
    const body = await res.json()

    // The API spreads body over the task, so notes: null should be in the result
    expect(body.task.notes).toBeNull()
  })

  it('updates state: not_started → in_progress (no completedAt change)', async () => {
    const task = makeTask({ id: 'task-1', state: 'not_started', completedAt: undefined })
    const doc: TasksDoc = { [TEST_USER_ID]: [task] }
    setupUpdateTasks(doc)

    const res = await PATCH(patchReq({ state: 'in_progress' }), { params: Promise.resolve({ id: 'task-1' }) })
    const body = await res.json()

    expect(body.task.state).toBe('in_progress')
    expect(body.task.completedAt).toBeUndefined()
  })

  it('updates state: not_started → done sets completedAt to ISO string', async () => {
    const task = makeTask({ id: 'task-1', state: 'not_started' })
    const doc: TasksDoc = { [TEST_USER_ID]: [task] }
    setupUpdateTasks(doc)

    const res = await PATCH(patchReq({ state: 'done' }), { params: Promise.resolve({ id: 'task-1' }) })
    const body = await res.json()

    expect(body.task.state).toBe('done')
    expect(typeof body.task.completedAt).toBe('string')
    expect(new Date(body.task.completedAt).toISOString()).toBe(body.task.completedAt)
  })

  it('updates state: done → not_started clears completedAt', async () => {
    const task = makeTask({
      id: 'task-1',
      state: 'done',
      completedAt: '2024-01-01T00:00:00.000Z',
    })
    const doc: TasksDoc = { [TEST_USER_ID]: [task] }
    setupUpdateTasks(doc)

    const res = await PATCH(patchReq({ state: 'not_started' }), { params: Promise.resolve({ id: 'task-1' }) })
    const body = await res.json()

    expect(body.task.state).toBe('not_started')
    // completedAt should be cleared (undefined means it won't appear in JSON)
    expect(body.task.completedAt).toBeUndefined()
  })

  it('moving list today → not_today increments blownUpCount', async () => {
    const task = makeTask({ id: 'task-1', list: 'today', blownUpCount: 2 })
    const doc: TasksDoc = { [TEST_USER_ID]: [task] }
    setupUpdateTasks(doc)

    const res = await PATCH(patchReq({ list: 'not_today' }), { params: Promise.resolve({ id: 'task-1' }) })
    const body = await res.json()

    expect(body.task.list).toBe('not_today')
    expect(body.task.blownUpCount).toBe(3)
  })

  it('moving list not_today → today does NOT increment blownUpCount', async () => {
    const task = makeTask({ id: 'task-1', list: 'not_today', blownUpCount: 1 })
    const doc: TasksDoc = { [TEST_USER_ID]: [task] }
    setupUpdateTasks(doc)

    const res = await PATCH(patchReq({ list: 'today' }), { params: Promise.resolve({ id: 'task-1' }) })
    const body = await res.json()

    expect(body.task.list).toBe('today')
    expect(body.task.blownUpCount).toBe(1)
  })

  it('updates pinned field', async () => {
    const task = makeTask({ id: 'task-1', pinned: false })
    const doc: TasksDoc = { [TEST_USER_ID]: [task] }
    setupUpdateTasks(doc)

    const res = await PATCH(patchReq({ pinned: true }), { params: Promise.resolve({ id: 'task-1' }) })
    const body = await res.json()

    expect(body.task.pinned).toBe(true)
  })

  it('returns 404 for unknown task id', async () => {
    const task = makeTask({ id: 'task-1' })
    const doc: TasksDoc = { [TEST_USER_ID]: [task] }
    setupUpdateTasks(doc)

    const req = makeRequest('http://localhost:3000/api/tasks/does-not-exist', {
      method: 'PATCH',
      body: { title: 'X' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'does-not-exist' }) })
    expect(res.status).toBe(404)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetUserId.mockResolvedValue(null)

    const res = await PATCH(patchReq({ title: 'X' }), { params: Promise.resolve({ id: 'task-1' }) })
    expect(res.status).toBe(401)
  })
})

// ---------------------------------------------------------------------------
// PATCH /api/tasks/[id] — moveToTop
// ---------------------------------------------------------------------------
describe('PATCH /api/tasks/[id] — moveToTop', () => {
  it('moved task gets order=0', async () => {
    const tasks = [
      makeTask({ id: 'task-1', order: 0, list: 'today' }),
      makeTask({ id: 'task-2', order: 1, list: 'today' }),
      makeTask({ id: 'task-3', order: 2, list: 'today' }),
    ]
    const doc: TasksDoc = { [TEST_USER_ID]: tasks }
    setupUpdateTasks(doc)

    const res = await PATCH(patchReq({ moveToTop: true }), { params: Promise.resolve({ id: 'task-3' }) })
    const body = await res.json()

    expect(body.task.order).toBe(0)
  })

  it('all other tasks in the same list get sequential orders 1,2,...', async () => {
    const tasks = [
      makeTask({ id: 'task-1', order: 10, list: 'today' }),
      makeTask({ id: 'task-2', order: 20, list: 'today' }),
      makeTask({ id: 'task-3', order: 5, list: 'today' }),
    ]
    const doc: TasksDoc = { [TEST_USER_ID]: tasks }
    setupUpdateTasks(doc)

    // Move task-2 to top
    const res = await PATCH(patchReq({ moveToTop: true }), { params: Promise.resolve({ id: 'task-2' }) })
    expect(res.status).toBe(200)

    // After mutation, doc is updated in place by setupUpdateTasks
    const finalTasks = doc[TEST_USER_ID]
    const byId = Object.fromEntries(finalTasks.map(t => [t.id, t]))

    expect(byId['task-2'].order).toBe(0)
    // Others sorted by their original order: task-3 (5) then task-1 (10)
    expect(byId['task-3'].order).toBe(1)
    expect(byId['task-1'].order).toBe(2)
  })

  it('tasks in other lists are untouched', async () => {
    const tasks = [
      makeTask({ id: 'task-1', order: 5, list: 'today' }),
      makeTask({ id: 'task-2', order: 100, list: 'not_today' }),
    ]
    const doc: TasksDoc = { [TEST_USER_ID]: tasks }
    setupUpdateTasks(doc)

    await PATCH(patchReq({ moveToTop: true }), { params: Promise.resolve({ id: 'task-1' }) })

    const finalTasks = doc[TEST_USER_ID]
    const notTodayTask = finalTasks.find(t => t.id === 'task-2')!
    expect(notTodayTask.order).toBe(100) // unchanged
  })

  it('moved task list field is unchanged', async () => {
    const tasks = [
      makeTask({ id: 'task-1', order: 0, list: 'not_today' }),
      makeTask({ id: 'task-2', order: 1, list: 'not_today' }),
    ]
    const doc: TasksDoc = { [TEST_USER_ID]: tasks }
    setupUpdateTasks(doc)

    const res = await PATCH(patchReq({ moveToTop: true }), { params: Promise.resolve({ id: 'task-2' }) })
    const body = await res.json()

    expect(body.task.list).toBe('not_today')
  })

  it('others are ordered by existing order values (sort before reindexing)', async () => {
    // Deliberately scrambled order values
    const tasks = [
      makeTask({ id: 'task-a', order: 50, list: 'today' }),
      makeTask({ id: 'task-b', order: 10, list: 'today' }),
      makeTask({ id: 'task-c', order: 30, list: 'today' }),
      makeTask({ id: 'task-d', order: 20, list: 'today' }),
    ]
    const doc: TasksDoc = { [TEST_USER_ID]: tasks }
    setupUpdateTasks(doc)

    // Move task-a to top
    await PATCH(patchReq({ moveToTop: true }), { params: Promise.resolve({ id: 'task-a' }) })

    const finalTasks = doc[TEST_USER_ID]
    const byId = Object.fromEntries(finalTasks.map(t => [t.id, t]))

    // task-a is at 0; others sorted: task-b(10), task-d(20), task-c(30)
    expect(byId['task-a'].order).toBe(0)
    expect(byId['task-b'].order).toBe(1)
    expect(byId['task-d'].order).toBe(2)
    expect(byId['task-c'].order).toBe(3)
  })

  it('consecutive moveToTop calls compose correctly', async () => {
    const tasks = [
      makeTask({ id: 'task-a', order: 0, list: 'today' }),
      makeTask({ id: 'task-b', order: 1, list: 'today' }),
      makeTask({ id: 'task-c', order: 2, list: 'today' }),
    ]
    const doc: TasksDoc = { [TEST_USER_ID]: tasks }
    setupUpdateTasks(doc)

    // Move task-a to top first
    await PATCH(patchReq({ moveToTop: true }), { params: Promise.resolve({ id: 'task-a' }) })
    // Now move task-b to top
    await PATCH(patchReq({ moveToTop: true }), { params: Promise.resolve({ id: 'task-b' }) })

    const finalTasks = doc[TEST_USER_ID]
    const byId = Object.fromEntries(finalTasks.map(t => [t.id, t]))

    // After two moves: task-b=0, task-a=1, task-c=2
    expect(byId['task-b'].order).toBe(0)
    expect(byId['task-a'].order).toBe(1)
    expect(byId['task-c'].order).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// PATCH /api/tasks/[id] — moveToBottom
// ---------------------------------------------------------------------------
describe('PATCH /api/tasks/[id] — moveToBottom', () => {
  it('moved task gets order=listSize-1', async () => {
    const tasks = [
      makeTask({ id: 'task-1', order: 0, list: 'today' }),
      makeTask({ id: 'task-2', order: 1, list: 'today' }),
      makeTask({ id: 'task-3', order: 2, list: 'today' }),
    ]
    const doc: TasksDoc = { [TEST_USER_ID]: tasks }
    setupUpdateTasks(doc)

    const res = await PATCH(patchReq({ moveToBottom: true }), { params: Promise.resolve({ id: 'task-1' }) })
    const body = await res.json()

    expect(body.task.order).toBe(2) // listSize(3) - 1
  })

  it('all others get sequential orders 0,1,...', async () => {
    const tasks = [
      makeTask({ id: 'task-1', order: 0, list: 'today' }),
      makeTask({ id: 'task-2', order: 1, list: 'today' }),
      makeTask({ id: 'task-3', order: 2, list: 'today' }),
    ]
    const doc: TasksDoc = { [TEST_USER_ID]: tasks }
    setupUpdateTasks(doc)

    await PATCH(patchReq({ moveToBottom: true }), { params: Promise.resolve({ id: 'task-1' }) })

    const finalTasks = doc[TEST_USER_ID]
    const byId = Object.fromEntries(finalTasks.map(t => [t.id, t]))

    expect(byId['task-2'].order).toBe(0)
    expect(byId['task-3'].order).toBe(1)
    expect(byId['task-1'].order).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// DELETE /api/tasks/[id]
// ---------------------------------------------------------------------------
describe('DELETE /api/tasks/[id]', () => {
  it('removes the task from storage and returns 204', async () => {
    const task = makeTask({ id: 'task-1' })
    const doc: TasksDoc = { [TEST_USER_ID]: [task] }
    setupUpdateTasks(doc)

    const req = makeRequest('http://localhost:3000/api/tasks/task-1', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'task-1' }) })

    expect(res.status).toBe(204)
    expect(doc[TEST_USER_ID]).toHaveLength(0)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetUserId.mockResolvedValue(null)

    const req = makeRequest('http://localhost:3000/api/tasks/task-1', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'task-1' }) })

    expect(res.status).toBe(401)
  })
})
