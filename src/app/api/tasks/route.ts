import { NextRequest, NextResponse } from 'next/server'
import { readTasks, updateTasks } from '@/lib/onejsonfile'
import { Task } from '@/types'
import { v4 as uuidv4 } from 'uuid'

// GET /api/tasks — fetch all tasks for the authenticated user
export async function GET(req: NextRequest) {
  // TODO: get userId from session
  const userId = req.headers.get('x-user-id') ?? ''
  const doc = await readTasks()
  const tasks = doc[userId] ?? []
  return NextResponse.json({ tasks })
}

// POST /api/tasks — create a new task
export async function POST(req: NextRequest) {
  // TODO: get userId from session
  const userId = req.headers.get('x-user-id') ?? ''
  const body = await req.json()

  const doc = await readTasks()
  const userTasks = doc[userId] ?? []

  const now = new Date().toISOString()
  const newTask: Task = {
    id: uuidv4(),
    userId,
    title: body.title,
    notes: body.notes,
    state: 'not_started',
    list: body.list ?? 'today',
    order: userTasks.filter((t) => t.list === (body.list ?? 'today')).length,
    blownUpCount: 0,
    createdAt: now,
    updatedAt: now,
  }

  await updateTasks((d) => ({
    ...d,
    [userId]: [...(d[userId] ?? []), newTask],
  }))

  return NextResponse.json({ task: newTask }, { status: 201 })
}
