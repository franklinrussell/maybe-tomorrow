'use client'

import { useEffect, useRef, useState } from 'react'
import { Droppable, Draggable } from '@hello-pangea/dnd'
import { motion, useAnimation } from 'framer-motion'
import { X } from 'lucide-react'
import { Task, TaskState, TaskList as TaskListType } from '@/types'
import TaskCard, { nextColor, colorDotClass } from './TaskCard'
import AddTaskInput from './AddTaskInput'
import BlowUpButton from './BlowUpButton'
import DoneDrawer from './DoneDrawer'

interface Props {
  list: TaskListType
  tasks: Task[]
  allTasks?: Task[]  // full unfiltered task list — used for done counter/drawer in Today column
  loading?: boolean
  onAdd: (title: string) => void
  onStateChange: (id: string, state: TaskState) => void
  onMove: (id: string) => void
  onDelete: (id: string) => void
  onPin?: (id: string, pinned: boolean) => void
  onEdit?: (id: string, title: string, notes: string) => void
  onMoveToTop?: (id: string) => void
  onMoveToBottom?: (id: string) => void
  onUndo?: (id: string) => void
  onBlowUp?: () => Promise<void>
  onColorChange?: (id: string, color: string | null) => void
  blowingUpIds?: Set<string>
  flashKey?: number
  comments?: Record<string, string>
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.state === 'done' && b.state !== 'done') return 1
    if (a.state !== 'done' && b.state === 'done') return -1
    return a.order - b.order
  })
}

// Owns motion.div + blow-up animation outside the Draggable so
// dragHandleProps lands on a plain DOM element, not a motion element.
function AnimatedDraggable({
  task,
  index,
  isBlowingUp,
  blowUpDelay,
  isFirst,
  onStateChange,
  onMove,
  onDelete,
  onPin,
  onEdit,
  onMoveToTop,
  onMoveToBottom,
  onColorChange,
  isLast,
  comment,
}: {
  task: Task
  index: number
  isBlowingUp: boolean
  blowUpDelay: number
  isFirst: boolean
  onStateChange: (id: string, state: TaskState) => void
  onMove: (id: string) => void
  onDelete: (id: string) => void
  onPin?: (id: string, pinned: boolean) => void
  onEdit?: (id: string, title: string, notes: string) => void
  onMoveToTop?: (id: string) => void
  onMoveToBottom?: (id: string) => void
  onColorChange?: (id: string, color: string | null) => void
  isLast?: boolean
  comment?: string
}) {
  const controls = useAnimation()

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
    <motion.div animate={controls}>
      <Draggable draggableId={task.id} index={index} isDragDisabled={isBlowingUp}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              ...provided.draggableProps.style,
              cursor: snapshot.isDragging ? 'grabbing' : 'grab',
              filter: snapshot.isDragging
                ? 'drop-shadow(0 8px 20px rgba(0,0,0,0.12))'
                : undefined,
              transform: snapshot.isDragging
                ? `${provided.draggableProps.style?.transform ?? ''} rotate(1.5deg)`
                : provided.draggableProps.style?.transform,
            }}
          >
            <TaskCard
              task={task}
              isFirst={isFirst}
              onStateChange={onStateChange}
              onMove={onMove}
              onDelete={onDelete}
              onPin={onPin}
              onEdit={onEdit}
              onMoveToTop={onMoveToTop}
              onMoveToBottom={onMoveToBottom}
              onColorChange={onColorChange}
              isLast={isLast}
              isBlowingUp={isBlowingUp}
              comment={comment}
            />
          </div>
        )}
      </Draggable>
    </motion.div>
  )
}

