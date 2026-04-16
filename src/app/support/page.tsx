'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

const CATEGORIES = [
  'Bug Report',
  'Feature Request',
  'General',
]

const inputClass = `
  w-full rounded-xl border border-gray-200 dark:border-gray-700
  bg-gray-50 dark:bg-gray-900
  text-gray-900 dark:text-gray-100
  text-sm px-3 py-2.5 transition
`.trim()

const inputStyle = {
  fontFamily: 'var(--font-jakarta, sans-serif)',
  outline: 'none',
}

function useYellowFocus() {
  return {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.target.style.outline = '2px solid #FFE500'
      e.target.style.outlineOffset = '-2px'
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.target.style.outline = 'none'
    },
  }
}

export default function SupportPage() {
  const { data: session } = useSession()
  const sessionEmail = session?.user?.email ?? ''
  const [form, setForm] = useState({ name: '', category: 'Bug Report', message: '' })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const focusProps = useYellowFocus()

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, email: sessionEmail }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Unknown error')
      setStatus('success')
      setForm({ name: '', category: 'Bug Report', message: '' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
      <Header />

      <main className="flex-1 px-6 py-14">
        <div className="max-w-2xl mx-auto">

          {/* Heading */}
          <h1
            className="text-gray-900 dark:text-gray-100 leading-none"
            style={{
              fontFamily: 'var(--font-bebas, sans-serif)',
              fontSize: '3rem',
              letterSpacing: '0.02em',
            }}
          >
            SUPPORT
          </h1>
          <div
            className="mt-1.5 rounded-full mb-4"
            style={{ height: '3px', width: '3.5rem', backgroundColor: '#FFE500' }}
          />
          <p
            className="text-gray-400 dark:text-gray-500 mb-10"
            style={{ fontFamily: 'var(--font-jakarta, sans-serif)', fontSize: '0.9375rem' }}
          >
            We'll respond maybe tomorrow.
          </p>

          {/* Success state */}
          {status === 'success' && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 mb-8">
              <CheckCircle size={18} className="text-green-500 shrink-0" strokeWidth={2} />
              <p
                className="text-sm text-green-700 dark:text-green-400"
                style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
              >
                Message sent! We'll get back to you soon.
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="name"
                className="text-xs text-gray-400"
                style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className={inputClass}
                style={inputStyle}
                {...focusProps}
              />
            </div>

            {/* Email — from session, read-only */}
            {sessionEmail && (
              <div className="flex flex-col gap-1.5">
                <span
                  className="text-xs text-gray-400"
                  style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
                >
                  Email
                </span>
                <p
                  className="text-sm text-gray-400 dark:text-gray-500 px-1"
                  style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
                >
                  {sessionEmail}
                </p>
              </div>
            )}

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="category"
                className="text-xs text-gray-400"
                style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
              >
                Category
              </label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className={inputClass}
                style={inputStyle}
                {...focusProps}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="message"
                className="text-xs text-gray-400"
                style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
              >
                Message
              </label>
              <textarea
                id="message"
                required
                rows={6}
                value={form.message}
                onChange={(e) => set('message', e.target.value)}
                className={`${inputClass} resize-none`}
                style={inputStyle}
                {...focusProps}
              />
            </div>

            {/* Error */}
            {status === 'error' && (
              <p
                className="text-sm text-red-500"
                style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
              >
                Something went wrong. Please try again.
              </p>
            )}

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                style={{
                  fontFamily: 'var(--font-jakarta, sans-serif)',
                  backgroundColor: '#FFE500',
                  color: '#111',
                }}
              >
                {status === 'submitting' ? 'Sending…' : 'Send message'}
              </button>
            </div>

          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
