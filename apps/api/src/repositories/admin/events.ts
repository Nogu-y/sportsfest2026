import { events } from '../../db/schema'
import { db } from '../../db/client'
import { sampleData } from '../../db/data/sample/data'
import { eq } from 'drizzle-orm'

// return mock-data

// 新しく配列としておいてやる
let mockDbEvents = [...sampleData.events]

export async function getEvents() {
  // return await db.select().from(events)
  //
  //
  // 以下mock処理
  return mockDbEvents
}

// --- POST: 新規作成 ---
export async function createEvent(data: typeof events.$inferInsert) {
  // const [newEvent] = await db.insert(events).values(data).returning()
  // return newEvent
  //
  //
  //
  // 以下mock処理
  // 現在の最大のIDを見つけて +1 する
  const maxId = mockDbEvents.reduce((max, event) => Math.max(max, event.id), 0)
  const newEvent = {
    id: maxId + 1,
    ...data
  } as any // ※モック用の一時的な型回避

  mockDbEvents.push(newEvent)


  return newEvent
}

// --- PUT: 部分更新 ---
export async function updateEvent(id: number, data: Partial<typeof events.$inferInsert>) {
  // const [updatedEvent] = await db
  //   .update(events)
  //   .set(data)
  //   .where(eq(events.id, id))
  //   .returning()
  //
  // return updatedEvent
  //
  //
  // 以下mock
  const index = mockDbEvents.findIndex((event) => event.id === id)
  if (index === -1) {
    return null
  }

  // 古いデータに新しいデータを上書き（部分更新の再現）
  mockDbEvents[index] = {
    ...mockDbEvents[index],
    ...data,
  } as any

  return mockDbEvents[index]
}

// --- DELETE: 削除 ---
export async function deleteEvent(id: number) {
  // await db.delete(events).where(eq(events.id, id))
  //
  //
  // 以下mock
  // 指定されたID以外の要素だけを残す
  mockDbEvents = mockDbEvents.filter((event) => event.id !== id)
}
