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
  pinned?: boolean
  createdAt: string
  updatedAt: string
  completedAt?: string
}

// Storage schemas
export type UsersDoc = Record<string, User>
export type TasksDoc = Record<string, Task[]>
export type SessionsDoc = Record<string, { userId: string; expires: string }>

// Auth meta — OAuth accounts + email verification tokens (single onejsonfile)
export interface AuthMetaDoc {
  accounts: Record<string, {
    userId: string
    type: string
    provider: string
    providerAccountId: string
    access_token?: string
    refresh_token?: string
    expires_at?: number
    token_type?: string
    scope?: string
    id_token?: string
  }>
  verificationTokens: Record<string, {
    identifier: string
    token: string
    expires: string
  }>
}
