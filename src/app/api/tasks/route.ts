import { NextRequest, NextResponse } from 'next/server'
import { readTasks, updateTasks } from '@/lib/onejsonfile'
import { getUserId } from '@/lib/get-user-id'
import { Task, TaskList as TaskListType } from '@/types'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const doc = await readTasks()
    let tasks = doc[userId] ?? []

    // One-time migration: backfill completedAt for done tasks that predate this field.
    // Cap at end-of-yesterday so backfilled tasks always appear in the Done drawer
    // (updatedAt is often today due to order changes, which would make them look "done today").
    if (tasks.some((t) => t.state === 'done' && !t.completedAt)) {
      const endOfYesterday = new Date()
      endOfYesterday.setDate(endOfYesterday.getDate() - 1)
      endOfYesterday.setHours(23, 59, 59, 999)
      const cap = endOfYesterday.toISOString()

      const updated = await updateTasks((d) => ({
        ...d,
        [userId]: (d[userId] ?? []).map((t) => {
          if (!(t.state === 'done' && !t.completedAt)) return t
          // Use updatedAt if it's genuinely in the past, otherwise fall back to cap
          const best = t.updatedAt && t.updatedAt < cap ? t.updatedAt : cap
          return { ...t, completedAt: best }
        }),
      }))
      tasks = updated[userId] ?? []
    }

    return NextResponse.json({ tasks })
  } catch {
    return NextResponse.json({ error: 'Failed to load tasks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const now = new Date().toISOString()

    // Batch import: body is an array of { title, list? }
    if (Array.isArray(body)) {
      const newTasks: Task[] = []
      const updated = await updateTasks((d) => {
        const userTasks = d[userId] ?? []
        // Track min order per list as we build the batch
        const minOrders: Record<string, number> = {}
        for (const item of body) {
          const list: TaskListType = item.list ?? 'not_today'
          if (!(list in minOrders)) {
            minOrders[list] = Math.min(0, ...userTasks.map(t => t.list === list ? t.order : 0)) - 1
          }
          const task: Task = {
            id: uuidv4(), userId,
            title: item.title, notes: item.notes,
            state: 'not_started', list,
            order: minOrders[list],
            blownUpCount: 0, createdAt: now, updatedAt: now,
          }
          minOrders[list] -= 1
          newTasks.push(task)
        }
        return { ...d, [userId]: [...userTasks, ...newTasks] }
      })
      void updated
      return NextResponse.json({ tasks: newTasks }, { status: 201 })
    }

    // Single task
    const doc = await readTasks()
    const userTasks = doc[userId] ?? []
    const list: TaskListType = body.list ?? 'today'
    const newTask: Task = {
      id: uuidv4(),
      userId,
      title: body.title,
      notes: body.notes,
      state: 'not_started',
      list,
      order: Math.min(0, ...userTasks.filter((t) => t.list === list).map(t => t.order)) - 1,
      blownUpCount: 0,
      createdAt: now,
      updatedAt: now,
    }

    await updateTasks((d) => ({
      ...d,
      [userId]: [...(d[userId] ?? []), newTask],
    }))

    return NextResponse.json({ task: newTask }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
