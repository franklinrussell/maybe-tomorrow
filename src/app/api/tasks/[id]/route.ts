import { NextRequest, NextResponse } from 'next/server'
import { updateTasks } from '@/lib/onejsonfile'

// PATCH /api/tasks/[id] — update a task (title, notes, state, list, order)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // TODO: get userId from session
  const userId = req.headers.get('x-user-id') ?? ''
  const { id } = await params
  const body = await req.json()

  const doc = await updateTasks((d) => {
    const tasks = d[userId] ?? []
    const current = tasks.find((t) => t.id === id)
    const movingToNotToday = body.list === 'not_today' && current?.list !== 'not_today'
    const minOrder = movingToNotToday
      ? Math.min(0, ...tasks.filter(t => t.list === 'not_today' && t.id !== id).map(t => t.order))
      : 0
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
          updatedAt: new Date().toISOString(),
        }
      }),
    }
  })

  const updated = (doc[userId] ?? []).find((t) => t.id === id)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ task: updated })
}

// DELETE /api/tasks/[id] — delete a task
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // TODO: get userId from session
  const userId = req.headers.get('x-user-id') ?? ''
  const { id } = await params

  await updateTasks((d) => ({
    ...d,
    [userId]: (d[userId] ?? []).filter((t) => t.id !== id),
  }))

  return new NextResponse(null, { status: 204 })
}
