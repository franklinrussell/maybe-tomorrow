import { User } from '@/types'

// Temporary auth bypass for development — replace with real NextAuth session later
export const DEV_USER: User = {
  id: 'dev-user-001',
  email: 'dev@nottoday.app',
  name: 'Dev User',
  provider: 'github',
  createdAt: new Date().toISOString(),
}

export const DEV_USER_ID = DEV_USER.id
