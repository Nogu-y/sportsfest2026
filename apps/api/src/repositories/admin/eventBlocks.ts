import { asc, eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { eventBlocks, events } from '../../db/schema'

export async function getEventBlocks() {
  return await db.select().from(eventBlocks).orderBy(asc(eventBlocks.id))
}

export async function existsEvent(eventId: number) {
  const [event] = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1)

  return Boolean(event)
}

export async function createEventBlock(data: typeof eventBlocks.$inferInsert) {
  const [newEventBlock] = await db.insert(eventBlocks).values(data).returning()
  return newEventBlock
}

export async function updateEventBlock(id: number, data: Partial<typeof eventBlocks.$inferInsert>) {
  const [updatedEventBlock] = await db
    .update(eventBlocks)
    .set(data)
    .where(eq(eventBlocks.id, id))
    .returning()

  return updatedEventBlock
}

export async function deleteEventBlock(id: number) {
  const [deletedEventBlock] = await db
    .delete(eventBlocks)
    .where(eq(eventBlocks.id, id))
    .returning({ id: eventBlocks.id })

  return deletedEventBlock ?? null
}
