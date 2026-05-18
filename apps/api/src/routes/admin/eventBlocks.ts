import { OpenAPIHono } from '@hono/zod-openapi'
import {
  createEventBlockRoute,
  deleteEventBlockRoute,
  getEventBlocksRoute,
  updateEventBlockRoute,
} from '../../schemas/admin/eventBlocks'
import {
  createEventBlock,
  deleteEventBlock,
  existsEvent,
  getEventBlocks,
  updateEventBlock,
} from '../../repositories/admin/eventBlocks'

export const adminEventBlocksRoutes = new OpenAPIHono()
  .openapi(getEventBlocksRoute, async (c) => {
    try {
      const data = await getEventBlocks()
      return c.json(data, 200)
    } catch (error) {
      console.error(error)
      return c.json({ message: 'イベントブロックの取得に失敗しました' }, 500)
    }
  })

  .openapi(createEventBlockRoute, async (c) => {
    try {
      const body = c.req.valid('json')

      if (!(await existsEvent(body.eventId))) {
        return c.json({ message: '紐づけ先のイベントが見つかりません' }, 404)
      }

      const newEventBlock = await createEventBlock(body)
      return c.json(newEventBlock, 201)
    } catch (error) {
      console.error(error)
      return c.json({ message: 'イベントブロックの作成に失敗しました' }, 500)
    }
  })

  .openapi(updateEventBlockRoute, async (c) => {
    try {
      const { id } = c.req.valid('param')
      const body = c.req.valid('json')

      if (body.eventId !== undefined && !(await existsEvent(body.eventId))) {
        return c.json({ message: '紐づけ先のイベントが見つかりません' }, 404)
      }

      const updatedEventBlock = await updateEventBlock(id, body)

      if (!updatedEventBlock) {
        return c.json({ message: 'イベントブロックが見つかりません' }, 404)
      }

      return c.json(updatedEventBlock, 200)
    } catch (error) {
      console.error(error)
      return c.json({ message: 'イベントブロックの更新に失敗しました' }, 500)
    }
  })

  .openapi(deleteEventBlockRoute, async (c) => {
    try {
      const { id } = c.req.valid('param')
      const deletedEventBlock = await deleteEventBlock(id)

      if (!deletedEventBlock) {
        return c.json({ message: 'イベントブロックが見つかりません' }, 404)
      }

      return c.body(null, 204)
    } catch (error) {
      console.error(error)
      return c.json({ message: 'イベントブロックの削除に失敗しました' }, 500)
    }
  })

export type AdminEventBlocksRoutes = typeof adminEventBlocksRoutes
