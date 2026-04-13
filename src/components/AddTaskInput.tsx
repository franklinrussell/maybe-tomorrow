'use client'

import { useState, useRef } from 'react'

interface Props {
  onAdd: (title: string) => void
  placeholder?: string
}

export default function AddTaskInput({ onAdd, placeholder = '+ add task' }: Props) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={`
          w-full px-3.5 py-2.5 rounded-xl text-sm
          outline-none transition-all duration-150
          placeholder-gray-400
          ${focused
            ? 'border-2 border-[#FFE500] bg-[#FFFDE7] ring-4 ring-[#FFE500]/20'
            : 'border border-[#E5E5E5] bg-gray-50 hover:border-gray-300 border-dashed'
          }
        `}
        style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
      />
    </form>
  )
}
