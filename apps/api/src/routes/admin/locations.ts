import { OpenAPIHono } from '@hono/zod-openapi'
import {
  createLocation,
  deleteLocation,
  existsMap,
  getLocations,
  updateLocation,
} from '../../repositories/admin/locations'
import {
  createLocationRoute,
  deleteLocationRoute,
  getLocationsRoute,
  updateLocationRoute,
} from '../../schemas/admin/locations'
import { createNotFoundResponse } from '../../utils/response'

export const adminLocationsRoutes = new OpenAPIHono()
  .openapi(getLocationsRoute, async (c) => {
    try {
      const data = await getLocations()
      return c.json(data, 200)
    } catch (error) {
      console.error(error)
      return c.json({ message: '会場一覧の取得に失敗しました' }, 500)
    }
  })
  .openapi(createLocationRoute, async (c) => {
    try {
      const body = c.req.valid('json')

      if (!(await existsMap(body.mapId))) {
        return c.json(createNotFoundResponse('指定されたマップが見つかりません'), 404)
      }

      const newLocation = await createLocation(body)

      return c.json(newLocation, 201)
    } catch (error) {
      console.error(error)
      return c.json({ message: '会場の作成に失敗しました' }, 500)
    }
  })
  .openapi(updateLocationRoute, async (c) => {
    try {
      const { id } = c.req.valid('param')
      const body = c.req.valid('json')

      if (body.mapId !== undefined && !(await existsMap(body.mapId))) {
        return c.json(createNotFoundResponse('指定されたマップが見つかりません'), 404)
      }

      const updatedLocation = await updateLocation(id, body)

      if (!updatedLocation) {
        return c.json(createNotFoundResponse('会場が見つかりません'), 404)
      }

      return c.json(updatedLocation, 200)
    } catch (error) {
      console.error(error)
      return c.json({ message: '会場の更新に失敗しました' }, 500)
    }
  })
  .openapi(deleteLocationRoute, async (c) => {
    try {
      const { id } = c.req.valid('param')
      const deletedLocation = await deleteLocation(id)

      if (!deletedLocation) {
        return c.json(createNotFoundResponse('会場が見つかりません'), 404)
      }

      return c.body(null, 204)
    } catch (error) {
      console.error(error)
      return c.json({ message: '会場の削除に失敗しました' }, 500)
    }
  })

export type AdminLocationsRoutes = typeof adminLocationsRoutes