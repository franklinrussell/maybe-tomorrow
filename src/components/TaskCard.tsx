'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowUpToLine, X, Pin, PinOff } from 'lucide-react'
import { Task, TaskState } from '@/types'
import StateToggle from './StateToggle'

interface Props {
  task: Task
  onStateChange: (id: string, state: TaskState) => void
  onMove: (id: string) => void
  onDelete: (id: string) => void
  onPin?: (id: string, pinned: boolean) => void
  onEdit?: (id: string, title: string, notes: string) => void
  onMoveToTop?: (id: string) => void
  isFirst?: boolean
  isBlowingUp?: boolean
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
  onPin,
  onEdit,
  onMoveToTop,
  isFirst = false,
  isBlowingUp = false,
}: Props) {
  const isDone = task.state === 'done'
  const isNotToday = task.list === 'not_today'
  const isPinned = task.pinned ?? false
  const dashes = blowDashes(task.blownUpCount)
  const daysSinceCreated = Math.floor((Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24))
  const ageDashes = blowDashes(daysSinceCreated)

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

  // Clicking anywhere on the card resets confirm states (but not when editing)
  function handleCardClick(e: React.MouseEvent) {
    if (isEditing) return
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
      {/* Red dashes — top-right, blownUpCount */}
      {dashes && (
        <span className="absolute top-0 right-3 text-xs font-black text-red-500 select-none leading-none tracking-normal" style={{ transform: 'translateY(-50%)' }}>
          {dashes}
        </span>
      )}

      {/* Blue dashes — top-left, age indicator, grows inward from left */}
      {ageDashes && (
        <span className="absolute top-0 left-3 text-xs font-black text-blue-400 select-none leading-none tracking-normal flex flex-row-reverse" style={{ transform: 'translateY(-50%)' }}>
          {ageDashes}
        </span>
      )}

      {/* Main content row */}
      <div className="flex items-start gap-2">

        {/* Not Today: ← left of state toggle */}
        {isNotToday && (
          <button
            onClick={(e) => { e.stopPropagation(); onMove(task.id) }}
            className="w-8 h-8 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-[#FFE500] text-gray-600 dark:text-gray-300 hover:text-black transition-colors cursor-pointer flex items-center justify-center mt-0.5"
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

        {/* Right-side actions: [pin] [×] [💣→] — hidden for done tasks or while editing */}
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

            {/* Today: sweep two-stage */}
            {!isNotToday && (
              <button
                ref={bombButtonRef}
                onClick={handleBombClick}
                className={`
                  h-8 rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center
                  ${isBombConfirming
                    ? 'px-2 bg-[#FFFBEB] dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-gray-800 dark:text-yellow-200'
                    : 'w-8 bg-gray-100 dark:bg-gray-700 hover:bg-[#FFE500] text-gray-600 dark:text-gray-300 hover:text-black'
                  }
                `}
                style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
              >
                {isBombConfirming
                  ? <span className="flex items-center gap-1.5 text-xs font-semibold leading-none whitespace-nowrap">
                      Maybe tomorrow?
                      <svg width="14" height="14" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <line x1="18" y1="50" x2="74" y2="50" stroke="currentColor" strokeWidth="11" strokeLinecap="square"/>
                        <polyline points="56,28 78,50 56,72" fill="none" stroke="currentColor" strokeWidth="11" strokeLinecap="square" strokeLinejoin="miter"/>
                      </svg>
                    </span>
                  : <svg width="16" height="16" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                      <line x1="18" y1="50" x2="74" y2="50" stroke="currentColor" strokeWidth="11" strokeLinecap="square"/>
                      <polyline points="56,28 78,50 56,72" fill="none" stroke="currentColor" strokeWidth="11" strokeLinecap="square" strokeLinejoin="miter"/>
                    </svg>
                }
              </button>
            )}
            </>)}
          </div>
        )}
      </div>
    </div>
  )
}
