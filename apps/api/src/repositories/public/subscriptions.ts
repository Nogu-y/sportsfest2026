import { eq } from 'drizzle-orm'
import { userSubscriptions } from '../../db/schema'
import { db } from '../../db/client'
import { toUnixTime } from '../../utils/dates'
import type { SubscriptionUpsertReq } from '../../schemas/public/subscriptions'

const mapSubscription = (row: typeof userSubscriptions.$inferSelect) => ({
  id: row.id,
  uuid: row.uuid,
  endpoint: row.endpoint,
  expirationTime: toUnixTime(row.expiration),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString()
})

const toExpirationDate = (value?: number | null) => {
  if (value == null) {
    return null
  }

  return new Date(value)
}

export const findSubscriptionByUuid = async (uuid: string) => {
  const [row] = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.uuid, uuid))
    .limit(1)

  if (!row) {
    return null
  }

  return mapSubscription(row)
}

export const createSubscription = async (input: SubscriptionUpsertReq
) => {
  const existing = await findSubscriptionByUuid(input.uuid)

  if (existing) {
    return null
  }

  const [row] = await db
    .insert(userSubscriptions)
    .values({
      uuid: input.uuid,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      expiration: toExpirationDate(input.expirationTime),
      updatedAt: new Date()
    })
    .returning()

  return mapSubscription(row)
}

export const updateSubscription = async (input: SubscriptionUpsertReq) => {
  const [row] = await db
    .update(userSubscriptions)
    .set({
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      expiration: toExpirationDate(input.expirationTime),
      updatedAt: new Date()
    })
    .where(eq(userSubscriptions.uuid, input.uuid))
    .returning()

  if (!row) {
    return null
  }

  return mapSubscription(row)
}
