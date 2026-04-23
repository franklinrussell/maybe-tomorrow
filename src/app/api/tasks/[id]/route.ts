import { NextRequest, NextResponse } from 'next/server'
import { updateTasks } from '@/lib/onejsonfile'
import { getUserId } from '@/lib/get-user-id'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const body = await req.json()
    const now = new Date().toISOString()

    const doc = await updateTasks((d) => {
      const tasks = d[userId] ?? []
      const current = tasks.find((t) => t.id === id)
      if (!current) return d

      // Move to top: reindex all tasks in the same list
      if (body.moveToTop === true) {
        const listTasks = tasks.filter((t) => t.list === current.list)
        const others = listTasks.filter((t) => t.id !== id).sort((a, b) => a.order - b.order)
        const reordered = [
          { ...current, order: 0, updatedAt: now },
          ...others.map((t, i) => ({ ...t, order: i + 1, updatedAt: now })),
        ]
        const byId = new Map(reordered.map((t) => [t.id, t]))
        return { ...d, [userId]: tasks.map((t) => byId.get(t.id) ?? t) }
      }

      // Move to bottom: reindex all tasks in the same list
      if (body.moveToBottom === true) {
        const listTasks = tasks.filter((t) => t.list === current.list)
        const others = listTasks.filter((t) => t.id !== id).sort((a, b) => a.order - b.order)
        const reordered = [
          ...others.map((t, i) => ({ ...t, order: i, updatedAt: now })),
          { ...current, order: others.length, updatedAt: now },
        ]
        const byId = new Map(reordered.map((t) => [t.id, t]))
        return { ...d, [userId]: tasks.map((t) => byId.get(t.id) ?? t) }
      }

      // Standard update
      const movingToNotToday = body.list === 'not_today' && current.list !== 'not_today'
      const minOrder = movingToNotToday
        ? Math.min(0, ...tasks.filter(t => t.list === 'not_today' && t.id !== id).map(t => t.order))
        : 0
      const becomingDone = body.state === 'done' && current.state !== 'done'
      const leavingDone = current.state === 'done' && body.state && body.state !== 'done'
      return {
        ...d,
        [userId]: tasks.map((t) => {
          if (t.id !== id) return t
          return {
            ...t,
            ...body,
            id,
            userId,
            order: movingToNotToday ? minOrder - 1 : (body.order ?? t.order),
            blownUpCount: movingToNotToday ? t.blownUpCount + 1 : (body.blownUpCount ?? t.blownUpCount),
            completedAt: becomingDone ? now : leavingDone ? undefined : t.completedAt,
            updatedAt: now,
          }
        }),
      }
    })

    const updated = (doc[userId] ?? []).find((t) => t.id === id)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ task: updated })
  } catch {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params

    await updateTasks((d) => ({
      ...d,
      [userId]: (d[userId] ?? []).filter((t) => t.id !== id),
    }))

    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
