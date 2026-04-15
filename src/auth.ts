import NextAuth, { type DefaultSession } from 'next-auth'
import Google from 'next-auth/providers/google'
import Nodemailer from 'next-auth/providers/nodemailer'
import { OnejsonfileAdapter } from '@/lib/auth-adapter'
import { updateTasks, readTasks } from '@/lib/onejsonfile'
import { v4 as uuidv4 } from 'uuid'
import type { Task } from '@/types'

declare module 'next-auth' {
  interface Session {
    user: { id: string } & DefaultSession['user']
  }
}

async function initUserTasks(userId: string) {
  const doc = await readTasks()
  if (doc[userId]?.length) return // already seeded
  const now = new Date().toISOString()
  const seed: Task[] = [
    {
      id: uuidv4(), userId, title: 'Try out Not Today',
      state: 'in_progress', list: 'today', order: 0,
      blownUpCount: 0, createdAt: now, updatedAt: now,
    },
    {
      id: uuidv4(), userId, title: 'Add your first real task',
      state: 'not_started', list: 'today', order: 1,
      blownUpCount: 0, createdAt: now, updatedAt: now,
    },
    {
      id: uuidv4(), userId, title: 'Things you keep avoiding',
      state: 'not_started', list: 'not_today', order: 0,
      blownUpCount: 1, createdAt: now, updatedAt: now,
    },
  ]
  await updateTasks((d) => ({ ...d, [userId]: seed }))
}

const emailServer = process.env.EMAIL_SERVER
const emailFrom = process.env.EMAIL_FROM

console.log('[auth] EMAIL_SERVER:', emailServer
  ? emailServer.replace(/:([^@]+)@/, ':***@')
  : 'NOT SET')
console.log('[auth] EMAIL_FROM:', emailFrom ?? 'NOT SET')


export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: OnejsonfileAdapter(),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Nodemailer({
      server: emailServer,
      from: emailFrom,
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        console.log('[auth] sendVerificationRequest called')
        console.log('[auth]   to:', identifier)
        console.log('[auth]   url:', url)
        console.log('[auth]   server:', typeof provider.server === 'string'
          ? provider.server.replace(/:([^@]+)@/, ':***@')
          : JSON.stringify(provider.server))
        console.log('[auth]   from:', provider.from)

        // Use nodemailer directly so we can catch and log the error
        const nodemailer = await import('nodemailer')
        const transport = nodemailer.default.createTransport(provider.server as string)
        try {
          const info = await transport.sendMail({
            to: identifier,
            from: `Maybe Tomorrow <${provider.from}>`,
            subject: 'Your Maybe Tomorrow sign in link',
            text: `Sign in: ${url}\n\nThis link expires in 24 hours.`,
            html: `<p>Click to sign in to <strong>Maybe Tomorrow</strong>:</p><p><a href="${url}">${url}</a></p><p>This link expires in 24 hours.</p>`,
          })
          console.log('[auth] email sent OK, messageId:', info.messageId)
        } catch (err) {
          console.error('[auth] email send FAILED:', err)
          throw err
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id) await initUserTasks(user.id)
    },
  },
})
