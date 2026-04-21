'use client'

import { useEffect, useRef, useState } from 'react'
import { Task } from '@/types'

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
  const eligible = tasks.filter((t) => t.state !== 'done')
  if (eligible.length === 0) return []
  const count = Math.ceil(eligible.length / 2)
  const shuffled = [...eligible].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map((t) => t.id)
}

export function useCommentary(tasks: Task[], enabled: boolean): Record<string, string> {
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

    Promise.all(
      selected.map(async (task) => {
        const daysSinceCreated = Math.floor(
          (now - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        )
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

  return enabled ? comments : {}
}
