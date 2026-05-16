import { and, asc, eq, inArray } from 'drizzle-orm'
import { db } from '../../db/client'
import { matchPlans, userSubscriptions, watchlists } from '../../db/schema'

type WatchlistMutationError = 'subscription_not_found' | 'match_not_found'

const mapWatchlist = (uuid: string, matchPlanIds: number[]) => ({
  uuid,
  matchPlanIds
})

// uuidからidを引く
const findSubscriptionByUuid = async (uuid: string) => {
  const [row] = await db
    .select({
      id: userSubscriptions.id,
      uuid: userSubscriptions.uuid
    })
    .from(userSubscriptions)
    .where(eq(userSubscriptions.uuid, uuid))
    .limit(1)

  if (!row) return null
  return row
}

const listWatchlistMatchIds = async (subscriptionId: number) => {
  const rows = await db
    .select({
      matchPlanId: watchlists.matchPlanId
    })
    .from(watchlists)
    .where(eq(watchlists.userSubscriptionId, subscriptionId))
    .orderBy(asc(watchlists.matchPlanId))

  return rows.map((row) => row.matchPlanId)
}

// 存在しない試合を抽出して返す
const findMissingMatchPlanIds = async (matchPlanIds: number[]) => {
  if (matchPlanIds.length === 0) return []

  const rows = await db
    .select({
      id: matchPlans.id
    })
    .from(matchPlans)
    .where(inArray(matchPlans.id, matchPlanIds))

  const existingIds = new Set(rows.map((row) => row.id))

  return matchPlanIds.filter((matchPlanId) => !existingIds.has(matchPlanId))
}

//配列の中の重複を取り除いて、昇順に並べる
const deduplicateMatchPlanIds = (matchPlanIds: number[]) => {
  return [...new Set(matchPlanIds)].sort((left, right) => left - right)
}



export const getWatchlist = async (uuid: string) => {
  const subscription = await findSubscriptionByUuid(uuid)

  if (!subscription) return { error: 'subscription_not_found' as WatchlistMutationError }

  return mapWatchlist(
    subscription.uuid,
    await listWatchlistMatchIds(subscription.id)
  )
}



export const addWatchlistMatch = async (uuid: string, matchPlanIds: number[]) => {
  const subscription = await findSubscriptionByUuid(uuid)

  if (!subscription) return { error: 'subscription_not_found' as WatchlistMutationError }

  const uniqueMatchPlanIds = deduplicateMatchPlanIds(matchPlanIds)
  const missingMatchIds = await findMissingMatchPlanIds(uniqueMatchPlanIds)

  if (missingMatchIds.length > 0) return { error: 'match_not_found' as WatchlistMutationError }

  if (uniqueMatchPlanIds.length > 0) {
    await db
      .insert(watchlists)
      .values(
        uniqueMatchPlanIds.map((matchPlanId) => ({
          userSubscriptionId: subscription.id,
          matchPlanId
        }))
      )
      .onConflictDoNothing()
  }

  return mapWatchlist(
    subscription.uuid,
    await listWatchlistMatchIds(subscription.id)
  )
}



export const deleteWatchlistMatch = async (uuid: string, matchPlanIds: number[]) => {
  const subscription = await findSubscriptionByUuid(uuid)

  if (!subscription) return { error: 'subscription_not_found' as WatchlistMutationError }

  const uniqueMatchPlanIds = deduplicateMatchPlanIds(matchPlanIds)

  if (uniqueMatchPlanIds.length > 0) {
    await db
      .delete(watchlists)
      .where(
        and(
          eq(watchlists.userSubscriptionId, subscription.id),
          inArray(watchlists.matchPlanId, uniqueMatchPlanIds)
        )
      )
  }

  return mapWatchlist(
    subscription.uuid,
    await listWatchlistMatchIds(subscription.id)
  )
}
