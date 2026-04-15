'use client'

import { useEffect, useRef, useState } from 'react'

function ArrowsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="3,6 7,10 3,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="8,6 12,10 8,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="13,6 17,10 13,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

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
          ? 'w-8 bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
          : isConfirming
            ? 'px-2.5 bg-[#FFFBEB] dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-gray-800 dark:text-yellow-200 cursor-pointer hover:opacity-90 active:scale-[0.98]'
            : 'w-8 bg-gray-100 dark:bg-gray-700 hover:bg-[#FFE500] text-gray-600 dark:text-gray-300 hover:text-black cursor-pointer active:scale-[0.98]'
        }
      `}
      style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
    >
      {loading
        ? <ArrowsIcon />
        : isConfirming
          ? <span className="text-xs font-semibold leading-none whitespace-nowrap">Maybe all tomorrow?</span>
          : <ArrowsIcon />
      }
    </button>
  )
}
