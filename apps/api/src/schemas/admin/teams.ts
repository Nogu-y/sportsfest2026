import { createRoute, z } from '@hono/zod-openapi'
import { createResBody, createReqBody,createErrResBody } from '../../utils/schemaParser.js'

export const teamSchema = z.object({
  name: z.string().min(1).max(100)
});

export const TeamsParamSchema = z.object({
  // 文字列を数値に変換
  id: z.coerce.number().openapi({
    param: { name: 'id', in: 'path' },
    example: 1,
  }),
})

export const getTeamsResSchema = z.array(teamSchema)

export const postTeamsDoc = createRoute({
  path: '/',
  method: 'post',
  tags: ['admin'],
  summary: 'チームを作成',
  request: createReqBody(teamSchema),
  responses: {
    200: createResBody(teamSchema, "チーム作成完了"),
    400: createErrResBody('不正なリクエスト'),
    404: createErrResBody("チームが見つからない"),
    409: createErrResBody('同じ名前のチームが存在する'),
    500: createErrResBody('データ取得失敗')
  },
})

export const getTeamsDoc = createRoute({
  path:'/',
  method: "get",
  tags:['admin'],
  summary:'チーム一覧',
  responses:{
    200:createResBody(getTeamsResSchema,"一覧表示"),
    400: createErrResBody('不正なリクエスト'),
    404: createErrResBody("チームが見つからない"),
    500: createErrResBody("データ取得失敗")
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
    204: { description: 'チーム情報の削除に成功 (No Content)' },  
    400: createErrResBody('不正なリクエスト'),
    404: createErrResBody("チームが見つからない"),
    500: createErrResBody('データ取得失敗')
  },
})

export const updateTeamsDoc = createRoute({
  path: '/{id}',
  method: 'put',
  tags: ['admin'],
  summary: 'チームを作成',
  request: createReqBody(teamSchema),
  responses: {
    200: createResBody(teamSchema, "チーム更新完了"),
    400: createErrResBody('不正なリクエスト'),
    404: createErrResBody("チームが見つからない"),
    500: createErrResBody('データ取得失敗')
  },
})