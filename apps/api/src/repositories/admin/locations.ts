import { asc, eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { locations, maps } from '../../db/schema'
import type {
  CreateLocationRequest,
  UpdateLocationRequest,
} from '../../schemas/admin/locations'

export async function getLocations() {
  return await db.select().from(locations).orderBy(asc(locations.id))
}

export async function existsMap(mapId: number) {
  const [map] = await db
    .select({ id: maps.id })
    .from(maps)
    .where(eq(maps.id, mapId))
    .limit(1)

  return Boolean(map)
}

export async function createLocation(data: CreateLocationRequest) {
  const [newLocation] = await db.insert(locations).values(data).returning()
  return newLocation
}

export async function updateLocation(id: number, data: UpdateLocationRequest) {
  const [updatedLocation] = await db
    .update(locations)
    .set(data)
    .where(eq(locations.id, id))
    .returning()

  return updatedLocation ?? null
}

export async function deleteLocation(id: number) {
  const [deletedLocation] = await db
    .delete(locations)
    .where(eq(locations.id, id))
    .returning({ id: locations.id })

  return deletedLocation ?? null
}
