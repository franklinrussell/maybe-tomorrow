import { NextRequest, NextResponse } from 'next/server'
import { readTasks, updateTasks } from '@/lib/onejsonfile'
import { getUserId } from '@/lib/get-user-id'
import { Task } from '@/types'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const doc = await readTasks()
  const tasks = doc[userId] ?? []
  return NextResponse.json({ tasks })
}

export async function POST(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    order: Math.min(0, ...userTasks.filter((t) => t.list === (body.list ?? 'today')).map(t => t.order)) - 1,
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
