import type { Metadata } from 'next'
import { Bebas_Neue, Plus_Jakarta_Sans } from 'next/font/google'
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
  title: 'Not Today',
  description: 'The brutally honest task manager',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${plusJakarta.variable} h-full`}>
      <body
        className="h-full antialiased"
        style={{ backgroundColor: '#FAFAF7', fontFamily: 'var(--font-jakarta, sans-serif)' }}
      >
        {children}
      </body>
    </html>
  )
}
