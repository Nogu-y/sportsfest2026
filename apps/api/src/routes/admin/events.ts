import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from '@hono/zod-openapi'
import { getEvents, createEvent, updateEvent, deleteEvent } from '../../repositories/admin/events'
import { EventSchema, CreateEventRequestSchema, EventIdParamSchema, UpdateEventRequestSchema } from '../../schemas/admin/events'

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
      description: '作成成功',
    },
    500: {
      description: 'サーバーエラー'
    }
  },
});

const updateEventRoute = createRoute({
  method: 'put',
  path: '/{id}',
  request: {
    params: EventIdParamSchema,
    body: {
      content: { 'application/json': { schema: UpdateEventRequestSchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: EventSchema } },
      description: 'イベントの更新に成功',
    },
    500: {
      description: 'バリデーションエラー'
    },
  },
})

const deleteEventRoute = createRoute({
  method: 'delete',
  path: '/{id}', // 削除する対象のID
  request: {
    params: EventIdParamSchema,
  },
  responses: {
    204: { description: 'イベントの削除に成功 (No Content)' },
    500: { description: 'サーバーエラー' },
  },
})

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
        // それっぽくidを錬成(仮IDを作成する)
        id: Math.floor(Math.random() * 1000) + 1,
        ...body,
      }
      return c.json(mockResponseData,201)
    } catch (error) {
      console.error(error)
      return c.json({ message: '作成に失敗しました' })
    }
  })
  // pull
  .openapi( updateEventRoute, async (c) => {
    try {
      const { id } = c.req.valid('param')
      const body = c.req.valid('json')

      // db
      // const updatedEvent = await updateEvent(id, body)
      // もし指定されたIDがdbに存在しなかった場合の処理（404）
      // if (!updatedEvent) {
      //   return c.json({ message: 'イベントが見つかりません' }, 404)
      // }

      // mock(ここから10行めまで)
      const mockOldData = {
        id: id, // URLから取ったID
        name: "バスケットボール",
        description: "古い説明文",
        color: "#000000",
        ruleMd: "古いルール",
        rankingOrder: "DESC" as const,
        format: "TOURNAMENT" as const,
        pointAllocation: {},
        isCompleted: false,
      }

      // JavaScriptのスプレッド構文(...)を使って、古いデータに新しいデータ(body)を上書きする
      // 送られてこなかった項目は、mockOldData の値がそのまま維持される
      const updatedEvent = {
        ...mockOldData,
        ...body,
      }



      return c.json(updatedEvent, 200)
    } catch (error) {
      console.error(error)
      return c.json({ message: '編集に失敗しました' })
    }
  })
  // del
  .openapi(deleteEventRoute, async (c) => {
    try {
      const { id } = c.req.valid('param')

      // mockを使用していないので、実行してもエラー。
      await deleteEvent(id)

      // 成功したら204を返す
      return c.body(null, 204)

    } catch (error) {
      console.error(error)
      return c.json({ message: 'イベントの削除に失敗しました' }, 500)
    }
  })

export type AdminEventsRoutes = typeof adminEventsRoutes
