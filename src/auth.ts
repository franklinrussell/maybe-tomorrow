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

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: OnejsonfileAdapter(),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Nodemailer({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
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
