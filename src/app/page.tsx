import { auth } from '@/auth'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default async function LandingPage() {
  const session = await auth().catch(() => null)

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">

      <Header />

      {/* ── HERO ── */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-32 text-center">
        <div
          className="mb-3"
          style={{
            fontFamily: 'var(--font-bebas, sans-serif)',
            fontSize: 'clamp(3.5rem, 10vw, 7rem)',
            letterSpacing: '0.02em',
            lineHeight: 1,
            color: 'inherit',
          }}
        >
          MAYBE TOMORROW
        </div>

        <p
          className="mb-10"
          style={{
            fontFamily: 'var(--font-jakarta, sans-serif)',
            fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
            fontWeight: 400,
            color: '#9CA3AF',
          }}
        >
          Maybe.
        </p>

        {session ? (
          <Link
            href="/tasks"
            className="inline-flex items-center rounded-xl px-7 py-3 font-semibold text-sm transition-opacity hover:opacity-85 active:scale-[0.98]"
            style={{ backgroundColor: '#FFE500', color: '#111', fontFamily: 'var(--font-jakarta, sans-serif)' }}
          >
            Get going
          </Link>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center rounded-xl px-7 py-3 font-semibold text-sm transition-opacity hover:opacity-85 active:scale-[0.98]"
            style={{ backgroundColor: '#FFE500', color: '#111', fontFamily: 'var(--font-jakarta, sans-serif)' }}
          >
            Get started today or tomorrow
          </Link>
        )}
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-center mb-12 text-gray-900 dark:text-gray-100"
            style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: '2rem', letterSpacing: '0.04em' }}
          >
            HOW IT WORKS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { n: '01', title: 'Add your tasks', body: "Dump everything into Today or Not Today. No categories. No friction." },
              { n: '02', title: 'Eliminate the noise', body: "Blow up one or all of the tasks you're not doing today." },
              { n: '03', title: 'Actually focus', body: "Today only has what you're actually doing. Everything else is...Maybe Tomorrow." },
            ].map(({ n, title, body }) => (
              <div key={n} className="flex flex-col gap-2">
                <div style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: '2.5rem', color: '#FFE500', lineHeight: 1 }}>{n}</div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 px-6 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-center mb-12 text-gray-900 dark:text-gray-100"
            style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: '2rem', letterSpacing: '0.04em' }}
          >
            WHY IT WORKS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="5" width="16" height="2" rx="1" fill="currentColor" />
                    <rect x="2" y="13" width="16" height="2" rx="1" fill="currentColor" />
                  </svg>
                ),
                title: 'Two lists, just two lists',
                body: 'Today and Not Today. No overloaded backlog. Just radical focus.',
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polyline points="3,6 7,10 3,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="8,6 12,10 8,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="13,6 17,10 13,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: 'The sweep button',
                body: 'Blow up your whole Today list in one cathartic click.',
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 2 L10 6 M10 14 L10 18 M2 10 L6 10 M14 10 L18 10 M4.93 4.93 L7.76 7.76 M12.24 12.24 L15.07 15.07 M15.07 4.93 L12.24 7.76 M7.76 12.24 L4.93 15.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ),
                title: 'Motivation & Mockery',
                body: 'Feedback you didn\'t ask for.',
              },
            ].map(({ icon, title, body }) => (
              <div
                key={title}
                className="relative rounded-xl p-5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex flex-col items-start text-left"
              >
                <div className="mb-3 text-gray-900 dark:text-gray-100">{icon}</div>
                <h3 className="font-semibold text-sm mb-1 text-gray-900 dark:text-gray-100">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

    </div>
  )
}
