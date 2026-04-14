import { auth } from '@/auth'
import { DEV_USER_ID } from '@/lib/dev-user'

/**
 * Returns the authenticated user's ID from the session.
 * In development with no session, falls back to DEV_USER_ID.
 * Returns null in production with no session (caller should 401).
 */
export async function getUserId(): Promise<string | null> {
  try {
    const session = await auth()
    if (session?.user?.id) return session.user.id
  } catch {
    // auth() may throw if NEXTAUTH_SECRET is not configured yet
  }
  if (process.env.NODE_ENV === 'development') return DEV_USER_ID
  return null
}
