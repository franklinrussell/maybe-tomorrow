import Link from 'next/link'
import Logo from '@/components/Logo'

export function Footer() {
  return (
    <footer
      className="shrink-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800"
      style={{ padding: '14px 24px' }}
    >
      <div className="flex items-center justify-between gap-4">

        {/* Left: logo + wordmark + tagline */}
        <Link href="/" className="flex items-center gap-2 no-underline">
          <Logo size={22} />
          <span
            className="text-gray-900 dark:text-gray-100"
            style={{
              fontFamily: 'var(--font-bebas, sans-serif)',
              fontSize: '0.95rem',
              letterSpacing: '0.04em',
              lineHeight: 1,
            }}
          >
            MAYBE TOMORROW
          </span>
          <span
            className="text-gray-400 dark:text-gray-600"
            style={{
              fontFamily: 'var(--font-jakarta, sans-serif)',
              fontSize: '0.75rem',
              marginLeft: '4px',
            }}
          >
            Maybe.
          </span>
        </Link>

        {/* Right: nav links */}
        <nav className="flex items-center gap-5">
          {[
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
            { label: 'Support', href: '/support' },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-xs text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
            >
              {label}
            </Link>
          ))}
        </nav>

      </div>
    </footer>
  )
}
