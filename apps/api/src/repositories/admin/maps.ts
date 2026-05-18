import { asc, eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { maps } from '../../db/schema'
import type {
  CreateMapRequest,
  UpdateMapRequest,
} from '../../schemas/admin/maps'

export async function getMaps() {
  return await db.select().from(maps).orderBy(asc(maps.id))
}

export async function createMap(data: CreateMapRequest) {
  const [newMap] = await db.insert(maps).values(data).returning()
  return newMap
}

export async function updateMap(id: number, data: UpdateMapRequest) {
  const [updatedMap] = await db
    .update(maps)
    .set(data)
    .where(eq(maps.id, id))
    .returning()

  return updatedMap ?? null
}

export async function deleteMap(id: number) {
  const [deletedMap] = await db
    .delete(maps)
    .where(eq(maps.id, id))
    .returning({ id: maps.id })

  return deletedMap ?? null
}
