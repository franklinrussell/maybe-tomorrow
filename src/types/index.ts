export interface User {
  id: string
  email: string
  name: string
  image?: string
  provider: 'google' | 'github' | 'email'
  createdAt: string
}

export type TaskState = 'not_started' | 'in_progress' | 'done'
export type TaskList = 'today' | 'not_today'

export interface Task {
  id: string
  userId: string
  title: string
  notes?: string
  state: TaskState
  list: TaskList
  order: number
  blownUpCount: number
  createdAt: string
  updatedAt: string
  completedAt?: string
}

// Storage schemas
export type UsersDoc = Record<string, User>
export type TasksDoc = Record<string, Task[]>
export type SessionsDoc = Record<string, { userId: string; expires: string }>
