'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowUpToLine, ArrowDownToLine, X, Pin, PinOff } from 'lucide-react'
import { Task, TaskState } from '@/types'
import StateToggle from './StateToggle'

const COLOR_CYCLE = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'] as const
const COLOR_BG: Record<string, string> = {
  red: 'bg-red-400 border-red-400',
  orange: 'bg-orange-400 border-orange-400',
  yellow: 'bg-yellow-400 border-yellow-400',
  green: 'bg-green-400 border-green-400',
  blue: 'bg-blue-400 border-blue-400',
  purple: 'bg-purple-400 border-purple-400',
}

const COLOR_SOLID: Record<string, string> = {
  red: '#f87171',
  orange: '#fb923c',
  yellow: '#facc15',
  green: '#4ade80',
  blue: '#60a5fa',
  purple: '#c084fc',
}

export function nextColor(current: string | null | undefined): string | null {
  if (!current) return 'red'
  const idx = COLOR_CYCLE.indexOf(current as typeof COLOR_CYCLE[number])
  if (idx === -1 || idx === COLOR_CYCLE.length - 1) return null
  return COLOR_CYCLE[idx + 1]
}


interface Props {
  task: Task
  onStateChange: (id: string, state: TaskState) => void
  onMove: (id: string) => void
  onDelete: (id: string) => void
  onPin?: (id: string, pinned: boolean) => void
  onEdit?: (id: string, title: string, notes: string) => void
  onMoveToTop?: (id: string) => void
  onMoveToBottom?: (id: string) => void
  onColorChange?: (id: string, color: string | null) => void
  isFirst?: boolean
  isLast?: boolean
  isBlowingUp?: boolean
  comment?: string
}

function DashStrip({ count, colorClass, position }: { count: number; colorClass: string; position: 'top' | 'bottom' }) {
  if (count <= 0) return null
  const filled = Math.min(count, 25)
  const dashes = Array(filled).fill('—').join(' ')
  return (
    <span
      className={`absolute ${position === 'top' ? 'top-0' : 'bottom-0'} right-3 flex items-center gap-1 select-none leading-none`}
      style={{ transform: `translateY(${position === 'top' ? '-50%' : '50%'})` }}
    >
      {count > 25 && (
        <span className="text-xs text-gray-400" style={{ fontFamily: 'var(--font-jakarta, sans-serif)', fontWeight: 400 }}>
          {count}
        </span>
      )}
      <span className={`text-xs font-black ${colorClass}`}>{dashes}</span>
    </span>
  )
}

