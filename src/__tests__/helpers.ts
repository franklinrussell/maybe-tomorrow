import type { Task } from '@/types'

export const TEST_USER_ID = 'test-user-123'

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    userId: TEST_USER_ID,
    title: 'Test task',
    state: 'not_started',
    list: 'today',
    order: 0,
    blownUpCount: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function makeRequest(url: string, options: {
  method?: string
  body?: unknown
  headers?: Record<string, string>
} = {}) {
  const { NextRequest } = require('next/server')
  return new NextRequest(url, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    body: options.body != null ? JSON.stringify(options.body) : undefined,
  })
}
