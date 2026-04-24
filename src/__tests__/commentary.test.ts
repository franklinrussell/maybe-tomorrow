import { describe, it, expect } from 'vitest'
import { makeTask } from './helpers'
import type { Task } from '@/types'

/**
 * selectHalf is defined inside useCommentary.ts.
 * We test its logic by reproducing it here (the function is not exported).
 * This is the canonical implementation — changes there should be mirrored here.
 *
 * function selectHalf(tasks: Task[]): string[] {
 *   const eligible = tasks.filter((t) => t.state !== 'done' && !t.pinned)
 *   if (eligible.length === 0) return []
 *   const count = Math.ceil(eligible.length / 2)
 *   const shuffled = [...eligible].sort(() => Math.random() - 0.5)
 *   return shuffled.slice(0, count).map((t) => t.id)
 * }
 */
function selectHalf(tasks: Task[]): string[] {
  const eligible = tasks.filter((t) => t.state !== 'done' && !t.pinned)
  if (eligible.length === 0) return []
  const count = Math.ceil(eligible.length / 2)
  const shuffled = [...eligible].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map((t) => t.id)
}

describe('selectHalf() — commentary selection logic', () => {
  it('excludes tasks with state === done', () => {
    const tasks = [
      makeTask({ id: 'done-1', state: 'done' }),
      makeTask({ id: 'active-1', state: 'not_started' }),
    ]

    // Run many times to shake out randomness
    for (let i = 0; i < 20; i++) {
      const ids = selectHalf(tasks)
      expect(ids).not.toContain('done-1')
    }
  })

  it('excludes tasks with pinned === true', () => {
    const tasks = [
      makeTask({ id: 'pinned-1', pinned: true, state: 'not_started' }),
      makeTask({ id: 'active-1', pinned: false, state: 'not_started' }),
    ]

    for (let i = 0; i < 20; i++) {
      const ids = selectHalf(tasks)
      expect(ids).not.toContain('pinned-1')
    }
  })

  it('returns approximately half of eligible tasks (Math.ceil(n/2))', () => {
    const tasks = [
      makeTask({ id: 't1', state: 'not_started' }),
      makeTask({ id: 't2', state: 'not_started' }),
      makeTask({ id: 't3', state: 'not_started' }),
      makeTask({ id: 't4', state: 'not_started' }),
    ]

    // 4 eligible → ceil(4/2) = 2
    const ids = selectHalf(tasks)
    expect(ids).toHaveLength(2)
  })

  it('ceil: odd count rounds up', () => {
    const tasks = [
      makeTask({ id: 't1', state: 'not_started' }),
      makeTask({ id: 't2', state: 'not_started' }),
      makeTask({ id: 't3', state: 'not_started' }),
    ]

    // 3 eligible → ceil(3/2) = 2
    const ids = selectHalf(tasks)
    expect(ids).toHaveLength(2)
  })

  it('returns empty array when all tasks are done', () => {
    const tasks = [
      makeTask({ id: 't1', state: 'done' }),
      makeTask({ id: 't2', state: 'done' }),
    ]

    const ids = selectHalf(tasks)
    expect(ids).toEqual([])
  })

  it('returns empty array when all tasks are pinned', () => {
    const tasks = [
      makeTask({ id: 't1', pinned: true, state: 'not_started' }),
      makeTask({ id: 't2', pinned: true, state: 'not_started' }),
    ]

    const ids = selectHalf(tasks)
    expect(ids).toEqual([])
  })

  it('returns empty array when all tasks are done or pinned', () => {
    const tasks = [
      makeTask({ id: 't1', state: 'done' }),
      makeTask({ id: 't2', pinned: true, state: 'not_started' }),
    ]

    const ids = selectHalf(tasks)
    expect(ids).toEqual([])
  })

  it('returns 1 item when only 1 eligible task exists (ceil(1/2) = 1)', () => {
    const tasks = [
      makeTask({ id: 't1', state: 'not_started' }),
    ]

    const ids = selectHalf(tasks)
    expect(ids).toHaveLength(1)
    expect(ids[0]).toBe('t1')
  })

  it('all returned ids are from eligible (non-done, non-pinned) tasks', () => {
    const tasks = [
      makeTask({ id: 'done-1', state: 'done' }),
      makeTask({ id: 'pinned-1', pinned: true, state: 'not_started' }),
      makeTask({ id: 'active-1', state: 'not_started' }),
      makeTask({ id: 'active-2', state: 'in_progress' }),
      makeTask({ id: 'active-3', state: 'not_started' }),
    ]
    const eligibleIds = new Set(['active-1', 'active-2', 'active-3'])

    for (let i = 0; i < 30; i++) {
      const ids = selectHalf(tasks)
      for (const id of ids) {
        expect(eligibleIds.has(id)).toBe(true)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// Note-clearing behavior — verifying notes: null roundtrips correctly
// ---------------------------------------------------------------------------
describe('notes: null roundtrip behavior', () => {
  it('JSON.stringify preserves null but drops undefined', () => {
    const withNull = { notes: null }
    const withUndefined = { notes: undefined }

    const jsonNull = JSON.stringify(withNull)
    const jsonUndefined = JSON.stringify(withUndefined)

    expect(jsonNull).toBe('{"notes":null}')
    expect(jsonUndefined).toBe('{}') // undefined is dropped — this is the bug risk
  })

  it('spreading body with notes: null keeps notes as null', () => {
    // Simulating what the PATCH route does: { ...t, ...body }
    const existingTask = makeTask({ id: 'task-1', notes: 'Some notes' })
    const body = { notes: null }

    const merged = { ...existingTask, ...body }
    expect(merged.notes).toBeNull()
  })

  it('spreading body with notes: undefined drops the notes field override (uses existing)', () => {
    // If body.notes is undefined (not included in JSON), spread doesn't override
    const existingTask = makeTask({ id: 'task-1', notes: 'Some notes' })
    const body = {} // no notes key

    const merged = { ...existingTask, ...body }
    expect(merged.notes).toBe('Some notes')
  })
})
