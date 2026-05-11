import { OpenAPIHono } from '@hono/zod-openapi'
import {
  getEventsRoute,
  createEventRoute,
  updateEventRoute,
  deleteEventRoute,
} from '../../schemas/admin/events'
import { getEvents, createEvent, updateEvent, deleteEvent } from '../../repositories/admin/events'

export const adminEventsRoutes = new OpenAPIHono()
  .openapi(getEventsRoute, async (c) => {
    try {
      const data = await getEvents()
      return c.json(data, 200)
    } catch (error) {
      console.error(error)
      return c.json({ message: 'イベントの取得に失敗しました' }, 500)
    }
  })

  // --- POST ---
  .openapi(createEventRoute, async (c) => {
    try {
      const body = c.req.valid('json')

      // DBに保存し、採番されたID付きのデータを取得
      const newEvent = await createEvent(body)

      return c.json(newEvent, 201)
    } catch (error) {
      console.error(error)
      return c.json({ message: 'イベントの作成に失敗しました' }, 500)
    }
  })

  // --- PUT ---
  .openapi(updateEventRoute, async (c) => {
    try {
      const { id } = c.req.valid('param')
      const body = c.req.valid('json')

      // DBを部分更新
      const updatedEvent = await updateEvent(id, body)

      // 対象のIDが存在しなかった場合
      if (!updatedEvent) {
        return c.json({ message: 'イベントが見つかりません' }, 404)
      }

      return c.json(updatedEvent, 200)
    } catch (error) {
      console.error(error)
      return c.json({ message: 'イベントの更新に失敗しました' }, 500)
    }
  })

  // --- DELETE ---
  .openapi(deleteEventRoute, async (c) => {
    try {
      const { id } = c.req.valid('param')

      // DBから削除
      await deleteEvent(id)

      return c.body(null, 204)
    } catch (error) {
      console.error(error)
      return c.json({ message: 'イベントの削除に失敗しました' }, 500)
    }
  })


export type AdminEventsRoutes = typeof adminEventsRoutes
