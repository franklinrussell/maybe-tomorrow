'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  onBlowUp: () => Promise<void>
  taskCount: number
}

export default function BlowUpButton({ onBlowUp, taskCount }: Props) {
  const [loading, setLoading] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function startConfirm() {
    setIsConfirming(true)
    timeoutRef.current = setTimeout(() => setIsConfirming(false), 3000)
  }

  function cancelConfirm() {
    setIsConfirming(false)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }

  async function handleConfirmed() {
    cancelConfirm()
    setLoading(true)
    try {
      await onBlowUp()
    } finally {
      setLoading(false)
    }
  }

  function handleClick() {
    if (loading || taskCount === 0) return
    if (isConfirming) {
      handleConfirmed()
    } else {
      startConfirm()
    }
  }

  // Click outside resets confirm
  useEffect(() => {
    if (!isConfirming) return
    function handleOutside(e: MouseEvent) {
      if (!buttonRef.current?.contains(e.target as Node)) cancelConfirm()
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [isConfirming])

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [])

  const disabled = taskCount === 0 || loading

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={disabled}
      className={`
        ml-auto mt-1 h-8 flex items-center justify-center
        rounded-lg select-none transition-all duration-150
        ${disabled
          ? 'w-8 bg-gray-100 cursor-not-allowed'
          : isConfirming
            ? 'px-2.5 cursor-pointer hover:opacity-90 active:scale-[0.98]'
            : 'w-8 cursor-pointer hover:opacity-90 active:scale-[0.98]'
        }
      `}
      style={{
        background: disabled ? undefined : 'linear-gradient(135deg, #FF3B30 0%, #FF5A30 100%)',
        fontFamily: 'var(--font-jakarta, sans-serif)',
      }}
    >
      {loading
        ? <span className="text-sm leading-none">💣</span>
        : isConfirming
          ? <span className="text-xs font-semibold leading-none whitespace-nowrap text-white">Everything not today? 💣</span>
          : <span className="text-sm leading-none">💣</span>
      }
    </button>
  )
}
