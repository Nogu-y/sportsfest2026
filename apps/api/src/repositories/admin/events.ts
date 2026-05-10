import { events } from '../../db/schema'
import { db } from '../../db/client'
import { sampleData } from '../../db/data/sample/data'
import { eq } from 'drizzle-orm'

// return mock-data
export async function getEvents() {
  // return await db.select().from(events);
  return sampleData.events
}

export async function createEvent( data: typeof events.$inferInsert ) {
  await db.insert(events).values(data);
}

export async function updateEvent( id: number, data: Partial<typeof events.$inferInsert> ) {
  await db
    .update(events)
    .set(data)
    .where(eq(events.id, id))
}

export async function deleteEvent( id: number ) {
  await db
    .delete(events)
    .where(eq(events.id, id))
}

