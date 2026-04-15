import type { Metadata } from 'next'
import { Bebas_Neue, Plus_Jakarta_Sans } from 'next/font/google'
import { Providers } from '@/components/Providers'
import './globals.css'

const bebasNeue = Bebas_Neue({
  weight: '400',
  variable: '--font-bebas',
  subsets: ['latin'],
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  weight: ['400', '500', '600'],
  variable: '--font-jakarta',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Maybe Tomorrow',
  description: 'Not today.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${plusJakarta.variable}`} suppressHydrationWarning>
      <body
        className="antialiased bg-white dark:bg-gray-950"
        style={{ fontFamily: 'var(--font-jakarta, sans-serif)' }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
