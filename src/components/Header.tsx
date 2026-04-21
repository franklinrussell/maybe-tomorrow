'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useSession, signOut } from 'next-auth/react'
import { Sun, Moon, User, Upload, Check } from 'lucide-react'
import Logo from '@/components/Logo'
import ImportModal from '@/components/ImportModal'
import { Task, TaskList as TaskListType } from '@/types'

export function Header({
  onImport,
  commentaryEnabled = true,
  onToggleCommentary,
}: {
  onImport?: (lines: string[], destination: TaskListType) => Promise<void>
  commentaryEnabled?: boolean
  onToggleCommentary?: () => void
}) {
  const { resolvedTheme, setTheme } = useTheme()
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  const userInitial = session?.user?.name?.[0]?.toUpperCase()
    ?? session?.user?.email?.[0]?.toUpperCase()

  return (
    <>
      <header
        className="sticky top-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', height: '56px' }}
      >

          {/* Left: logo + wordmark */}
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <Logo size={28} />
            <span
              className="text-gray-900 dark:text-gray-100"
              style={{
                fontFamily: 'var(--font-bebas, sans-serif)',
                fontSize: '1.15rem',
                letterSpacing: '0.04em',
                lineHeight: 1,
              }}
            >
              MAYBE TOMORROW
            </span>
            <span
              style={{
                fontFamily: 'var(--font-jakarta, sans-serif)',
                fontSize: '0.7rem',
                color: '#B0B7C3',
              }}
            >
              beta
            </span>
          </Link>

          {/* Right: theme toggle + user */}
          <div className="flex items-center gap-1">

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle dark mode"
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {mounted && resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* User avatar / dropdown */}
            {session ? (
              <div className="relative ml-1" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  aria-label="User menu"
                  className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer text-sm font-semibold transition-colors"
                  style={{ backgroundColor: '#FFE500', color: '#111' }}
                >
                  {userInitial ?? <User size={14} />}
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 py-1"
                    style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}
                  >
                    {/* Email */}
                    <div
                      className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 truncate"
                      style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
                    >
                      {session.user?.email}
                    </div>
                    <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
                    {/* Import tasks */}
                    <button
                      onClick={() => { setDropdownOpen(false); setIsImportOpen(true) }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer flex items-center gap-2"
                      style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
                    >
                      <Upload size={14} className="text-gray-400" />
                      Import tasks
                    </button>
                    {/* Commentary toggle */}
                    <button
                      onClick={() => { onToggleCommentary?.() }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer flex items-center gap-2"
                      style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
                    >
                      <span className="w-3.5 flex items-center justify-center shrink-0">
                        {commentaryEnabled && <Check size={12} className="text-gray-500 dark:text-gray-400" />}
                      </span>
                      Commentary
                    </button>
                    <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
                    {/* Sign out */}
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
              >
                Sign in
              </Link>
            )}
          </div>
      </header>

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={onImport ?? (() => Promise.resolve())}
      />
    </>
  )
}
