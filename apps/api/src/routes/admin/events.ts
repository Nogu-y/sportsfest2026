import { OpenAPIHono } from '@hono/zod-openapi'
import { getEvents } from '../../repositories/admin/events'

export const adminEventsRoutes = new OpenAPIHono()

// 少し見やすく
adminEventsRoutes.get( '/', async (c) => {
  try {
    const data = await getEvents()
    return c.json(data, 200)
  } catch (error) {
    console.error(error)

    return c.json({
      message: 'データ取得に失敗しました'
    }, 500)
  }
})

