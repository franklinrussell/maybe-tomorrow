'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Task } from '@/types'
import { sortTasks } from '@/components/TaskList'

type CommentaryCache = {
  selectedIds: string[]
  comments: Record<string, string>
}

function todayKey(): string {
  return `commentary-${new Date().toDateString()}`
}

function purgeOldKeys(): void {
  const current = todayKey()
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i)
    if (key?.startsWith('commentary-') && key !== current) {
      localStorage.removeItem(key)
    }
  }
}

function selectHalf(tasks: Task[]): string[] {
  const eligible = tasks.filter((t) => t.state !== 'done' && !t.pinned)
  if (eligible.length === 0) return []
  const count = Math.ceil(eligible.length / 2)
  const shuffled = [...eligible].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map((t) => t.id)
}

export function useCommentary(tasks: Task[], enabled: boolean): {
  comments: Record<string, string>
  addComment: (task: Task) => Promise<void>
} {
  const [comments, setComments] = useState<Record<string, string>>({})
  const generatingRef = useRef(false)
  const tasksLoaded = tasks.length > 0

  useEffect(() => {
    if (!enabled || !tasksLoaded) return

    const key = todayKey()
    purgeOldKeys()

    // Cache hit — restore without API call
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as CommentaryCache
        setComments(parsed.comments)
      } catch {
        localStorage.removeItem(key)
      }
      return
    }

    if (generatingRef.current) return
    generatingRef.current = true

    const selectedIds = [
      ...selectHalf(tasks.filter((t) => t.list === 'today')),
      ...selectHalf(tasks.filter((t) => t.list === 'not_today')),
    ]

    if (selectedIds.length === 0) {
      generatingRef.current = false
      return
    }

    const selected = tasks.filter((t) => selectedIds.includes(t.id))
    const now = Date.now()

    // Build position maps keyed by task id: 1-based index in sorted non-done display order
    const positionMap = new Map<string, { position: number; listSize: number }>()
    for (const listKey of ['today', 'not_today'] as const) {
      const listTasks = sortTasks(tasks.filter((t) => t.list === listKey && t.state !== 'done'))
      listTasks.forEach((t, i) => positionMap.set(t.id, { position: i + 1, listSize: listTasks.length }))
    }

    Promise.all(
      selected.map(async (task) => {
        const daysSinceCreated = Math.floor(
          (now - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        )
        const { position = 1, listSize = 1 } = positionMap.get(task.id) ?? {}
        try {
          const res = await fetch('/api/ai/commentary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              taskId: task.id,
              title: task.title,
              notes: task.notes,
              list: task.list,
              daysSinceCreated,
              blownUpCount: task.blownUpCount,
              position,
              listSize,
            }),
          })
          const data = await res.json()
          return { taskId: task.id, comment: (data.comment as string) ?? '' }
        } catch {
          return { taskId: task.id, comment: '' }
        }
      })
    ).then((results) => {
      const newComments: Record<string, string> = {}
      for (const { taskId, comment } of results) {
        if (comment) newComments[taskId] = comment
      }
      try {
        localStorage.setItem(key, JSON.stringify({ selectedIds, comments: newComments } satisfies CommentaryCache))
      } catch { /* storage full — skip caching */ }
      setComments(newComments)
      generatingRef.current = false
    })
  }, [enabled, tasksLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  const addComment = useCallback(async (task: Task) => {
    if (!enabled || task.pinned || task.state === 'done') return
    if (Math.random() >= 0.5) return

    try {
      const res = await fetch('/api/ai/commentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          title: task.title,
          notes: task.notes,
          list: task.list,
          daysSinceCreated: 0,
          blownUpCount: 0,
          position: 1,
          listSize: tasks.filter((t) => t.list === task.list && t.state !== 'done').length + 1,
        }),
      })
      const data = await res.json()
      const comment = (data.comment as string) ?? ''
      if (!comment) return

      setComments((prev) => {
        const next = { ...prev, [task.id]: comment }
        try {
          const raw = localStorage.getItem(todayKey())
          if (raw) {
            const parsed = JSON.parse(raw) as CommentaryCache
            localStorage.setItem(todayKey(), JSON.stringify({
              ...parsed,
              comments: { ...parsed.comments, [task.id]: comment },
            }))
          }
        } catch { /* ignore */ }
        return next
      })
    } catch { /* fail silently */ }
  }, [enabled])

  return { comments: enabled ? comments : {}, addComment }
}
