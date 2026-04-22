'use client'

import { useEffect, useState, useCallback } from 'react'
import { useCommentary } from '@/hooks/useCommentary'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { Task, TaskState, TaskList as TaskListType } from '@/types'
import { DEV_USER, DEV_USER_ID } from '@/lib/dev-user'
import { sortTasks } from '@/components/TaskList'
import TaskList from '@/components/TaskList'
import { v4 as uuidv4 } from 'uuid'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'


async function apiFetch(path: string, options?: RequestInit) {
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': DEV_USER_ID,
      ...(options?.headers ?? {}),
    },
  })
}

function applyDragResult(tasks: Task[], result: DropResult): Task[] {
  const { source, destination, draggableId } = result
  if (!destination) return tasks
  if (source.droppableId === destination.droppableId && source.index === destination.index) return tasks

  const now = new Date().toISOString()
  const srcId = source.droppableId as TaskListType
  const dstId = destination.droppableId as TaskListType

  // Use same sort as TaskList so indices match visual order
  let srcArr = sortTasks(tasks.filter((t) => t.list === srcId))
  let dstArr = srcId === dstId ? srcArr : sortTasks(tasks.filter((t) => t.list === dstId))

  // Remove from source
  const moved = srcArr[source.index]
  srcArr = [...srcArr.slice(0, source.index), ...srcArr.slice(source.index + 1)]
  if (srcId === dstId) dstArr = srcArr

  // Insert into destination
  const movedWithNewList = { ...moved, list: dstId }
  dstArr = [
    ...dstArr.slice(0, destination.index),
    movedWithNewList,
    ...dstArr.slice(destination.index),
  ]
  if (srcId === dstId) srcArr = dstArr

  // Assign new order values
  const srcFinal = srcArr.map((t, i) => ({ ...t, order: i, updatedAt: now }))
  const dstFinal = srcId === dstId ? srcFinal : dstArr.map((t, i) => ({ ...t, order: i, updatedAt: now }))

  // Merge updates back
  const updates = new Map<string, Task>([
    ...srcFinal.map((t): [string, Task] => [t.id, t]),
    ...dstFinal.map((t): [string, Task] => [t.id, t]),
  ])

  return tasks.map((t) => updates.get(t.id) ?? t)
}

