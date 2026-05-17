import { and, eq, gt } from 'drizzle-orm'
import { db } from '../../db/client'
import { staffAccounts, staffSessions } from '../../db/schema'
import {
  createSessionExpiresAt,
  generateSessionToken,
  hashSessionToken,
  verifyPasswordHash
} from '../../utils/auth'
import { toIsoString } from '../../utils/dates'

type AuthError = 'invalid_credentials' | 'invalid_session'

// DB の内部表現を API レスポンス用の公開形式へ変換する。
const mapAccount = (row: typeof staffAccounts.$inferSelect) => ({
  id: row.id,
  loginId: row.loginId,
  displayName: row.displayName,
  role: row.role
})

const mapSessionResponse = (
  row: typeof staffAccounts.$inferSelect,
  expiresAt: Date
) => ({
  authenticated: true as const,
  account: mapAccount(row),
  expiresAt: toIsoString(expiresAt)!
})

// 無効化されたアカウントではログインできないようにする。
const findActiveAccountByLoginId = async (loginId: string) => {
  const [row] = await db
    .select()
    .from(staffAccounts)
    .where(and(eq(staffAccounts.loginId, loginId), eq(staffAccounts.isActive, true)))
    .limit(1)

  return row ?? null
}

export const createAuthSession = async (accountId: number) => {
  // クライアントへ返す生トークンと、DB に保存するハッシュを分ける。
  const token = generateSessionToken()
  const tokenHash = hashSessionToken(token)
  const expiresAt = createSessionExpiresAt()

  await db.insert(staffSessions).values({
    staffAccountId: accountId,
    tokenHash,
    expiresAt
  })

  return {
    token,
    expiresAt
  }
}

export const loginAccount = async (loginId: string, password: string) => {
  // ログイン失敗理由は分けず、認証情報の誤りとして扱う。
  const account = await findActiveAccountByLoginId(loginId)

  if (!account) {
    return { error: 'invalid_credentials' as AuthError }
  }

  const isValidPassword = await verifyPasswordHash(password, account.passwordHash)

  if (!isValidPassword) {
    return { error: 'invalid_credentials' as AuthError }
  }

  const session = await createAuthSession(account.id)

  return {
    ...mapSessionResponse(account, session.expiresAt),
    token: session.token
  }
}

export const getAuthSession = async (token: string) => {
  const tokenHash = hashSessionToken(token)
  const now = new Date()

  // 期限切れ・無効化済みアカウントのセッションはここで弾く。
  const [row] = await db
    .select({
      sessionId: staffSessions.id,
      expiresAt: staffSessions.expiresAt,
      account: staffAccounts
    })
    .from(staffSessions)
    .innerJoin(staffAccounts, eq(staffSessions.staffAccountId, staffAccounts.id))
    .where(
      and(
        eq(staffSessions.tokenHash, tokenHash),
        gt(staffSessions.expiresAt, now),
        eq(staffAccounts.isActive, true)
      )
    )
    .limit(1)

  if (!row) {
    return { error: 'invalid_session' as AuthError }
  }

  // 利用記録として最終アクセス時刻を更新する。
  await db
    .update(staffSessions)
    .set({
      lastSeenAt: now
    })
    .where(eq(staffSessions.id, row.sessionId))

  return mapSessionResponse(row.account, row.expiresAt)
}

export const deleteAuthSession = async (token: string) => {
  // ログアウト時は該当セッションだけを削除する。
  await db
    .delete(staffSessions)
    .where(eq(staffSessions.tokenHash, hashSessionToken(token)))
}