export default function TaskList({
  list,
  tasks,
  allTasks,
  loading = false,
  onAdd,
  onStateChange,
  onMove,
  onDelete,
  onPin,
  onEdit,
  onMoveToTop,
  onMoveToBottom,
  onUndo,
  onBlowUp,
  onColorChange,
  blowingUpIds,
  flashKey = 0,
  comments,
}: Props) {
  const [filter, setFilter] = useState('')  // debounced — drives task list
  const [colorFilter, setColorFilter] = useState<string | null>(null)
  const filterInputRef = useRef<HTMLInputElement>(null)
  const filterRawRef = useRef('')
  const filterDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleFilterChange(e: React.ChangeEvent<HTMLInputElement>) {
    filterRawRef.current = e.target.value
    if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current)
    filterDebounceRef.current = setTimeout(() => setFilter(filterRawRef.current), 150)
  }

  function clearFilter() {
    filterRawRef.current = ''
    if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current)
    setFilter('')
    if (filterInputRef.current) filterInputRef.current.value = ''
  }

  useEffect(() => () => { if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current) }, [])


  const sorted = sortTasks(tasks)
  const isToday = list === 'today'
  const nonDoneCount = tasks.filter((t) => t.state !== 'done').length

  const filteredSorted = (() => {
    let result = sorted
    if (!isToday && filter) {
      const q = filter.toLowerCase()
      result = result.filter((t) => t.title.toLowerCase().includes(q) || (t.notes?.toLowerCase().includes(q) ?? false))
    }
    if (colorFilter) {
      result = result.filter((t) => t.color === colorFilter)
    }
    return result
  })()
  const filteredNonDoneCount = filteredSorted.filter((t) => t.state !== 'done').length
  const isFiltered = (!isToday && !!filter) || !!colorFilter

  const headerControls = useAnimation()

  // Done drawer state (Today column only)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const source = allTasks ?? tasks
  // Drawer shows done tasks that are hidden from the active list.
  // Derived by subtraction: all done tasks minus the done tasks already visible in the active column.
  // This is immune to completedAt date edge cases (backfill, timezone, etc.) and updates reactively on undo.
  const activeDoneIds = new Set(tasks.filter((t) => t.state === 'done').map((t) => t.id))
  const drawerTasks = source.filter((t) => t.state === 'done' && !activeDoneIds.has(t.id))
  const doneCount = drawerTasks.length

  // Prevent hydration mismatch — only render DragDropContext after mount
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (flashKey === 0 || isToday) return
    headerControls.start({
      x: [0, -7, 7, -5, 5, -2, 2, 0],
      transition: { duration: 0.4, ease: 'easeInOut' },
    })
  }, [flashKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const lastNonDoneIndex = filteredSorted.reduce((acc, t, i) => t.state !== 'done' ? i : acc, -1)

  const blowUpOrder = sorted.filter((t) => blowingUpIds?.has(t.id)).map((t) => t.id)
  const blowUpDelayMap = new Map(blowUpOrder.map((id, i) => [id, i * 80]))

  return (
    <div className={`flex flex-col h-full max-md:h-auto ${isToday ? 'bg-white dark:bg-gray-950' : 'bg-[#F8F7F5] dark:bg-gray-900'}`}>
      {/* Column header */}
      <motion.div
        animate={headerControls}
        className="relative px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800"
      >
        {/* Task count + filter controls — absolute so they don't affect header height */}
        <div className="absolute top-6 right-6 flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            <span
              style={{
                fontFamily: 'var(--font-jakarta, sans-serif)',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#9CA3AF',
                fontVariantNumeric: 'lining-nums',
              }}
            >
              {isFiltered
                ? `${filteredNonDoneCount} of ${nonDoneCount} task${nonDoneCount !== 1 ? 's' : ''}`
                : `${nonDoneCount} task${nonDoneCount !== 1 ? 's' : ''}`
              }
            </span>
            {/* Color filter dot — Today column */}
            {isToday && (
              <button
                onClick={() => setColorFilter(nextColor(colorFilter))}
                className={`w-3 h-3 rounded-full border transition-colors cursor-pointer shrink-0 ${colorDotClass(colorFilter)} ${!colorFilter ? 'opacity-30 hover:opacity-60' : 'opacity-100'}`}
                title="filter by color"
              />
            )}
          </div>
          {isToday && onBlowUp && (
            <BlowUpButton onBlowUp={onBlowUp} taskCount={nonDoneCount} />
          )}
          {!isToday && (
            <div className="flex items-center gap-1.5">
              <div className="relative w-36">
                <input
                  ref={filterInputRef}
                  type="text"
                  defaultValue=""
                  onChange={handleFilterChange}
                  placeholder="filter..."
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="w-full pl-2.5 pr-6 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-gray-600 dark:text-gray-400 placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                  style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
                />
                {filter && (
                  <button
                    onClick={clearFilter}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    <X size={11} strokeWidth={2.5} />
                  </button>
                )}
              </div>
              {/* Color filter dot — Not Today column */}
              <button
                onClick={() => setColorFilter(nextColor(colorFilter))}
                className={`w-3 h-3 rounded-full border transition-colors cursor-pointer shrink-0 ${colorDotClass(colorFilter)} ${!colorFilter ? 'opacity-30 hover:opacity-60' : 'opacity-100'}`}
                title="filter by color"
              />
            </div>
          )}
        </div>
        <div>
          <h2
            className={`leading-none ${isToday ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'}`}
            style={{
              fontFamily: 'var(--font-bebas, sans-serif)',
              fontSize: '2.6rem',
              letterSpacing: '0.02em',
            }}
          >
            {isToday ? 'TODAY' : 'NOT TODAY'}
          </h2>
          <div
            className="mt-1.5 rounded-full"
            style={{
              height: '3px',
              width: isToday ? '2.5rem' : '3.5rem',
              backgroundColor: isToday ? '#FFE500' : '#E5E7EB',
            }}
          />
        </div>
        <p
          className="mt-2 text-xs"
          style={{ fontFamily: 'var(--font-jakarta, sans-serif)', color: '#B0B7C3' }}
        >
          {isToday ? 'now' : 'later (or never)'}
        </p>
      </motion.div>

      {/* Droppable task list */}
      <Droppable droppableId={list} isDropDisabled={!!blowingUpIds?.size}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 transition-colors duration-200 max-md:flex-none max-md:overflow-visible min-h-48 ${
              snapshot.isDraggingOver ? 'bg-amber-50/60 dark:bg-amber-900/20' : ''
            }`}
          >
            {loading && (
              <>
                {[40, 32, 40].map((h, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse shrink-0"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </>
            )}

            {!loading && filteredSorted.length === 0 && isToday && (
              <p
                className="text-sm py-10 text-center"
                style={{ fontFamily: 'var(--font-jakarta, sans-serif)', color: '#C4C9D4' }}
              >
                nothing here yet
              </p>
            )}

            {!loading && filteredSorted.length === 0 && (!isToday || colorFilter) && (filter || colorFilter) && (
              <p
                className="text-sm py-10 text-center"
                style={{ fontFamily: 'var(--font-jakarta, sans-serif)', color: '#C4C9D4' }}
              >
                no matches
              </p>
            )}

            {!loading && mounted && filteredSorted.map((task, index) => (
              <AnimatedDraggable
                key={task.id}
                task={task}
                index={index}
                isFirst={index === 0}
                isLast={index === lastNonDoneIndex}
                isBlowingUp={blowingUpIds?.has(task.id) ?? false}
                blowUpDelay={blowUpDelayMap.get(task.id) ?? 0}
                onStateChange={onStateChange}
                onMove={onMove}
                onDelete={onDelete}
                onPin={onPin}
                onEdit={onEdit}
                onMoveToTop={onMoveToTop}
                onMoveToBottom={onMoveToBottom}
                onColorChange={onColorChange}
                comment={comments?.[task.id]}
              />
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Footer */}
      <div className="px-4 pb-5 pt-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
        {isToday && doneCount > 0 && (
          <button
            onClick={() => setDrawerOpen(true)}
            className="mb-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
            style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
          >
            {doneCount} ✓
          </button>
        )}
        <AddTaskInput
          onAdd={onAdd}
          placeholder={isToday ? '+ add to today' : '+ add to not today'}
          tabIndex={isToday ? undefined : -1}
        />
      </div>

      {isToday && (
        <DoneDrawer
          isOpen={drawerOpen}
          tasks={drawerTasks}
          onClose={() => setDrawerOpen(false)}
          onUndo={onUndo ?? (() => {})}
        />
      )}
    </div>
  )
}
