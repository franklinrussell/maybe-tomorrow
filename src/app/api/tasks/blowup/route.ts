import { NextRequest, NextResponse } from 'next/server'
import { updateTasks } from '@/lib/onejsonfile'
import { Task } from '@/types'

// POST /api/tasks/blowup
// Moves all non-done Today tasks to the top of Not Today, increments blownUpCount
export async function POST(req: NextRequest) {
  // TODO: get userId from session
  const userId = req.headers.get('x-user-id') ?? ''

  const doc = await updateTasks((d) => {
    const tasks = d[userId] ?? []
    const now = new Date().toISOString()

    const toMove = tasks.filter((t) => t.list === 'today' && t.state !== 'done')
    const notMoving = tasks.filter((t) => !(t.list === 'today' && t.state !== 'done'))

    // Existing not_today tasks get pushed down by the number of tasks moving in
    const existingNotToday = notMoving
      .filter((t) => t.list === 'not_today')
      .map((t) => ({ ...t, order: t.order + toMove.length }))

    const movedTasks: Task[] = toMove.map((t, i) => ({
      ...t,
      list: 'not_today' as const,
      order: i,
      blownUpCount: t.blownUpCount + 1,
      updatedAt: now,
    }))

    const unchanged = notMoving.filter((t) => t.list !== 'not_today')

    return {
      ...d,
      [userId]: [...unchanged, ...movedTasks, ...existingNotToday],
    }
  })

  return NextResponse.json({ tasks: doc[userId] ?? [] })
}
