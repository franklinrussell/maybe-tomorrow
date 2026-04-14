import type { UsersDoc, TasksDoc, SessionsDoc, AuthMetaDoc } from '@/types'

const BASE_URL = 'https://onejsonfile.com/api/v1/files'

// Generic read/write primitives
// GET /api/v1/files/:token  → returns the raw JSON object
// PUT /api/v1/files/:token  → body is the raw JSON object; returns { success, fileSize }

async function read<T>(token: string): Promise<T> {
  const res = await fetch(`${BASE_URL}/${token}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`onejsonfile read failed: ${res.status}`)
  return res.json() as Promise<T>
}

async function write<T>(token: string, data: T): Promise<void> {
  const res = await fetch(`${BASE_URL}/${token}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`onejsonfile write failed: ${res.status}`)
}

// Mutex-style update: read → mutate → write
async function update<T>(token: string, mutate: (current: T) => T | Promise<T>): Promise<T> {
  const current = await read<T>(token)
  const next = await mutate(current)
  await write(token, next)
  return next
}

// Typed helpers

function usersToken() {
  const t = process.env.ONEJSONFILE_USERS_TOKEN
  if (!t) throw new Error('ONEJSONFILE_USERS_TOKEN not set')
  return t
}

function tasksToken() {
  const t = process.env.ONEJSONFILE_TASKS_TOKEN
  if (!t) throw new Error('ONEJSONFILE_TASKS_TOKEN not set')
  return t
}

function sessionsToken() {
  const t = process.env.ONEJSONFILE_SESSIONS_TOKEN
  if (!t) throw new Error('ONEJSONFILE_SESSIONS_TOKEN not set')
  return t
}

function authMetaToken() {
  const t = process.env.ONEJSONFILE_AUTH_TOKEN
  if (!t) throw new Error('ONEJSONFILE_AUTH_TOKEN not set')
  return t
}

export async function readUsers(): Promise<UsersDoc> {
  return read<UsersDoc>(usersToken())
}

export async function writeUsers(data: UsersDoc): Promise<void> {
  return write(usersToken(), data)
}

export async function updateUsers(mutate: (d: UsersDoc) => UsersDoc | Promise<UsersDoc>): Promise<UsersDoc> {
  return update(usersToken(), mutate)
}

export async function readTasks(): Promise<TasksDoc> {
  return read<TasksDoc>(tasksToken())
}

export async function writeTasks(data: TasksDoc): Promise<void> {
  return write(tasksToken(), data)
}

export async function updateTasks(mutate: (d: TasksDoc) => TasksDoc | Promise<TasksDoc>): Promise<TasksDoc> {
  return update(tasksToken(), mutate)
}

export async function readSessions(): Promise<SessionsDoc> {
  return read<SessionsDoc>(sessionsToken())
}

export async function writeSessions(data: SessionsDoc): Promise<void> {
  return write(sessionsToken(), data)
}

export async function updateSessions(mutate: (d: SessionsDoc) => SessionsDoc | Promise<SessionsDoc>): Promise<SessionsDoc> {
  return update(sessionsToken(), mutate)
}

export async function readAuthMeta(): Promise<AuthMetaDoc> {
  const raw = await read<Partial<AuthMetaDoc>>(authMetaToken())
  return {
    accounts: raw.accounts ?? {},
    verificationTokens: raw.verificationTokens ?? {},
  }
}

export async function updateAuthMeta(mutate: (d: AuthMetaDoc) => AuthMetaDoc | Promise<AuthMetaDoc>): Promise<AuthMetaDoc> {
  return update<AuthMetaDoc>(authMetaToken(), async (raw) => {
    const doc: AuthMetaDoc = {
      accounts: (raw as Partial<AuthMetaDoc>).accounts ?? {},
      verificationTokens: (raw as Partial<AuthMetaDoc>).verificationTokens ?? {},
    }
    return mutate(doc)
  })
}
