import Link from 'next/link'

export const metadata = { title: 'Privacy Policy — No, Not Today' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-8 inline-block">← Back</Link>
        <h1 style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: '2.5rem', letterSpacing: '0.04em' }} className="mb-4">PRIVACY POLICY</h1>
        <p className="text-gray-400 text-sm">Coming soon.</p>
      </div>
    </div>
  )
}
