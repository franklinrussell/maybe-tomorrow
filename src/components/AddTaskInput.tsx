'use client'

import { useState, useRef } from 'react'
import { Check } from 'lucide-react'

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
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={`
          flex-1 px-3.5 py-2.5 rounded-xl text-sm
          outline-none transition-all duration-150
          placeholder-gray-400
          text-gray-800 dark:text-gray-100
          ${focused
            ? 'border-2 border-[#FFE500] bg-[#FFFDE7] dark:bg-yellow-900/20 ring-4 ring-[#FFE500]/20'
            : 'border border-[#E5E5E5] dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 border-dashed'
          }
        `}
        style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
      />
      <button
        type="submit"
        className="flex md:hidden items-center justify-center w-10 h-10 rounded-xl bg-[#FFE500] text-black shrink-0 active:opacity-80"
      >
        <Check size={18} strokeWidth={2.5} />
      </button>
    </form>
  )
}
