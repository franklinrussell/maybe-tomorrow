'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Logo from '@/components/Logo'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

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

      <Header />

      <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo size={120} />
          <div className="text-center">
            <p
              style={{
                fontFamily: 'var(--font-jakarta, sans-serif)',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'inherit',
              }}
              className="text-gray-900 dark:text-gray-100"
            >
              Maybe Tomorrow
            </p>
            <p
              style={{
                fontFamily: 'var(--font-jakarta, sans-serif)',
                fontSize: '0.8rem',
                color: '#9CA3AF',
                marginTop: '2px',
              }}
            >
              Maybe.
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
        >
          {sent ? (
            <div className="text-center py-4">
              <div className="mb-4 flex justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="6" width="20" height="14" rx="2" stroke="#111" strokeWidth="1.5"/>
                  <path d="M2 8 L12 14 L22 8" stroke="#111" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-jakarta, sans-serif)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#111',
                }}
              >
                Sign in link sent to {email}
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
                  {loading ? 'Sending…' : 'Sign in'}
                </button>
              </form>
            </>
          )}
        </div>

      </div>
      </div>

      <Footer />
    </div>
  )
}
