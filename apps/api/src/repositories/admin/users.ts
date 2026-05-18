import { and, count, eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { staffAccounts } from '../../db/schema'
import { createPasswordHash } from '../../utils/auth'

export type AdminUserSummary = {
  id: number
  loginId: string
  displayName: string
  role: 'ADMIN' | 'STAFF'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const mapUser = (row: typeof staffAccounts.$inferSelect): AdminUserSummary => ({
  id: row.id,
  loginId: row.loginId,
  displayName: row.displayName,
  role: row.role,
  isActive: row.isActive,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

const countActiveAdmins = async () => {
  const [row] = await db
    .select({ value: count() })
    .from(staffAccounts)
    .where(and(eq(staffAccounts.role, 'ADMIN'), eq(staffAccounts.isActive, true)))

  return row?.value ?? 0
}

export async function getUsers() {
  const rows = await db.select().from(staffAccounts)
  return rows.map(mapUser).sort((a, b) => a.loginId.localeCompare(b.loginId))
}

export async function createUser(input: {
  loginId: string
  displayName: string
  role: 'ADMIN' | 'STAFF'
  password: string
  isActive: boolean
}) {
  const passwordHash = await createPasswordHash(input.password)
  const [row] = await db
    .insert(staffAccounts)
    .values({
      loginId: input.loginId,
      displayName: input.displayName,
      role: input.role,
      passwordHash,
      isActive: input.isActive,
    })
    .returning()

  return mapUser(row)
}

export async function updateUser(
  id: number,
  input: {
    displayName?: string
    role?: 'ADMIN' | 'STAFF'
    isActive?: boolean
    password?: string
  },
) {
  const [existing] = await db.select().from(staffAccounts).where(eq(staffAccounts.id, id)).limit(1)
  if (!existing) return { error: 'not_found' as const }

  const nextRole = input.role ?? existing.role
  const nextIsActive = input.isActive ?? existing.isActive
  const isDowngradingActiveAdmin =
    existing.role === 'ADMIN' &&
    existing.isActive &&
    (nextRole !== 'ADMIN' || nextIsActive !== true)

  if (isDowngradingActiveAdmin) {
    const activeAdminCount = await countActiveAdmins()
    if (activeAdminCount <= 1) {
      return { error: 'last_active_admin' as const }
    }
  }

  const passwordHash = input.password
    ? await createPasswordHash(input.password)
    : existing.passwordHash

  const [updated] = await db
    .update(staffAccounts)
    .set({
      displayName: input.displayName ?? existing.displayName,
      role: nextRole,
      isActive: nextIsActive,
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(staffAccounts.id, id))
    .returning()

  return { user: mapUser(updated) }
}

export async function deleteUser(id: number) {
  const [existing] = await db.select().from(staffAccounts).where(eq(staffAccounts.id, id)).limit(1)
  if (!existing) return { error: 'not_found' as const }

  if (existing.role === 'ADMIN' && existing.isActive) {
    const activeAdminCount = await countActiveAdmins()
    if (activeAdminCount <= 1) {
      return { error: 'last_active_admin' as const }
    }
  }

  await db.delete(staffAccounts).where(eq(staffAccounts.id, id))
  return { ok: true as const }
}
