import { OpenAPIHono } from '@hono/zod-openapi'
import {
  createMap,
  deleteMap,
  getMaps,
  updateMap,
} from '../../repositories/admin/maps'
import {
  createMapRoute,
  deleteMapRoute,
  getMapsRoute,
  updateMapRoute,
} from '../../schemas/admin/maps'
import { createNotFoundResponse } from '../../utils/response'

export const adminMapsRoutes = new OpenAPIHono()
  .openapi(getMapsRoute, async (c) => {
    try {
      const data = await getMaps()
      return c.json(data, 200)
    } catch (error) {
      console.error(error)
      return c.json({ message: 'マップ一覧の取得に失敗しました' }, 500)
    }
  })
  .openapi(createMapRoute, async (c) => {
    try {
      const body = c.req.valid('json')
      const newMap = await createMap(body)

      return c.json(newMap, 201)
    } catch (error) {
      console.error(error)
      return c.json({ message: 'マップの作成に失敗しました' }, 500)
    }
  })
  .openapi(updateMapRoute, async (c) => {
    try {
      const { id } = c.req.valid('param')
      const body = c.req.valid('json')
      const updatedMap = await updateMap(id, body)

      if (!updatedMap) {
        return c.json(createNotFoundResponse('マップが見つかりません'), 404)
      }

      return c.json(updatedMap, 200)
    } catch (error) {
      console.error(error)
      return c.json({ message: 'マップの更新に失敗しました' }, 500)
    }
  })
  .openapi(deleteMapRoute, async (c) => {
    try {
      const { id } = c.req.valid('param')
      const deletedMap = await deleteMap(id)

      if (!deletedMap) {
        return c.json(createNotFoundResponse('マップが見つかりません'), 404)
      }

      return c.body(null, 204)
    } catch (error) {
      console.error(error)
      return c.json({ message: 'マップの削除に失敗しました' }, 500)
    }
  })

export type AdminMapsRoutes = typeof adminMapsRoutes
