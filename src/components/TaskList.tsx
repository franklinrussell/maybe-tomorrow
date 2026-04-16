'use client'

import { useEffect, useState } from 'react'
import { Droppable, Draggable } from '@hello-pangea/dnd'
import { motion, useAnimation } from 'framer-motion'
import { Task, TaskState, TaskList as TaskListType } from '@/types'
import TaskCard from './TaskCard'
import AddTaskInput from './AddTaskInput'
import BlowUpButton from './BlowUpButton'
import DoneDrawer from './DoneDrawer'

interface Props {
  list: TaskListType
  tasks: Task[]
  allTasks?: Task[]  // full unfiltered task list — used for done counter/drawer in Today column
  onAdd: (title: string) => void
  onStateChange: (id: string, state: TaskState) => void
  onMove: (id: string) => void
  onDelete: (id: string) => void
  onPin?: (id: string, pinned: boolean) => void
  onEdit?: (id: string, title: string, notes: string) => void
  onMoveToTop?: (id: string) => void
  onBlowUp?: () => Promise<void>
  blowingUpIds?: Set<string>
  flashKey?: number
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
              isBlowingUp={isBlowingUp}
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
  onAdd,
  onStateChange,
  onMove,
  onDelete,
  onPin,
  onEdit,
  onMoveToTop,
  onBlowUp,
  blowingUpIds,
  flashKey = 0,
}: Props) {
  const sorted = sortTasks(tasks)
  const nonDoneCount = tasks.filter((t) => t.state !== 'done').length
  const isToday = list === 'today'
  const headerControls = useAnimation()

  // Done drawer state (Today column only)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const source = allTasks ?? tasks
  const doneCount = source.filter((t) => t.state === 'done').length

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

  const blowUpOrder = sorted.filter((t) => blowingUpIds?.has(t.id)).map((t) => t.id)
  const blowUpDelayMap = new Map(blowUpOrder.map((id, i) => [id, i * 80]))

  return (
    <div className={`flex flex-col h-full ${isToday ? 'bg-white dark:bg-gray-950' : 'bg-[#F8F7F5] dark:bg-gray-900'}`}>
      {/* Column header */}
      <motion.div
        animate={headerControls}
        className="relative px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800"
      >
        {/* Task count + bomb button — absolute so they don't affect header height */}
        <div className="absolute top-6 right-6 flex flex-col items-end" style={{ gap: '1px' }}>
          <span
            style={{
              fontFamily: 'var(--font-jakarta, sans-serif)',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: '#9CA3AF',
              fontVariantNumeric: 'lining-nums',
            }}
          >
            {nonDoneCount} task{nonDoneCount !== 1 ? 's' : ''}
          </span>
          {isToday && onBlowUp && (
            <BlowUpButton onBlowUp={onBlowUp} taskCount={nonDoneCount} />
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
            className={`flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 transition-colors duration-200 ${
              snapshot.isDraggingOver ? 'bg-amber-50/60 dark:bg-amber-900/20' : ''
            }`}
          >
            {sorted.length === 0 && (
              <p
                className="text-sm py-10 text-center"
                style={{ fontFamily: 'var(--font-jakarta, sans-serif)', color: '#C4C9D4' }}
              >
                {isToday ? 'nothing here yet' : 'clean slate'}
              </p>
            )}

            {mounted && sorted.map((task, index) => (
              <AnimatedDraggable
                key={task.id}
                task={task}
                index={index}
                isFirst={index === 0}
                isBlowingUp={blowingUpIds?.has(task.id) ?? false}
                blowUpDelay={blowUpDelayMap.get(task.id) ?? 0}
                onStateChange={onStateChange}
                onMove={onMove}
                onDelete={onDelete}
                onPin={onPin}
                onEdit={onEdit}
                onMoveToTop={onMoveToTop}
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
            ✓ {doneCount} done
          </button>
        )}
        <AddTaskInput
          onAdd={onAdd}
          placeholder={isToday ? '+ add to today' : '+ add to not today'}
        />
      </div>

      {isToday && (
        <DoneDrawer
          isOpen={drawerOpen}
          tasks={source}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  )
}
