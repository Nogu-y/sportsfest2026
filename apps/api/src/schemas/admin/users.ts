import { createRoute, z } from '@hono/zod-openapi'
import { staffRoleEnum } from '../../db/enums'
import { createErrResBody, createReqBody, createResBody } from '../../utils/schemaParser'

const StaffRoleSchema = z.enum(staffRoleEnum.enumValues)

export const UserSchema = z.object({
  id: z.number().int().min(1).openapi({ example: 1 }),
  loginId: z.string().trim().min(1).max(100).openapi({ example: 'admin' }),
  displayName: z.string().trim().min(1).max(100).openapi({ example: '運営管理者' }),
  role: StaffRoleSchema.openapi({ example: 'ADMIN' }),
  isActive: z.boolean().openapi({ example: true }),
  createdAt: z.string().datetime().openapi({ example: '2026-05-20T00:00:00.000Z' }),
  updatedAt: z.string().datetime().openapi({ example: '2026-05-20T00:00:00.000Z' }),
})

export const CreateUserRequestSchema = z.object({
  loginId: z.string().trim().min(1).max(100),
  displayName: z.string().trim().min(1).max(100),
  role: StaffRoleSchema,
  password: z.string().min(8).max(255),
  isActive: z.boolean().optional().default(true),
})

export const UpdateUserRequestSchema = z
  .object({
    displayName: z.string().trim().min(1).max(100).optional(),
    role: StaffRoleSchema.optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(8).max(255).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: '更新項目を1つ以上指定してください',
  })

export const UserIdParamSchema = z.object({
  id: z.coerce.number().int().min(1).openapi({
    param: { name: 'id', in: 'path' },
    example: 1,
  }),
})

const tags = ['admin']

export const getUsersRoute = createRoute({
  method: 'get',
  path: '/',
  tags,
  summary: '管理ユーザー一覧取得',
  responses: {
    200: createResBody(z.array(UserSchema), '管理ユーザー一覧の取得に成功'),
    500: createErrResBody('サーバーエラー'),
  },
})

export const createUserRoute = createRoute({
  method: 'post',
  path: '/',
  tags,
  summary: '管理ユーザー作成',
  request: {
    ...createReqBody(CreateUserRequestSchema),
  },
  responses: {
    201: createResBody(UserSchema, '管理ユーザーの作成に成功'),
    400: createErrResBody('バリデーションエラー'),
    409: createErrResBody('同じ loginId のユーザーが存在します'),
    500: createErrResBody('サーバーエラー'),
  },
})

export const updateUserRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags,
  summary: '管理ユーザー更新',
  request: {
    params: UserIdParamSchema,
    ...createReqBody(UpdateUserRequestSchema),
  },
  responses: {
    200: createResBody(UserSchema, '管理ユーザーの更新に成功'),
    400: createErrResBody('バリデーションエラー'),
    404: createErrResBody('管理ユーザーが見つかりません'),
    409: createErrResBody('最後の有効 ADMIN は変更できません'),
    500: createErrResBody('サーバーエラー'),
  },
})

export const deleteUserRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags,
  summary: '管理ユーザー削除',
  request: {
    params: UserIdParamSchema,
  },
  responses: {
    204: { description: '管理ユーザーの削除に成功 (No Content)' },
    404: createErrResBody('管理ユーザーが見つかりません'),
    409: createErrResBody('最後の有効 ADMIN は削除できません'),
    500: createErrResBody('サーバーエラー'),
  },
})
