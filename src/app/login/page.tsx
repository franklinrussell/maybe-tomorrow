'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await signIn('nodemailer', { email, redirect: false, callbackUrl: '/app' })
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: '#111' }}>
              <span style={{ color: '#FFE500', fontSize: '0.7rem', fontWeight: 900, fontFamily: 'Arial Black, sans-serif' }}>N!</span>
            </div>
            <span className="text-gray-900 dark:text-gray-100 font-semibold text-sm">No, Not Today</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 text-center">
          <h1
            className="text-gray-900 dark:text-gray-100"
            style={{
              fontFamily: 'var(--font-bebas, sans-serif)',
              fontSize: '2.4rem',
              letterSpacing: '0.04em',
              lineHeight: 1,
            }}
          >
            NO, NOT TODAY
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-jakarta, sans-serif)',
              fontSize: '0.85rem',
              color: '#9CA3AF',
              marginTop: '4px',
            }}
          >
            Maybe tomorrow.
          </p>
        </div>

        {/* Card */}
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
        >
          {sent ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-3">📬</div>
              <p
                style={{
                  fontFamily: 'var(--font-jakarta, sans-serif)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#111',
                }}
              >
                Check your inbox
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-jakarta, sans-serif)',
                  fontSize: '0.8rem',
                  color: '#9CA3AF',
                  marginTop: '4px',
                }}
              >
                Magic link sent to {email}
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-xs underline cursor-pointer"
                style={{ color: '#9CA3AF', fontFamily: 'var(--font-jakarta, sans-serif)' }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <p
                className="mb-5"
                style={{
                  fontFamily: 'var(--font-jakarta, sans-serif)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#111',
                }}
              >
                Sign in with your email
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#E5E5E5] px-4 py-2.5 outline-none transition-all"
                  style={{
                    fontFamily: 'var(--font-jakarta, sans-serif)',
                    fontSize: '0.875rem',
                    color: '#111',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#FFE500'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,229,0,0.2)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E5E5E5'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl py-2.5 transition-all cursor-pointer disabled:opacity-50"
                  style={{
                    fontFamily: 'var(--font-jakarta, sans-serif)',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    backgroundColor: '#FFE500',
                    color: '#111',
                  }}
                >
                  {loading ? 'Sending…' : 'Send magic link ✉️'}
                </button>
              </form>
            </>
          )}
        </div>

      </div>
      </div>
    </div>
  )
}
