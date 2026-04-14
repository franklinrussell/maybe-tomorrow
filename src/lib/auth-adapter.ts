import type { Adapter, AdapterUser, AdapterAccount, AdapterSession, VerificationToken } from '@auth/core/adapters'
import { readUsers, updateUsers, readSessions, updateSessions, updateAuthMeta, readAuthMeta } from '@/lib/onejsonfile'
import { v4 as uuidv4 } from 'uuid'

function toAdapterUser(u: { id: string; email: string; name: string; image?: string }): AdapterUser {
  return { id: u.id, email: u.email, emailVerified: null, name: u.name, image: u.image ?? null }
}

export function OnejsonfileAdapter(): Adapter {
  return {
    async createUser(user) {
      const id = uuidv4()
      const now = new Date().toISOString()
      await updateUsers((d) => ({
        ...d,
        [id]: {
          id,
          email: user.email ?? '',
          name: user.name ?? '',
          image: user.image ?? undefined,
          provider: 'email' as const,
          createdAt: now,
        },
      }))
      return { id, email: user.email ?? '', emailVerified: user.emailVerified ?? null, name: user.name ?? null, image: user.image ?? null }
    },

    async getUser(id) {
      const doc = await readUsers()
      const u = doc[id]
      return u ? toAdapterUser(u) : null
    },

    async getUserByEmail(email) {
      const doc = await readUsers()
      const u = Object.values(doc).find((u) => u.email === email)
      return u ? toAdapterUser(u) : null
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const meta = await readAuthMeta()
      const account = meta.accounts[`${provider}:${providerAccountId}`]
      if (!account) return null
      const doc = await readUsers()
      const u = doc[account.userId]
      return u ? toAdapterUser(u) : null
    },

    async updateUser(user) {
      let result: AdapterUser | null = null
      await updateUsers((d) => {
        const existing = d[user.id]
        if (!existing) return d
        const updated = {
          ...existing,
          name: user.name ?? existing.name,
          image: user.image ?? existing.image,
        }
        result = toAdapterUser(updated)
        return { ...d, [user.id]: updated }
      })
      return result!
    },

    async linkAccount(account) {
      await updateAuthMeta((d) => ({
        ...d,
        accounts: {
          ...d.accounts,
          [`${account.provider}:${account.providerAccountId}`]: {
            userId: account.userId,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token as string | undefined,
            refresh_token: account.refresh_token as string | undefined,
            expires_at: account.expires_at as number | undefined,
            token_type: account.token_type as string | undefined,
            scope: account.scope as string | undefined,
            id_token: account.id_token as string | undefined,
          },
        },
      }))
      return account
    },

    async createSession(session) {
      await updateSessions((d) => ({
        ...d,
        [session.sessionToken]: {
          userId: session.userId,
          expires: session.expires.toISOString(),
        },
      }))
      return session
    },

    async getSessionAndUser(sessionToken) {
      const [sessionsDoc, usersDoc] = await Promise.all([readSessions(), readUsers()])
      const s = sessionsDoc[sessionToken]
      if (!s) return null
      const u = usersDoc[s.userId]
      if (!u) return null
      return {
        session: { sessionToken, userId: s.userId, expires: new Date(s.expires) },
        user: toAdapterUser(u),
      }
    },

    async updateSession({ sessionToken, expires }) {
      let result: AdapterSession | null = null
      await updateSessions((d) => {
        const s = d[sessionToken]
        if (!s) return d
        const newExpires = expires?.toISOString() ?? s.expires
        result = { sessionToken, userId: s.userId, expires: new Date(newExpires) }
        return { ...d, [sessionToken]: { ...s, expires: newExpires } }
      })
      return result
    },

    async deleteSession(sessionToken) {
      await updateSessions((d) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [sessionToken]: _, ...rest } = d
        return rest
      })
    },

    async createVerificationToken(token) {
      await updateAuthMeta((d) => ({
        ...d,
        verificationTokens: {
          ...d.verificationTokens,
          [`${token.identifier}:${token.token}`]: {
            identifier: token.identifier,
            token: token.token,
            expires: token.expires.toISOString(),
          },
        },
      }))
      return token
    },

    async useVerificationToken({ identifier, token }) {
      let found: VerificationToken | null = null
      await updateAuthMeta((d) => {
        const key = `${identifier}:${token}`
        const entry = d.verificationTokens[key]
        if (!entry) return d
        found = { identifier: entry.identifier, token: entry.token, expires: new Date(entry.expires) }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [key]: _, ...rest } = d.verificationTokens
        return { ...d, verificationTokens: rest }
      })
      return found
    },
  }
}
