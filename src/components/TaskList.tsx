'use client'

import { useEffect } from 'react'
import { Droppable, Draggable } from '@hello-pangea/dnd'
import { motion, useAnimation } from 'framer-motion'
import { Task, TaskState, TaskList as TaskListType } from '@/types'
import TaskCard from './TaskCard'
import AddTaskInput from './AddTaskInput'
import BlowUpButton from './BlowUpButton'

interface Props {
  list: TaskListType
  tasks: Task[]
  onAdd: (title: string) => void
  onStateChange: (id: string, state: TaskState) => void
  onMove: (id: string) => void
  onDelete: (id: string) => void
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

export default function TaskList({
  list,
  tasks,
  onAdd,
  onStateChange,
  onMove,
  onDelete,
  onBlowUp,
  blowingUpIds,
  flashKey = 0,
}: Props) {
  const sorted = sortTasks(tasks)
  const nonDoneCount = tasks.filter((t) => t.state !== 'done').length
  const isToday = list === 'today'
  const headerControls = useAnimation()

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
    <div className={`flex flex-col h-full ${isToday ? 'bg-white' : 'bg-[#F8F7F5]'}`}>
      {/* Column header */}
      <motion.div
        animate={headerControls}
        className="relative px-6 pt-6 pb-4 border-b border-gray-100"
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
            className="leading-none"
            style={{
              fontFamily: 'var(--font-bebas, sans-serif)',
              fontSize: '2.6rem',
              color: isToday ? '#111' : '#9CA3AF',
              letterSpacing: '0.02em',
            }}
          >
            {isToday ? 'TODAY' : 'NOT TODAY'}
          </h2>
          {/* Accent underline */}
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
          style={{
            fontFamily: 'var(--font-jakarta, sans-serif)',
            color: '#B0B7C3',
          }}
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
              snapshot.isDraggingOver ? 'bg-amber-50/60' : ''
            }`}
          >
            {sorted.length === 0 && (
              <p
                className="text-sm py-10 text-center"
                style={{
                  fontFamily: 'var(--font-jakarta, sans-serif)',
                  color: '#C4C9D4',
                }}
              >
                {isToday ? 'nothing here yet' : 'clean slate'}
              </p>
            )}

            {sorted.map((task, index) => (
              <Draggable
                key={task.id}
                draggableId={task.id}
                index={index}
                isDragDisabled={blowingUpIds?.has(task.id) ?? false}
              >
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
                      onStateChange={onStateChange}
                      onMove={onMove}
                      onDelete={onDelete}
                      isBlowingUp={blowingUpIds?.has(task.id) ?? false}
                      blowUpDelay={blowUpDelayMap.get(task.id) ?? 0}
                    />
                  </div>
                )}
              </Draggable>
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Footer */}
      <div className="px-4 pb-5 pt-3 border-t border-gray-100 shrink-0">
        <AddTaskInput
          onAdd={onAdd}
          placeholder={isToday ? '+ add to today' : '+ add to not today'}
        />
      </div>
    </div>
  )
}