export default function TaskCard({
  task,
  onStateChange,
  onMove,
  onDelete,
  onPin,
  onEdit,
  onMoveToTop,
  onMoveToBottom,
  onColorChange,
  isFirst = false,
  isLast = false,
  isBlowingUp = false,
  comment,
}: Props) {
  const isDone = task.state === 'done'
  const isNotToday = task.list === 'not_today'
  const isPinned = task.pinned ?? false
  const daysSinceCreated = Math.floor((Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24))

  // Inline edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editNotes, setEditNotes] = useState(task.notes ?? '')
  const titleInputRef = useRef<HTMLInputElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  function enterEdit(e: React.MouseEvent) {
    if (isDone || isBlowingUp) return
    e.stopPropagation()
    setEditTitle(task.title)
    setEditNotes(task.notes ?? '')
    setIsEditing(true)
  }

  function commitEdit() {
    setIsEditing(false)
    const trimTitle = editTitle.trim()
    const trimNotes = editNotes.trim()
    if (!trimTitle) {
      setEditTitle(task.title)
      setEditNotes(task.notes ?? '')
      return
    }
    if (trimTitle !== task.title || trimNotes !== (task.notes ?? '')) {
      onEdit?.(task.id, trimTitle, trimNotes)
    }
  }

  function cancelEdit() {
    setIsEditing(false)
    setEditTitle(task.title)
    setEditNotes(task.notes ?? '')
  }

  // Focus title input when entering edit mode
  useEffect(() => {
    if (isEditing) {
      titleInputRef.current?.focus()
      titleInputRef.current?.select()
    }
  }, [isEditing])

  // Click outside card to save
  useEffect(() => {
    if (!isEditing) return
    function handleOutside(e: MouseEvent) {
      if (!cardRef.current?.contains(e.target as Node)) commitEdit()
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [isEditing, editTitle, editNotes]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Clicking anywhere on the card resets confirm states (but not when editing)
  function handleCardClick(e: React.MouseEvent) {
    if (isEditing) return
    if (isConfirming && !deleteButtonRef.current?.contains(e.target as Node)) {
      cancelConfirm()
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current)
    }
  }, [])

  const titleColorClass = isDone
    ? 'line-through text-gray-400 dark:text-gray-600'
    : isNotToday
      ? 'text-gray-600 dark:text-gray-400'
      : 'text-gray-800 dark:text-gray-100'

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      className={`
        relative group rounded-xl border border-[#E5E5E5] dark:border-gray-700
        px-4 py-3 transition-all duration-150
        ${isEditing ? '' : 'hover:-translate-y-0.5'}
        ${isDone ? 'opacity-50' : ''}
        ${isNotToday ? 'bg-white/80 dark:bg-gray-800/60' : 'bg-white dark:bg-gray-800'}
      `}
      style={{
        boxShadow: isDone
          ? '0 1px 2px rgba(0,0,0,0.04)'
          : '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
        borderLeft: isNotToday && isPinned ? '3px solid #FFE500' : undefined,
      }}
      onMouseEnter={(e) => {
        if (!isDone && !isEditing) {
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
      {/* Blue dashes — top-right, age indicator (hidden on pinned tasks) */}
      {!isPinned && <DashStrip count={daysSinceCreated} colorClass="text-blue-400" position="top" />}

      {/* Red dashes — bottom-right, blownUpCount (hidden on pinned tasks) */}
      {!isPinned && <DashStrip count={task.blownUpCount} colorClass="text-red-500" position="bottom" />}

      {/* Mobile-only move button */}
      {!isDone && !isEditing && !isBlowingUp && (
        <div className="md:hidden mb-2">
          <button
            onClick={(e) => { e.stopPropagation(); onMove(task.id) }}
            className="w-full text-xs py-1.5 px-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-pointer flex items-center justify-center gap-1"
            style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
          >
            {isNotToday ? '↑ Today' : '↓ Not Today'}
          </button>
        </div>
      )}

      {/* Main content row */}
      <div className="flex items-start gap-2">

        {/* Not Today: ← left of state toggle */}
        {isNotToday && (
          <button
            onClick={(e) => { e.stopPropagation(); onMove(task.id) }}
            className="w-8 h-8 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-[#FFE500] text-gray-600 dark:text-gray-300 hover:text-black transition-colors cursor-pointer flex items-center justify-center mt-0.5 max-md:hidden"
          >
            <ArrowLeft size={14} strokeWidth={2} />
          </button>
        )}

        {/* State toggle */}
        <div className="shrink-0 mt-0.5">
          <StateToggle
            state={task.state}
            onChange={(next) => onStateChange(task.id, next)}
            disabled={isBlowingUp}
          />
        </div>

        {/* Title + notes */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <>
              <input
                ref={titleInputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
                  if (e.key === 'Escape') cancelEdit()
                }}
                onClick={(e) => e.stopPropagation()}
                className={`w-full text-sm font-medium leading-snug bg-transparent border-0 p-0 m-0 ${titleColorClass}`}
                style={{
                  fontFamily: 'var(--font-jakarta, sans-serif)',
                  outline: '2px solid #FFE500',
                  borderRadius: '4px',
                  paddingLeft: '2px',
                  paddingRight: '2px',
                }}
              />
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') cancelEdit()
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit() }
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="add a note..."
                rows={1}
                className="mt-1 w-full text-xs text-gray-400 bg-transparent border-0 p-0 m-0 resize-none leading-snug placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-0"
                style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
                onFocus={(e) => { e.currentTarget.rows = 3 }}
                onBlur={(e) => { if (!e.currentTarget.value) e.currentTarget.rows = 1 }}
              />
            </>
          ) : (
            <>
              <p
                onClick={enterEdit}
                className={`text-sm leading-snug break-words font-medium cursor-text ${titleColorClass}`}
                style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
              >
                {task.title}
              </p>
              {!isDone && comment && (
                <p
                  className="mt-0.5 text-xs italic text-gray-400 dark:text-gray-500 leading-snug"
                  style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
                >
                  {comment}
                </p>
              )}
              {task.notes && (
                <p
                  className="mt-1 text-xs text-gray-400 leading-snug truncate"
                  style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
                >
                  {task.notes}
                </p>
              )}
            </>
          )}
        </div>

        {/* Right-side actions: [↑] [↕] [pin] [×] [→] [color] — hidden while editing */}
        {!isEditing && (
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            {isDone ? null : (<>
            {/* Move to top — hidden when already first */}
            {!isFirst && onMoveToTop && (
              <button
                onClick={(e) => { e.stopPropagation(); onMoveToTop(task.id) }}
                className="p-1.5 rounded-md text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <ArrowUpToLine size={14} strokeWidth={2} />
              </button>
            )}
            {/* Move to bottom — Not Today only, hidden when already last */}
            {isNotToday && !isLast && onMoveToBottom && (
              <button
                onClick={(e) => { e.stopPropagation(); onMoveToBottom(task.id) }}
                className="p-1.5 rounded-md text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <ArrowDownToLine size={14} strokeWidth={2} />
              </button>
            )}
            {/* Pin button — Not Today only */}
            {isNotToday && onPin && (
              <button
                onClick={(e) => { e.stopPropagation(); onPin(task.id, !isPinned) }}
                className={`
                  flex items-center justify-center transition-all duration-150 cursor-pointer rounded-md
                  ${isPinned
                    ? 'w-8 h-8 bg-[#FFE500] text-black'
                    : 'p-1 text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
                  }
                `}
              >
                {isPinned ? <PinOff size={14} strokeWidth={2} /> : <Pin size={14} strokeWidth={2} />}
              </button>
            )}
            {/* Two-stage delete */}
            <button
              ref={deleteButtonRef}
              onClick={handleDeleteClick}
              className={`
                flex items-center justify-center transition-all duration-150 cursor-pointer rounded-lg
                ${isConfirming
                  ? 'h-8 px-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-gray-800 dark:text-gray-200'
                  : 'p-1 text-gray-400 dark:text-gray-600 hover:text-red-400'
                }
              `}
              style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
            >
              {isConfirming ? (
                <span className="text-xs font-semibold leading-none whitespace-nowrap">Maybe never. Delete forever?</span>
              ) : (
                <X size={16} strokeWidth={3} />
              )}
            </button>

            {/* Today: move to Not Today */}
            {!isNotToday && (
              <button
                onClick={(e) => { e.stopPropagation(); onMove(task.id) }}
                className="w-8 h-8 rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-[#FFE500] text-gray-600 dark:text-gray-300 hover:text-black"
              >
                <svg width="16" height="16" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <line x1="18" y1="50" x2="74" y2="50" stroke="currentColor" strokeWidth="11" strokeLinecap="square"/>
                  <polyline points="56,28 78,50 56,72" fill="none" stroke="currentColor" strokeWidth="11" strokeLinecap="square" strokeLinejoin="miter"/>
                </svg>
              </button>
            )}
            </>)}
            {/* Color tag dot — rightmost, grey when unset, solid fill when set */}
            {!isDone && onColorChange && (
              <button
                onClick={(e) => { e.stopPropagation(); onColorChange(task.id, nextColor(task.color)) }}
                className="w-3.5 h-3.5 rounded-full cursor-pointer shrink-0 transition-opacity hover:opacity-70"
                style={{ backgroundColor: task.color ? (COLOR_SOLID[task.color] ?? '#d1d5db') : '#e5e7eb' }}
                title="cycle color tag"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
