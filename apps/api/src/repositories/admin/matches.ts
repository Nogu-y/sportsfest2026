import { eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { matchPlans } from '../../db/schema'

export async function getMatch() {
  const matches = await db.select().from(matchPlans)

  return matches.map((match) => ({
    ...match,
    participants: [],
  }))
}

export const createMatch = async (data: any) => {
  const [newMatch] = await db.insert(matchPlans).values(data).returning()
  return newMatch
}

export const updateMatch = async (id: number, data: any) => {
  const [updatedMatch] = await db
    .update(matchPlans)
    .set(data)
    .where(eq(matchPlans.id, id))
    .returning()
  return updatedMatch
}

export const deleteMatch = async (id: number) => {
  await db.delete(matchPlans).where(eq(matchPlans.id, id))
}
