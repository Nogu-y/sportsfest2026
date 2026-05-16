import { and, count, eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { staffAccounts } from '../../db/schema'
import { createPasswordHash, verifyPasswordHash } from '../../utils/auth'

export type AuthAccountRole = 'ADMIN' | 'STAFF'

export type AccountSummary = {
  id: number
  loginId: string
  displayName: string
  role: AuthAccountRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// CLI で扱いやすいよう、日時を文字列化した要約形式へ揃える。
const mapAccountSummary = (row: typeof staffAccounts.$inferSelect): AccountSummary => ({
  id: row.id,
  loginId: row.loginId,
  displayName: row.displayName,
  role: row.role,
  isActive: row.isActive,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString()
})

// 最後の有効な ADMIN を消さないための保護に使う。
const countActiveAdmins = async () => {
  const [row] = await db
    .select({ value: count() })
    .from(staffAccounts)
    .where(and(eq(staffAccounts.role, 'ADMIN'), eq(staffAccounts.isActive, true)))

  return row?.value ?? 0
}

export const hasActiveAdminAccount = async () => {
  const activeAdminCount = await countActiveAdmins()
  return activeAdminCount > 0
}

export const listAuthAccounts = async () => {
  const rows = await db.select().from(staffAccounts)

  return rows
    .map(mapAccountSummary)
    .sort((left, right) => left.loginId.localeCompare(right.loginId))
}

export const findAuthAccountByLoginId = async (loginId: string) => {
  const [row] = await db
    .select()
    .from(staffAccounts)
    .where(eq(staffAccounts.loginId, loginId))
    .limit(1)

  return row ?? null
}

// CLI の通常操作は有効な ADMIN の認証を通した場合のみ許可する。
export const authenticateAdminAccount = async (loginId: string, password: string) => {
  const account = await findAuthAccountByLoginId(loginId)

  if (!account || !account.isActive || account.role !== 'ADMIN') {
    return null
  }

  const isValidPassword = await verifyPasswordHash(password, account.passwordHash)

  if (!isValidPassword) {
    return null
  }

  return mapAccountSummary(account)
}

export const createAuthAccount = async (input: {
  loginId: string
  displayName: string
  role: AuthAccountRole
  password: string
}) => {
  const passwordHash = await createPasswordHash(input.password)

  const [row] = await db
    .insert(staffAccounts)
    .values({
      loginId: input.loginId,
      displayName: input.displayName,
      role: input.role,
      passwordHash,
      isActive: true
    })
    .returning()

  return mapAccountSummary(row)
}

export const updateAuthAccountPassword = async (loginId: string, password: string) => {
  const existing = await findAuthAccountByLoginId(loginId)

  if (!existing) {
    return null
  }

  const passwordHash = await createPasswordHash(password)
  const [row] = await db
    .update(staffAccounts)
    .set({
      passwordHash,
      updatedAt: new Date()
    })
    .where(eq(staffAccounts.id, existing.id))
    .returning()

  return mapAccountSummary(row)
}

export const updateAuthAccountRole = async (loginId: string, role: AuthAccountRole) => {
  const existing = await findAuthAccountByLoginId(loginId)

  if (!existing) {
    return { error: 'not_found' as const }
  }

  if (existing.role === 'ADMIN' && role !== 'ADMIN' && existing.isActive) {
    const activeAdminCount = await countActiveAdmins()

    if (activeAdminCount <= 1) {
      return { error: 'last_active_admin' as const }
    }
  }

  const [row] = await db
    .update(staffAccounts)
    .set({
      role,
      updatedAt: new Date()
    })
    .where(eq(staffAccounts.id, existing.id))
    .returning()

  return { account: mapAccountSummary(row) }
}

export const updateAuthAccountActiveState = async (loginId: string, isActive: boolean) => {
  const existing = await findAuthAccountByLoginId(loginId)

  if (!existing) {
    return { error: 'not_found' as const }
  }

  if (existing.role === 'ADMIN' && existing.isActive && !isActive) {
    const activeAdminCount = await countActiveAdmins()

    if (activeAdminCount <= 1) {
      return { error: 'last_active_admin' as const }
    }
  }

  const [row] = await db
    .update(staffAccounts)
    .set({
      isActive,
      updatedAt: new Date()
    })
    .where(eq(staffAccounts.id, existing.id))
    .returning()

  return { account: mapAccountSummary(row) }
}

export const deleteAuthAccount = async (loginId: string) => {
  const existing = await findAuthAccountByLoginId(loginId)

  if (!existing) {
    return { error: 'not_found' as const }
  }

  if (existing.role === 'ADMIN' && existing.isActive) {
    const activeAdminCount = await countActiveAdmins()

    if (activeAdminCount <= 1) {
      return { error: 'last_active_admin' as const }
    }
  }

  const [row] = await db
    .delete(staffAccounts)
    .where(eq(staffAccounts.id, existing.id))
    .returning()

  return { account: mapAccountSummary(row) }
}
