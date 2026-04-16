import { NextResponse } from 'next/server'
import { updateTasks } from '@/lib/onejsonfile'
import { getUserId } from '@/lib/get-user-id'
import { Task } from '@/types'

export async function POST() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const doc = await updateTasks((d) => {
      const tasks = d[userId] ?? []
      const now = new Date().toISOString()

      const toMove = tasks.filter((t) => t.list === 'today' && t.state !== 'done')
      const notMoving = tasks.filter((t) => !(t.list === 'today' && t.state !== 'done'))

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
  } catch {
    return NextResponse.json({ error: 'Failed to blow up tasks' }, { status: 500 })
  }
}
