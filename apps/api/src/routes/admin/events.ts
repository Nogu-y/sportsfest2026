import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from '@hono/zod-openapi'
import { getEvents, createEvent } from '../../repositories/admin/events'
import { EventSchema, CreateEventRequestSchema } from '../../schemas/admin/events'

const getEventsRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      description: 'イベント一覧を取得',
      content: {
        'application/json': {
          // 配列で返すことを明示
          schema: z.array(EventSchema),
        },
      },
    },
    500: {
      description: 'サーバーエラー発生',
      content: {
        'application/json': {
          schema: z.object({ message: z.string() })
        },
      },
    }
  },
});

const createEventsRoute = createRoute({
  method: 'post',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateEventRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: EventSchema,
        },
      },
      description: 'ユーザー作成成功',
    },
    500: {
      description: 'サーバーエラー'
    }
  },
});

export const adminEventsRoutes = new OpenAPIHono()
  // GET
  .openapi(getEventsRoute, async (c) => {
    try {
      const data = await getEvents()
      return c.json(data, 200)
    } catch (error) {
      console.error(error)
      return c.json({ message: 'データ取得に失敗しました'}, 500)
    }
  })
  // post
  .openapi(createEventsRoute, async (c) => {
    try {
      const body = c.req.valid('json')

      // db
      // await createEvent(body)

      const mockResponseData = {
        // それっぽくidを錬成(仮ID)
        id: Math.floor(Math.random() * 1000) + 1,
        ...body,
      }
      return c.json(mockResponseData,201)
    } catch (error) {
      console.error(error)
      return c.json({ message: '作成に失敗しました' })
    }
  })

export type AdminEventsRoutes = typeof adminEventsRoutes
