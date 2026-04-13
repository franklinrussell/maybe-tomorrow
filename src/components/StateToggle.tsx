'use client'

import { TaskState } from '@/types'

const STATES: TaskState[] = ['not_started', 'in_progress', 'done']

const CONFIG: Record<TaskState, { icon: string; pill: string; iconColor: string; label: string }> = {
  not_started: {
    icon: '○',
    pill: 'bg-gray-100 hover:bg-gray-200',
    iconColor: 'text-gray-400',
    label: 'Not started',
  },
  in_progress: {
    icon: '◑',
    pill: 'bg-amber-100 hover:bg-amber-200',
    iconColor: 'text-amber-500',
    label: 'In progress',
  },
  done: {
    icon: '●',
    pill: 'bg-green-100 hover:bg-green-200',
    iconColor: 'text-green-600',
    label: 'Done',
  },
}

interface Props {
  state: TaskState
  onChange: (next: TaskState) => void
  disabled?: boolean
}

export default function StateToggle({ state, onChange, disabled }: Props) {
  const cfg = CONFIG[state]

  function handleClick() {
    if (disabled) return
    const idx = STATES.indexOf(state)
    onChange(STATES[(idx + 1) % STATES.length])
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      title={`${cfg.label} — click to advance`}
      className={`
        w-7 h-7 rounded-full flex items-center justify-center shrink-0
        transition-colors duration-150 select-none
        ${cfg.pill}
        ${disabled ? 'cursor-default opacity-50' : 'cursor-pointer'}
      `}
    >
      <span className={`text-base leading-none ${cfg.iconColor}`} style={{ fontFamily: 'sans-serif' }}>
        {cfg.icon}
      </span>
    </button>
  )
}
