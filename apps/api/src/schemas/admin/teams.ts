import { createRoute, z } from '@hono/zod-openapi'
import { createResBody, createReqBody } from '../../utils/schemaParser.js'

export const createTeamSchema = z.object({
  name: z.string().min(1)
});

export const createTeamResSchema = z.object({
  name: z.string().min(1),
})

export const getTeamsResSchema = z.array(createTeamResSchema)

export const postTeamsDoc = createRoute({
  path: '/',
  method: 'post',
  tags: ['team'],
  summary: 'チームを作成',
  request: createReqBody(createTeamSchema),
  responses: {
    200: createResBody(createTeamResSchema, "ユーザー作成完了"),
  },
})

export const getTeamsDoc = createRoute({
  path:'/',
  method: 'get',
  tags:['team'],
  summary:'チーム一覧',
  responses:{
    200:createResBody(getTeamsResSchema,"一覧表示"),
  },
})