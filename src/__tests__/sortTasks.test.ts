import { describe, it, expect } from 'vitest'
import { makeTask } from './helpers'

// sortTasks is exported from a 'use client' component.
// We need to stub out the React environment and dnd/motion imports.
vi.mock('@hello-pangea/dnd', () => ({
  Droppable: () => null,
  Draggable: () => null,
}))
vi.mock('framer-motion', () => ({
  motion: { div: 'div' },
  useAnimation: () => ({ start: vi.fn() }),
}))
vi.mock('@/components/TaskCard', () => ({ default: () => null }))
vi.mock('@/components/AddTaskInput', () => ({ default: () => null }))
vi.mock('@/components/BlowUpButton', () => ({ default: () => null }))
vi.mock('@/components/DoneDrawer', () => ({ default: () => null }))

import { sortTasks } from '@/components/TaskList'

describe('sortTasks()', () => {
  it('done tasks always sort after non-done tasks', () => {
    const tasks = [
      makeTask({ id: 'a', state: 'done', order: 0 }),
      makeTask({ id: 'b', state: 'not_started', order: 1 }),
    ]

    const sorted = sortTasks(tasks)
    expect(sorted[0].id).toBe('b')
    expect(sorted[1].id).toBe('a')
  })

  it('non-done tasks sorted ascending by order field (lower = first)', () => {
    const tasks = [
      makeTask({ id: 'c', state: 'not_started', order: 10 }),
      makeTask({ id: 'a', state: 'not_started', order: -5 }),
      makeTask({ id: 'b', state: 'in_progress', order: 3 }),
    ]

    const sorted = sortTasks(tasks)
    expect(sorted.map(t => t.id)).toEqual(['a', 'b', 'c'])
  })

  it('done tasks are not sorted by order relative to each other — just pushed to end', () => {
    const tasks = [
      makeTask({ id: 'done-a', state: 'done', order: 100 }),
      makeTask({ id: 'done-b', state: 'done', order: 0 }),
    ]

    const sorted = sortTasks(tasks)
    // Both done — they stay together at the end; order among done tasks follows order field
    expect(sorted[0].state).toBe('done')
    expect(sorted[1].state).toBe('done')
    // done-b (order 0) should come before done-a (order 100)
    expect(sorted[0].id).toBe('done-b')
    expect(sorted[1].id).toBe('done-a')
  })

  it('mixed: all non-done come first sorted by order, then all done', () => {
    const tasks = [
      makeTask({ id: 'done-1', state: 'done', order: 0 }),
      makeTask({ id: 'active-2', state: 'in_progress', order: 5 }),
      makeTask({ id: 'active-1', state: 'not_started', order: 2 }),
      makeTask({ id: 'done-2', state: 'done', order: 10 }),
    ]

    const sorted = sortTasks(tasks)

    expect(sorted[0].id).toBe('active-1')
    expect(sorted[1].id).toBe('active-2')
    // Done tasks follow
    expect(sorted[2].state).toBe('done')
    expect(sorted[3].state).toBe('done')
  })

  it('returns same reference count as input (does not filter)', () => {
    const tasks = [
      makeTask({ id: 'a', state: 'done' }),
      makeTask({ id: 'b', state: 'not_started' }),
    ]
    expect(sortTasks(tasks)).toHaveLength(2)
  })

  it('does not mutate the input array', () => {
    const tasks = [
      makeTask({ id: 'a', state: 'done', order: 0 }),
      makeTask({ id: 'b', state: 'not_started', order: 1 }),
    ]
    const original = [...tasks]
    sortTasks(tasks)
    expect(tasks[0].id).toBe(original[0].id)
    expect(tasks[1].id).toBe(original[1].id)
  })
})
