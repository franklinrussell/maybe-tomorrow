'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { Task } from '@/types'

function flameBadge(count: number): string {
  if (count <= 0) return ''
  if (count > 5) return '🔥🔥🔥'
  if (count > 3) return '🔥🔥'
  return '🔥'
}

function getDateLabel(isoStr: string): string {
  const date = new Date(isoStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function groupByDate(tasks: Task[]): Array<{ label: string; dateStr: string; tasks: Task[] }> {
  const sorted = [...tasks].sort(
    (a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
  )
  const groups: Array<{ label: string; dateStr: string; tasks: Task[] }> = []
  for (const task of sorted) {
    const dateStr = new Date(task.completedAt!).toDateString()
    const existing = groups.find((g) => g.dateStr === dateStr)
    if (existing) {
      existing.tasks.push(task)
    } else {
      groups.push({ label: getDateLabel(task.completedAt!), dateStr, tasks: [task] })
    }
  }
  return groups
}

interface Props {
  isOpen: boolean
  tasks: Task[]
  onClose: () => void
}

export default function DoneDrawer({ isOpen, tasks, onClose }: Props) {
  const groups = groupByDate(tasks.filter((t) => t.state === 'done' && t.completedAt))

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 rounded-t-2xl shadow-2xl flex flex-col"
            style={{ height: '60vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0 border-b border-gray-100 dark:border-gray-800">
              <h2
                className="text-gray-900 dark:text-gray-100 leading-none"
                style={{
                  fontFamily: 'var(--font-bebas, sans-serif)',
                  fontSize: '1.8rem',
                  letterSpacing: '0.04em',
                }}
              >
                Done ✓
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {groups.length === 0 ? (
                <p
                  className="text-center text-sm text-gray-400 py-12"
                  style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
                >
                  Nothing completed yet. Get to work. 😄
                </p>
              ) : (
                <div className="flex flex-col gap-5">
                  {groups.map(({ label, tasks: groupTasks }) => (
                    <div key={label}>
                      {/* Date header */}
                      <div className="mb-2 pl-3" style={{ borderLeft: '3px solid #FFE500' }}>
                        <span
                          className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                          style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
                        >
                          {label}
                        </span>
                      </div>
                      {/* Task rows */}
                      <div className="flex flex-col gap-1.5">
                        {groupTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900"
                          >
                            <Check size={14} strokeWidth={2.5} className="text-green-500 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm text-gray-400 dark:text-gray-500 line-through leading-snug"
                                style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
                              >
                                {task.title}
                              </p>
                              {task.notes && (
                                <p
                                  className="text-xs text-gray-400 dark:text-gray-600 mt-0.5 leading-snug"
                                  style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
                                >
                                  {task.notes}
                                </p>
                              )}
                            </div>
                            {task.blownUpCount > 0 && (
                              <span className="shrink-0 text-xs leading-none mt-0.5">
                                {flameBadge(task.blownUpCount)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
