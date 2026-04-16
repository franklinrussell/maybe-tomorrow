import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata = { title: 'Privacy Policy — Maybe Tomorrow' }

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

export default function PrivacyPage() {
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
            PRIVACY POLICY
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
            Short version: we collect as little as possible, we don't sell anything, and your tasks are yours.
          </P>

          <SectionHeader>What we collect</SectionHeader>
          <P>
            To create an account we ask for your email address. If you sign in with Google or GitHub, we also receive your name and profile picture from them — only to display in the app.
          </P>
          <P>
            We store the tasks you create — that's the whole product. We also collect basic usage data (error logs, page loads) so we can keep the app running and fix problems.
          </P>

          <SectionHeader>What we don't collect</SectionHeader>
          <P>
            No tracking pixels. No ad networks. No third-party analytics following you around the web. We don't sell, rent, or share your personal data with anyone — ever.
          </P>

          <SectionHeader>Your tasks</SectionHeader>
          <P>
            Your tasks are stored securely and only accessible to you. Nobody at Maybe Tomorrow reads your task list.
          </P>
          <P>
            One exception: the AI suggestion feature (powered by Claude, made by Anthropic) sends your task list to Anthropic's API to generate suggestions. Anthropic does not store your data or use it to train their models — this is covered by their API usage policy. If you don't use the AI feature, none of your tasks ever leave our database.
          </P>

          <SectionHeader>Cookies</SectionHeader>
          <P>
            We use a single session cookie to keep you logged in. That's the only cookie we set — no marketing cookies, no fingerprinting.
          </P>

          <SectionHeader>Data retention</SectionHeader>
          <P>
            Your data lives in our database for as long as your account exists. If you want to delete your account and everything in it, contact us and we'll handle it promptly.
          </P>

          <SectionHeader>Contact</SectionHeader>
          <P>
            Questions about privacy?{' '}
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
