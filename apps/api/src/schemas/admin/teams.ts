import { createRoute, z } from '@hono/zod-openapi'
import { createResBody, createReqBody,createErrResBody } from '../../utils/schemaParser.js'

export const createTeamSchema = z.object({
  name: z.string().min(1).max(100)
});

// 更新用にidとnameをそれぞれ定義
export const deleteTeamSchema = z.object({
  name: z.string().min(1).max(100).openapi({
    example: 'チームA',
  }),
})

export const TeamsParamSchema = z.object({
  // 文字列を数値に変換
  id: z.coerce.number().openapi({
    param: { name: 'id', in: 'path' },
    example: 1,
  }),
})

export const getTeamsResSchema = z.array(createTeamSchema)

export const postTeamsDoc = createRoute({
  path: '/',
  method: 'post',
  tags: ['admin'],
  summary: 'チームを作成',
  request: createReqBody(createTeamSchema),
  responses: {
    200: createResBody(createTeamSchema, "チーム作成完了"),
    400: createErrResBody('不正なリクエスト'),
    409: createErrResBody('同じ UUID のサブスクリプションがすでに存在する'),
    500: createErrResBody('')
  },
})

export const getTeamsDoc = createRoute({
  path:'/',
  method: 'get',
  tags:['admin'],
  summary:'チーム一覧',
  responses:{
    200:createResBody(getTeamsResSchema,"一覧表示"),
  },
})

export const deleteTeamsDoc = createRoute({
  path: '/{id}',
  method: 'delete',
  tags: ['admin'],
  summary: 'チームを作成',
  request: {
    params: TeamsParamSchema
  },
  responses: {
    200: createResBody(deleteTeamSchema, "チーム作成完了"),
    400: createErrResBody('不正なリクエスト'),
    409: createErrResBody('同じ UUID のサブスクリプションがすでに存在する'),
    500: createErrResBody('')
  },
})

export const updateTeamsDoc = createRoute({
  path: '/{id}',
  method: 'get',
  tags: ['admin'],
  summary: 'チームを作成',
  request: createReqBody(deleteTeamSchema),
  responses: {
    200: createResBody(deleteTeamSchema, "チーム作成完了"),
    400: createErrResBody('不正なリクエスト'),
    409: createErrResBody('同じ UUID のサブスクリプションがすでに存在する'),
    500: createErrResBody('')
  },
})