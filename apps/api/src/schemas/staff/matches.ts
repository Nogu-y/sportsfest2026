import { createRoute, z } from '@hono/zod-openapi'
import { matchStatusEnum } from '../../db/enums'
import { createErrResBody, createReqBody, createResBody } from '../../utils/schemaParser'
import { isoDateTimeSchema, positiveIntegerSchema } from '../common'

const matchStatusSchema = z.enum(matchStatusEnum.enumValues)

export const matchIdParamSchema = z.object({
  matchId: z.coerce.number().int().min(1).openapi({
    param: { name: 'matchId', in: 'path' },
    example: 1
  })
})

export const updateMatchStatusReqSchema = z
  .object({
    status: matchStatusSchema
  })
  .openapi('StaffUpdateMatchStatusRequest')

export const updateMatchStatusResSchema = z
  .object({
    id: positiveIntegerSchema,
    status: matchStatusSchema,
    startedAt: isoDateTimeSchema.nullable(),
    endedAt: isoDateTimeSchema.nullable()
  })
  .openapi('StaffUpdateMatchStatusResponse')

export const updateMatchStatusRoute = createRoute({
  path: '/{matchId}/status',
  method: 'patch',
  tags: ['staff'],
  summary: '試合ステータスを更新する',
  request: {
    params: matchIdParamSchema,
    ...createReqBody(updateMatchStatusReqSchema, true)
  },
  responses: {
    200: createResBody(updateMatchStatusResSchema, '試合ステータス更新成功'),
    404: createErrResBody('試合が見つかりません'),
    500: createErrResBody('更新失敗')
  }
})

export type UpdateMatchStatusReq = z.infer<typeof updateMatchStatusReqSchema>
export type UpdateMatchStatusRes = z.infer<typeof updateMatchStatusResSchema>
