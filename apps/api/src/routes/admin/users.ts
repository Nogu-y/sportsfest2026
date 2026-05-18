import { OpenAPIHono } from '@hono/zod-openapi'
import {
  createUserRoute,
  deleteUserRoute,
  getUsersRoute,
  updateUserRoute,
} from '../../schemas/admin/users'
import { createUser, deleteUser, getUsers, updateUser } from '../../repositories/admin/users'

const isUniqueViolation = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: string }).code === '23505'

export const adminUsersRoutes = new OpenAPIHono()
  .openapi(getUsersRoute, async (c) => {
    try {
      const users = await getUsers()
      return c.json(users, 200)
    } catch (error) {
      console.error(error)
      return c.json({ message: '管理ユーザーの取得に失敗しました' }, 500)
    }
  })
  .openapi(createUserRoute, async (c) => {
    try {
      const body = c.req.valid('json')
      const user = await createUser({
        loginId: body.loginId,
        displayName: body.displayName,
        role: body.role,
        password: body.password,
        isActive: body.isActive ?? true,
      })

      return c.json(user, 201)
    } catch (error) {
      console.error(error)
      if (isUniqueViolation(error)) {
        return c.json({ message: '同じ loginId のユーザーが存在します' }, 409)
      }
      return c.json({ message: '管理ユーザーの作成に失敗しました' }, 500)
    }
  })
  .openapi(updateUserRoute, async (c) => {
    try {
      const { id } = c.req.valid('param')
      const body = c.req.valid('json')
      const result = await updateUser(id, {
        displayName: body.displayName,
        role: body.role,
        isActive: body.isActive,
        password: body.password,
      })

      if ('error' in result) {
        if (result.error === 'not_found') {
          return c.json({ message: '管理ユーザーが見つかりません' }, 404)
        }
        return c.json({ message: '最後の有効 ADMIN は変更できません' }, 409)
      }

      return c.json(result.user, 200)
    } catch (error) {
      console.error(error)
      return c.json({ message: '管理ユーザーの更新に失敗しました' }, 500)
    }
  })
  .openapi(deleteUserRoute, async (c) => {
    try {
      const { id } = c.req.valid('param')
      const result = await deleteUser(id)

      if ('error' in result) {
        if (result.error === 'not_found') {
          return c.json({ message: '管理ユーザーが見つかりません' }, 404)
        }
        return c.json({ message: '最後の有効 ADMIN は削除できません' }, 409)
      }

      return c.body(null, 204)
    } catch (error) {
      console.error(error)
      return c.json({ message: '管理ユーザーの削除に失敗しました' }, 500)
    }
  })

export type AdminUsersRoutes = typeof adminUsersRoutes
