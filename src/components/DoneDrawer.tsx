'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Undo2 } from 'lucide-react'
import { Task } from '@/types'

function effectiveDate(task: Task): number {
  return new Date(task.completedAt ?? task.updatedAt).getTime()
}

interface Props {
  isOpen: boolean
  tasks: Task[]
  onClose: () => void
  onUndo: (id: string) => void
}

export default function DoneDrawer({ isOpen, tasks, onClose, onUndo }: Props) {
  const sorted = [...tasks].sort(
    (a, b) => effectiveDate(b) - effectiveDate(a)
  )

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
              <div>
                <h2
                  className="text-gray-900 dark:text-gray-100 leading-none"
                  style={{
                    fontFamily: 'var(--font-bebas, sans-serif)',
                    fontSize: '2.6rem',
                    letterSpacing: '0.02em',
                  }}
                >
                  Done
                </h2>
                <div
                  className="mt-1.5 rounded-full"
                  style={{ height: '3px', width: '2.5rem', backgroundColor: '#FFE500' }}
                />
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {sorted.length === 0 ? (
                <p
                  className="text-center text-sm text-gray-400 py-12"
                  style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
                >
                  Nothing done yet. Maybe tomorrow?
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {sorted.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900"
                    >
                      <Check size={14} strokeWidth={2.5} className="text-green-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm text-gray-400 dark:text-gray-500 line-through leading-snug truncate"
                          style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
                        >
                          {task.title}
                        </p>
                      </div>
                      <button
                        onClick={() => onUndo(task.id)}
                        className="shrink-0 p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
                      >
                        <Undo2 size={14} strokeWidth={2} />
                      </button>
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
