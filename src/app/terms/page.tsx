import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata = { title: 'Terms of Service — Maybe Tomorrow' }

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-10 mb-3">
      <h2
        className="text-gray-900 dark:text-gray-100 leading-none"
        style={{
          fontFamily: 'var(--font-bebas, sans-serif)',
          fontSize: '1.45rem',
          letterSpacing: '0.03em',
        }}
      >
        {children}
      </h2>
      <div
        className="mt-1 rounded-full"
        style={{ height: '3px', width: '2rem', backgroundColor: '#FFE500' }}
      />
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3"
      style={{ fontFamily: 'var(--font-jakarta, sans-serif)', fontSize: '0.9375rem' }}
    >
      {children}
    </p>
  )
}

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
      <Header />

      <main className="flex-1 px-6 py-14">
        <div className="max-w-2xl mx-auto">

          <h1
            className="text-gray-900 dark:text-gray-100 leading-none"
            style={{
              fontFamily: 'var(--font-bebas, sans-serif)',
              fontSize: '3rem',
              letterSpacing: '0.02em',
            }}
          >
            TERMS OF SERVICE
          </h1>
          <div
            className="mt-1.5 rounded-full"
            style={{ height: '3px', width: '3.5rem', backgroundColor: '#FFE500' }}
          />
          <p
            className="text-xs text-gray-400 mt-3 mb-10"
            style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
          >
            Last updated: April 2026
          </p>

          <P>
            Plain English version: this is an early beta, use it for free, be reasonable, your stuff is yours.
          </P>

          <SectionHeader>Beta software</SectionHeader>
          <P>
            Maybe Tomorrow is an early beta product, provided free of charge. That means it's a work in progress — there will be bugs, things will break, and we make no guarantees about uptime or data persistence. Don't use it as your only system for anything truly critical.
          </P>

          <SectionHeader>Use at your own risk</SectionHeader>
          <P>
            We're not responsible for lost tasks, unexpected downtime, or bugs. If something important is at stake, keep a backup somewhere else. We'll do our best to keep things running, but we can't promise perfection.
          </P>

          <SectionHeader>Acceptable use</SectionHeader>
          <P>
            Use Maybe Tomorrow to manage your tasks. Don't try to abuse the service, probe for vulnerabilities, or use it for anything illegal. If you're doing something you'd be embarrassed to explain to us, don't do it.
          </P>

          <SectionHeader>It's free (for now)</SectionHeader>
          <P>
            Maybe Tomorrow is currently free. We reserve the right to introduce pricing in the future — if we do, we'll give you reasonable advance notice so you can decide whether to stick around.
          </P>

          <SectionHeader>Your content is yours</SectionHeader>
          <P>
            The tasks you create belong to you. We don't claim any ownership over your content, and we won't use it for anything beyond running the service.
          </P>

          <SectionHeader>Account termination</SectionHeader>
          <P>
            We reserve the right to suspend or terminate accounts that abuse the service. We'd rather not — we'll only do it if we really have to.
          </P>

          <SectionHeader>The service may change</SectionHeader>
          <P>
            We might add features, remove features, or shut the whole thing down someday. We'll do our best to give reasonable notice if anything significant changes.
          </P>

          <SectionHeader>Governing law</SectionHeader>
          <P>
            These terms are governed by the laws of the Commonwealth of Massachusetts.
          </P>

          <SectionHeader>Contact</SectionHeader>
          <P>
            Questions or concerns?{' '}
            <Link
              href="/support"
              className="text-gray-900 dark:text-gray-100 underline underline-offset-2 hover:text-yellow-500 transition-colors"
            >
              Contact support.
            </Link>
          </P>

        </div>
      </main>

      <Footer />
    </div>
  )
}
