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

// Mock auth (used transitively by get-user-id in real code; but since we mock
// get-user-id directly, this is just insurance).
vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))

import { readTasks, updateTasks } from '@/lib/onejsonfile'
import { getUserId } from '@/lib/get-user-id'
import { GET, POST } from '@/app/api/tasks/route'

const mockReadTasks = readTasks as ReturnType<typeof vi.fn>
const mockUpdateTasks = updateTasks as ReturnType<typeof vi.fn>
const mockGetUserId = getUserId as ReturnType<typeof vi.fn>

/**
 * Helper: configure updateTasks to simulate read→mutate→write.
 * The mock calls the mutate function with `currentDoc` and returns the result.
 */
function setupUpdateTasks(currentDoc: TasksDoc) {
  mockUpdateTasks.mockImplementation(async (mutate: (d: TasksDoc) => TasksDoc) => {
    const result = await mutate(currentDoc)
    // Mutate currentDoc in-place so subsequent reads see the change
    Object.assign(currentDoc, result)
    return result
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUserId.mockResolvedValue(TEST_USER_ID)
})

// ---------------------------------------------------------------------------
// GET /api/tasks
// ---------------------------------------------------------------------------
describe('GET /api/tasks', () => {
  it('returns tasks for the authenticated user', async () => {
    const task = makeTask({ id: 'task-1' })
    mockReadTasks.mockResolvedValue({ [TEST_USER_ID]: [task] })

    const req = makeRequest('http://localhost:3000/api/tasks')
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.tasks).toHaveLength(1)
    expect(body.tasks[0].id).toBe('task-1')
  })

  it('returns 401 when getUserId returns null', async () => {
    mockGetUserId.mockResolvedValue(null)

    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns empty array for a new user with no tasks', async () => {
    mockReadTasks.mockResolvedValue({})

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.tasks).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// POST /api/tasks — single task
// ---------------------------------------------------------------------------
describe('POST /api/tasks — single', () => {
  it('creates a task with correct default fields', async () => {
    const doc: TasksDoc = { [TEST_USER_ID]: [] }
    mockReadTasks.mockResolvedValue(doc)
    setupUpdateTasks(doc)

    const req = makeRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: { title: 'New task', list: 'today' },
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.task.title).toBe('New task')
    expect(body.task.list).toBe('today')
    expect(body.task.state).toBe('not_started')
    expect(body.task.blownUpCount).toBe(0)
    expect(body.task.userId).toBe(TEST_USER_ID)
    expect(typeof body.task.id).toBe('string')
    expect(typeof body.task.createdAt).toBe('string')
  })

  it('defaults list to today when not specified', async () => {
    const doc: TasksDoc = { [TEST_USER_ID]: [] }
    mockReadTasks.mockResolvedValue(doc)
    setupUpdateTasks(doc)

    const req = makeRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: { title: 'No list specified' },
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.task.list).toBe('today')
  })

  it('assigns order below existing tasks (prepend: minOrder - 1)', async () => {
    const existing = makeTask({ id: 'existing', order: -3, list: 'today' })
    const doc: TasksDoc = { [TEST_USER_ID]: [existing] }
    mockReadTasks.mockResolvedValue(doc)
    setupUpdateTasks(doc)

    const req = makeRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: { title: 'New task', list: 'today' },
    })

    const res = await POST(req)
    const body = await res.json()

    // New task order should be less than existing min (-3), so -4
    expect(body.task.order).toBe(-4)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetUserId.mockResolvedValue(null)

    const req = makeRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: { title: 'Sneaky task' },
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})

// ---------------------------------------------------------------------------
// POST /api/tasks — batch array
// ---------------------------------------------------------------------------
describe('POST /api/tasks — batch array', () => {
  it('creates multiple tasks in one call', async () => {
    const doc: TasksDoc = { [TEST_USER_ID]: [] }
    setupUpdateTasks(doc)

    const req = makeRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: [
        { title: 'Task A', list: 'today' },
        { title: 'Task B', list: 'today' },
        { title: 'Task C', list: 'not_today' },
      ],
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.tasks).toHaveLength(3)
    expect(body.tasks.map((t: { title: string }) => t.title)).toEqual(['Task A', 'Task B', 'Task C'])
  })

  it('assigns default fields to batch tasks', async () => {
    const doc: TasksDoc = { [TEST_USER_ID]: [] }
    setupUpdateTasks(doc)

    const req = makeRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: [{ title: 'Batch task' }],
    })

    const res = await POST(req)
    const body = await res.json()

    expect(body.tasks[0].state).toBe('not_started')
    expect(body.tasks[0].blownUpCount).toBe(0)
    expect(body.tasks[0].userId).toBe(TEST_USER_ID)
    // Default list for batch is 'not_today' (per the code: item.list ?? 'not_today')
    expect(body.tasks[0].list).toBe('not_today')
  })

  it('assigns sequential prepend orders for same-list batch', async () => {
    const doc: TasksDoc = { [TEST_USER_ID]: [] }
    setupUpdateTasks(doc)

    const req = makeRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: [
        { title: 'First', list: 'today' },
        { title: 'Second', list: 'today' },
        { title: 'Third', list: 'today' },
      ],
    })

    const res = await POST(req)
    const body = await res.json()

    const orders = body.tasks.map((t: { order: number }) => t.order)
    // Each subsequent task should have a lower order (more negative) than the previous
    expect(orders[0]).toBeGreaterThan(orders[1])
    expect(orders[1]).toBeGreaterThan(orders[2])
  })
})
