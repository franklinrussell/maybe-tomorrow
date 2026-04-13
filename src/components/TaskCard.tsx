'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { ArrowLeft, X } from 'lucide-react'
import { Task, TaskState } from '@/types'
import StateToggle from './StateToggle'

interface Props {
  task: Task
  onStateChange: (id: string, state: TaskState) => void
  onMove: (id: string) => void
  onDelete: (id: string) => void
  isBlowingUp?: boolean
  blowUpDelay?: number
}

function blowDashes(count: number): string {
  if (count <= 0) return ''
  return Array(Math.min(count, 25)).fill('—').join(' ')
}

export default function TaskCard({
  task,
  onStateChange,
  onMove,
  onDelete,
  isBlowingUp = false,
  blowUpDelay = 0,
}: Props) {
  const isDone = task.state === 'done'
  const isNotToday = task.list === 'not_today'
  const dashes = blowDashes(task.blownUpCount)
  const controls = useAnimation()

  // Two-stage delete
  const [isConfirming, setIsConfirming] = useState(false)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function startConfirm() {
    setIsConfirming(true)
    confirmTimeoutRef.current = setTimeout(() => setIsConfirming(false), 3000)
  }

  function cancelConfirm() {
    setIsConfirming(false)
    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current)
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (isConfirming) {
      cancelConfirm()
      onDelete(task.id)
    } else {
      startConfirm()
    }
  }

  // Two-stage bomb move
  const [isBombConfirming, setIsBombConfirming] = useState(false)
  const bombButtonRef = useRef<HTMLButtonElement>(null)
  const bombTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function startBombConfirm() {
    setIsBombConfirming(true)
    bombTimeoutRef.current = setTimeout(() => setIsBombConfirming(false), 3000)
  }

  function cancelBombConfirm() {
    setIsBombConfirming(false)
    if (bombTimeoutRef.current) clearTimeout(bombTimeoutRef.current)
  }

  function handleBombClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (isBombConfirming) {
      cancelBombConfirm()
      onMove(task.id)
    } else {
      startBombConfirm()
    }
  }

  // Clicking anywhere on the card resets either confirm state
  function handleCardClick(e: React.MouseEvent) {
    if (isConfirming && !deleteButtonRef.current?.contains(e.target as Node)) {
      cancelConfirm()
    }
    if (isBombConfirming && !bombButtonRef.current?.contains(e.target as Node)) {
      cancelBombConfirm()
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current)
      if (bombTimeoutRef.current) clearTimeout(bombTimeoutRef.current)
    }
  }, [])

  // Blow-up animation
  useEffect(() => {
    if (!isBlowingUp) return
    let cancelled = false
    const timer = setTimeout(async () => {
      if (cancelled) return
      await controls.start({
        x: [0, -11, 11, -9, 9, -6, 6, -3, 3, 0],
        transition: { duration: 0.28, ease: 'easeInOut' },
      })
      if (cancelled) return
      await controls.start({
        x: '130vw',
        scale: 0.35,
        opacity: 0,
        transition: { duration: 0.34, ease: [0.55, 0, 1, 0.45] },
      })
    }, blowUpDelay)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [isBlowingUp, blowUpDelay, controls])

  return (
    <motion.div
      animate={controls}
      onClick={handleCardClick}
      className={`
        relative group rounded-xl border border-[#E5E5E5]
        px-4 py-3 transition-all duration-150
        hover:-translate-y-0.5
        ${isDone ? 'opacity-50' : ''}
        ${isNotToday ? 'bg-white/80' : 'bg-white'}
      `}
      style={{
        boxShadow: isDone
          ? '0 1px 2px rgba(0,0,0,0.04)'
          : '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={(e) => {
        if (!isDone) {
          (e.currentTarget as HTMLElement).style.boxShadow =
            '0 4px 14px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)'
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = isDone
          ? '0 1px 2px rgba(0,0,0,0.04)'
          : '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)'
      }}
    >
      {/* Dashes — absolute, top-right edge indicator */}
      {dashes && (
        <span className="absolute top-0 right-3 text-xs font-black text-red-500 select-none leading-none tracking-normal" style={{ transform: 'translateY(-50%)' }}>
          {dashes}
        </span>
      )}

      {/* Main content row */}
      <div className="flex items-center gap-2">

        {/* Not Today: ← left of state toggle */}
        {isNotToday && (
          <button
            onClick={() => onMove(task.id)}
            className="w-8 h-8 shrink-0 rounded-lg bg-gray-100 hover:bg-[#FFE500] text-gray-600 hover:text-black transition-colors cursor-pointer flex items-center justify-center"
          >
            <ArrowLeft size={14} strokeWidth={2} />
          </button>
        )}

        {/* State toggle */}
        <div className="shrink-0">
          <StateToggle
            state={task.state}
            onChange={(next) => onStateChange(task.id, next)}
            disabled={isBlowingUp}
          />
        </div>

        {/* Title + notes */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm leading-snug break-words font-medium ${
              isDone ? 'line-through text-gray-400' : isNotToday ? 'text-gray-600' : 'text-gray-800'
            }`}
            style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
          >
            {task.title}
          </p>
          {task.notes && (
            <p
              className="mt-1 text-xs text-gray-400 leading-snug"
              style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
            >
              {task.notes}
            </p>
          )}
        </div>

        {/* Right-side actions: [×] [💣→] — hidden for done tasks */}
        <div className="flex items-center gap-1 shrink-0">
          {isDone ? null : (<>
          {/* Two-stage delete */}
          <button
            ref={deleteButtonRef}
            onClick={handleDeleteClick}
            className={`
              flex items-center justify-center transition-all duration-150 cursor-pointer rounded-lg
              ${isConfirming
                ? 'h-8 px-2 bg-red-50 border border-red-200 text-red-500'
                : 'p-1 text-gray-400 hover:text-red-400'
              }
            `}
            style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
          >
            {isConfirming ? (
              <span className="text-xs font-semibold leading-none whitespace-nowrap">Delete forever?</span>
            ) : (
              <X size={16} strokeWidth={3} />
            )}
          </button>

          {/* Today: 💣 two-stage */}
          {!isNotToday && (
            <button
              ref={bombButtonRef}
              onClick={handleBombClick}
              className={`
                h-8 rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center
                ${isBombConfirming
                  ? 'px-2 bg-red-100 text-red-500'
                  : 'w-8 bg-gray-100 hover:bg-[#FFE500]'
                }
              `}
              style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
            >
              {isBombConfirming
                ? <span className="text-xs font-semibold leading-none whitespace-nowrap">Definitely not today? 💣</span>
                : <span className="text-sm leading-none">💣</span>
              }
            </button>
          )}
          </>)}
        </div>
      </div>
    </motion.div>
  )
}