export default function AppPage() {
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [blowingUpIds, setBlowingUpIds] = useState<Set<string>>(new Set())
  const [notTodayFlashKey, setNotTodayFlashKey] = useState(0)
  const [commentaryEnabled, setCommentaryEnabled] = useState(true)

  useEffect(() => {
    if (localStorage.getItem('commentary-enabled') === 'false') setCommentaryEnabled(false)
  }, [])

  const handleToggleCommentary = useCallback(() => {
    setCommentaryEnabled((prev) => {
      const next = !prev
      localStorage.setItem('commentary-enabled', String(next))
      return next
    })
  }, [])

  const { comments, addComment } = useCommentary(tasks ?? [], commentaryEnabled)

  useEffect(() => {
    apiFetch('/api/tasks')
      .then((r) => r.json())
      .then((data) => setTasks(Array.isArray(data.tasks) ? data.tasks : []))
      .catch(() => setTasks([]))
  }, [])

  // Tasks completed on a previous day are hidden from active columns (visible only in Done drawer)
  const todayStr = new Date().toDateString()
  function isHiddenFromActive(t: Task) {
    if (t.state !== 'done') return false
    if (!t.completedAt) return true  // no completedAt = pre-migration done task, treat as previous day
    return new Date(t.completedAt).toDateString() !== todayStr
  }

  const loaded = tasks !== null
  const taskList = tasks ?? []
  const todayTasks = taskList.filter((t) => t.list === 'today' && !isHiddenFromActive(t))
  const notTodayTasks = taskList.filter((t) => t.list === 'not_today' && !isHiddenFromActive(t))

  const handleAdd = useCallback(async (list: TaskListType, title: string) => {
    const now = new Date().toISOString()
    const optimistic: Task = {
      id: uuidv4(), userId: DEV_USER_ID, title,
      state: 'not_started', list,
      order: 0,
      blownUpCount: 0, createdAt: now, updatedAt: now,
    }
    setTasks((prev) => {
      const p = prev ?? []
      const minOrder = Math.min(0, ...p.filter(t => t.list === list).map(t => t.order))
      return [...p, { ...optimistic, order: minOrder - 1 }]
    })
    try {
      const res = await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title, list }),
      })
      const data = await res.json()
      setTasks((prev) => (prev ?? []).map((t) => (t.id === optimistic.id ? data.task : t)))
      if (data.task) addComment(data.task)
    } catch { /* keep optimistic */ }
  }, [tasks, addComment])

  const handleStateChange = useCallback(async (id: string, state: TaskState) => {
    const now = new Date().toISOString()
    setTasks((prev) =>
      (prev ?? []).map((t) => {
        if (t.id !== id) return t
        const becomingDone = state === 'done' && t.state !== 'done'
        const leavingDone = t.state === 'done' && state !== 'done'
        return {
          ...t,
          state,
          updatedAt: now,
          completedAt: becomingDone ? now : leavingDone ? undefined : t.completedAt,
        }
      })
    )
    try {
      await apiFetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ state }) })
    } catch { /* optimistic only */ }
  }, [])

  const handleMove = useCallback(async (id: string) => {
    const task = (tasks ?? []).find((t) => t.id === id)
    if (!task) return

    // Pinned Not Today task: copy to Today, leave original in place
    if (task.list === 'not_today' && task.pinned) {
      const now = new Date().toISOString()
      const copy: Task = {
        id: uuidv4(), userId: DEV_USER_ID, title: task.title,
        notes: task.notes, state: 'not_started', list: 'today',
        order: 0, blownUpCount: 0, createdAt: now, updatedAt: now,
      }
      setTasks((prev) => {
        const p = prev ?? []
        const minOrder = Math.min(0, ...p.filter(t => t.list === 'today').map(t => t.order))
        return [...p, { ...copy, order: minOrder - 1 }]
      })
      try {
        const res = await apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify({ title: copy.title, notes: copy.notes, list: 'today' }) })
        const data = await res.json()
        if (data.task) setTasks((prev) => (prev ?? []).map((t) => t.id === copy.id ? data.task : t))
      } catch { /* keep optimistic */ }
      return
    }

    // Today copy of a pinned task: delete instead of moving back to Not Today
    if (task.list === 'today' && !task.pinned) {
      const hasPinnedOriginal = (tasks ?? []).some(
        (t) => t.list === 'not_today' && t.pinned && t.title === task.title
      )
      if (hasPinnedOriginal) {
        setTasks((prev) => (prev ?? []).filter((t) => t.id !== id))
        try {
          await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' })
        } catch { /* optimistic only */ }
        return
      }
    }

    const newList: TaskListType = task.list === 'today' ? 'not_today' : 'today'
    setTasks((prev) => {
      const p = prev ?? []
      const movingToNotToday = newList === 'not_today'
      const minOrder = movingToNotToday
        ? Math.min(0, ...p.filter(t => t.list === 'not_today' && t.id !== id).map(t => t.order))
        : 0
      return p.map((t) => {
        if (t.id !== id) return t
        return {
          ...t,
          list: newList,
          order: movingToNotToday ? minOrder - 1 : t.order,
          updatedAt: new Date().toISOString(),
        }
      })
    })
    try {
      const res = await apiFetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ list: newList }) })
      const data = await res.json()
      if (data.task) setTasks((prev) => (prev ?? []).map((t) => t.id === id ? data.task : t))
    } catch { /* optimistic only */ }
  }, [tasks])

  const handleDelete = useCallback(async (id: string) => {
    setTasks((prev) => (prev ?? []).filter((t) => t.id !== id))
    try {
      await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' })
    } catch { /* optimistic only */ }
  }, [])

  const handleUndo = useCallback(async (id: string) => {
    const now = new Date().toISOString()
    setTasks((prev) =>
      (prev ?? []).map((t) => t.id === id ? { ...t, state: 'not_started', completedAt: undefined, updatedAt: now } : t)
    )
    try {
      await apiFetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ state: 'not_started', completedAt: null }) })
    } catch { /* optimistic only */ }
  }, [])

  const handleMoveToTop = useCallback(async (id: string) => {
    setTasks((prev) => {
      const p = prev ?? []
      const task = p.find((t) => t.id === id)
      if (!task) return p
      const listTasks = sortTasks(p.filter((t) => t.list === task.list))
      const others = listTasks.filter((t) => t.id !== id)
      const now = new Date().toISOString()
      const reordered = [
        { ...task, order: 0, updatedAt: now },
        ...others.map((t, i) => ({ ...t, order: i + 1, updatedAt: now })),
      ]
      const byId = new Map(reordered.map((t) => [t.id, t]))
      return p.map((t) => byId.get(t.id) ?? t)
    })
    try {
      await apiFetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ moveToTop: true }) })
    } catch { /* optimistic only */ }
  }, [])

  const handleMoveToBottom = useCallback(async (id: string) => {
    setTasks((prev) => {
      const p = prev ?? []
      const task = p.find((t) => t.id === id)
      if (!task) return p
      const listTasks = sortTasks(p.filter((t) => t.list === task.list))
      const others = listTasks.filter((t) => t.id !== id)
      const now = new Date().toISOString()
      const reordered = [
        ...others.map((t, i) => ({ ...t, order: i, updatedAt: now })),
        { ...task, order: others.length, updatedAt: now },
      ]
      const byId = new Map(reordered.map((t) => [t.id, t]))
      return p.map((t) => byId.get(t.id) ?? t)
    })
    try {
      await apiFetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ moveToBottom: true }) })
    } catch { /* optimistic only */ }
  }, [])

  const handleEdit = useCallback(async (id: string, title: string, notes: string) => {
    setTasks((prev) => (prev ?? []).map((t) => t.id === id ? { ...t, title, notes: notes || undefined, updatedAt: new Date().toISOString() } : t))
    try {
      await apiFetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ title, notes: notes || null }) })
    } catch { /* optimistic only */ }
  }, [])

  const handleImport = useCallback(async (lines: string[], destination: TaskListType) => {
    const now = new Date().toISOString()
    const optimistic: Task[] = lines.map((title) => ({
      id: uuidv4(), userId: DEV_USER_ID, title,
      state: 'not_started', list: destination,
      order: 0, blownUpCount: 0, createdAt: now, updatedAt: now,
    }))
    setTasks((prev) => {
      const p = prev ?? []
      const minOrder = Math.min(0, ...p.filter(t => t.list === destination).map(t => t.order))
      const withOrders = optimistic.map((t, i) => ({ ...t, order: minOrder - optimistic.length + i }))
      return [...p, ...withOrders]
    })
    try {
      const res = await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(lines.map((title) => ({ title, list: destination }))),
      })
      const data = await res.json()
      if (Array.isArray(data.tasks)) {
        const optimisticIds = new Set(optimistic.map((t) => t.id))
        setTasks((prev) => {
          const p = (prev ?? []).filter((t) => !optimisticIds.has(t.id))
          return [...p, ...data.tasks]
        })
      }
    } catch { /* keep optimistic */ }
  }, [])

  const handlePin = useCallback(async (id: string, pinned: boolean) => {
    setTasks((prev) => (prev ?? []).map((t) => t.id === id ? { ...t, pinned, updatedAt: new Date().toISOString() } : t))
    try {
      await apiFetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ pinned }) })
    } catch { /* optimistic only */ }
  }, [])

  const handleBlowUp = useCallback(async () => {
    const toBlowUp = sortTasks(
      (tasks ?? []).filter((t) => t.list === 'today' && t.state !== 'done')
    )
    if (toBlowUp.length === 0) return

    // 1. Mark cards as blowing up — their animations start
    const ids = new Set(toBlowUp.map((t) => t.id))
    setBlowingUpIds(ids)

    // 3. Wait for all animations: (n-1)*80ms stagger + 280ms shake + 340ms fly + 50ms buffer
    const totalMs = (toBlowUp.length - 1) * 80 + 280 + 340 + 50
    await new Promise((r) => setTimeout(r, totalMs))

    // 4. Apply state update (cards have already visually departed)
    setBlowingUpIds(new Set())
    const now = new Date().toISOString()
    setTasks((prev) => {
      const p = prev ?? []
      const toMove = p.filter((t) => ids.has(t.id))
      const rest = p.filter((t) => !ids.has(t.id))
      const existingNotToday = rest
        .filter((t) => t.list === 'not_today')
        .map((t) => ({ ...t, order: t.order + toMove.length }))
      const moved = toMove.map((t, i) => ({
        ...t, list: 'not_today' as const, order: i,
        blownUpCount: t.blownUpCount + 1, updatedAt: now,
      }))
      return [...rest.filter((t) => t.list !== 'not_today'), ...moved, ...existingNotToday]
    })

    // 5. Flash the Not Today column as tasks land
    setNotTodayFlashKey((k) => k + 1)

    // 6. Persist to API
    try {
      const res = await apiFetch('/api/tasks/blowup', { method: 'POST' })
      const data = await res.json()
      if (Array.isArray(data.tasks)) setTasks(data.tasks)
    } catch { /* keep optimistic */ }
  }, [tasks])

  const handleDragEnd = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    setTasks((prev) => applyDragResult(prev ?? [], result))

    // Persist list change for cross-column drags
    if (source.droppableId !== destination.droppableId) {
      apiFetch(`/api/tasks/${draggableId}`, {
        method: 'PATCH',
        body: JSON.stringify({ list: destination.droppableId }),
      }).catch(() => {})
    }
  }, [])

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-950 max-md:h-auto">
      <Header onImport={handleImport} commentaryEnabled={commentaryEnabled} onToggleCommentary={handleToggleCommentary} />

      {/* Two-column board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex flex-1 overflow-hidden max-md:flex-col max-md:flex-none max-md:overflow-visible">
          {/* TODAY column */}
          <div
            className="flex-1 flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-800 max-md:flex-none max-md:border-r-0 max-md:border-b"
          >
            <TaskList
              list="today"
              tasks={todayTasks}
              allTasks={taskList}
              loading={!loaded}
              onAdd={(title) => handleAdd('today', title)}
              onStateChange={handleStateChange}
              onMove={handleMove}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onMoveToTop={handleMoveToTop}
              onUndo={handleUndo}
              onBlowUp={handleBlowUp}
              blowingUpIds={blowingUpIds}
              comments={comments}
            />
          </div>
          {/* NOT TODAY column */}
          <div className="flex-1 flex flex-col overflow-hidden max-md:flex-none">
            <TaskList
              list="not_today"
              tasks={notTodayTasks}
              loading={!loaded}
              onAdd={(title) => handleAdd('not_today', title)}
              onStateChange={handleStateChange}
              onMove={handleMove}
              onDelete={handleDelete}
              onPin={handlePin}
              onEdit={handleEdit}
              onMoveToTop={handleMoveToTop}
              onMoveToBottom={handleMoveToBottom}
              flashKey={notTodayFlashKey}
              comments={comments}
            />
          </div>
        </div>
      </DragDropContext>

      <Footer />
    </div>
  )
}
