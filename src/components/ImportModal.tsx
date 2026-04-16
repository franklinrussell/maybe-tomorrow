'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { TaskList } from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  onImport: (lines: string[], destination: TaskList) => Promise<void>
}

export default function ImportModal({ isOpen, onClose, onImport }: Props) {
  const [text, setText] = useState('')
  const [destination, setDestination] = useState<TaskList>('not_today')
  const [importing, setImporting] = useState(false)
  const [successCount, setSuccessCount] = useState<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  // Reset and focus on open
  useEffect(() => {
    if (isOpen) {
      setText('')
      setDestination('not_today')
      setSuccessCount(null)
      setImporting(false)
      setTimeout(() => textareaRef.current?.focus(), 80)
    }
  }, [isOpen])

  // Escape to close
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  async function handleImport() {
    if (lines.length === 0 || importing) return
    setImporting(true)
    try {
      await onImport(lines, destination)
      setSuccessCount(lines.length)
      setTimeout(() => onClose(), 1500)
    } finally {
      setImporting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — also the centering flex container */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          >
            {/* Modal — stop click bubbling so clicking inside doesn't close */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl flex flex-col w-full overflow-y-auto"
              style={{ maxWidth: '580px', maxHeight: '90vh' }}
            >
            {/* Header */}
            <div className="flex items-start justify-between px-8 pt-8 pb-4 shrink-0">
              <div>
                <h2
                  className="text-gray-900 dark:text-gray-100 leading-none"
                  style={{
                    fontFamily: 'var(--font-bebas, sans-serif)',
                    fontSize: '2rem',
                    letterSpacing: '0.02em',
                  }}
                >
                  IMPORT TASKS
                </h2>
                <div
                  className="mt-1.5 rounded-full"
                  style={{ height: '3px', width: '3rem', backgroundColor: '#FFE500' }}
                />
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer shrink-0 -mt-0.5"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {/* Body */}
            <div className="px-8 pb-8 flex flex-col gap-4">
              {/* Description */}
              <p
                className="text-xs text-gray-400 dark:text-gray-500 -mt-1"
                style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
              >
                one per line
              </p>

              {/* Textarea */}
              <div>
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={16}
                  placeholder={"Buy groceries\nCall the dentist\nFinish the report\nBook flights"}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm px-3 py-2.5 resize-none transition"
                  style={{
                    fontFamily: 'var(--font-jakarta, sans-serif)',
                    outline: 'none',
                    boxShadow: 'none',
                  }}
                  onFocus={(e) => { e.target.style.outline = '2px solid #FFE500'; e.target.style.outlineOffset = '-2px' }}
                  onBlur={(e) => { e.target.style.outline = 'none' }}
                />
                <p
                  className="mt-1.5 text-xs text-gray-400 text-right"
                  style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
                >
                  {lines.length} task{lines.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Destination toggle */}
              <div>
                <p
                  className="text-xs text-gray-400 mb-2"
                  style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
                >
                  Add to
                </p>
                <div className="flex gap-2">
                  {(['today', 'not_today'] as TaskList[]).map((list) => (
                    <button
                      key={list}
                      onClick={() => setDestination(list)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                        destination === list
                          ? 'text-gray-900'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      style={{
                        fontFamily: 'var(--font-jakarta, sans-serif)',
                        ...(destination === list ? { backgroundColor: '#FFE500', color: '#111' } : {}),
                      }}
                    >
                      {list === 'today' ? 'Today' : 'Not Today'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-1">
                {successCount !== null ? (
                  <p
                    className="text-xs text-gray-400 dark:text-gray-500"
                    style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
                  >
                    {successCount} task{successCount !== 1 ? 's' : ''} imported
                  </p>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={lines.length === 0 || importing || successCount !== null}
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      fontFamily: 'var(--font-jakarta, sans-serif)',
                      backgroundColor: '#FFE500',
                      color: '#111',
                    }}
                  >
                    {importing ? 'Importing…' : 'Import'}
                  </button>
                </div>
              </div>
            </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
