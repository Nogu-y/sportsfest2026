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

const resultParticipantInputSchema = z
  .object({
    participantId: positiveIntegerSchema,
    score: z.number().int().nullable().optional(),
    rank: z.number().int().min(1).nullable().optional(),
    isDisqualified: z.boolean().optional()
  })
  .openapi('StaffMatchResultParticipantInput')

export const createMatchResultReqSchema = z
  .object({
    participants: z.array(resultParticipantInputSchema).min(1)
  })
  .openapi('StaffCreateMatchResultRequest')

export const patchMatchResultReqSchema = z
  .object({
    participants: z.array(resultParticipantInputSchema).min(1)
  })
  .openapi('StaffPatchMatchResultRequest')

const resultParticipantSchema = z
  .object({
    id: positiveIntegerSchema,
    teamId: positiveIntegerSchema.nullable(),
    score: z.number().int().nullable(),
    rank: z.number().int().nullable(),
    isDisqualified: z.boolean()
  })
  .openapi('StaffMatchResultParticipant')

export const updateMatchResultResSchema = z
  .object({
    id: positiveIntegerSchema,
    status: matchStatusSchema,
    startedAt: isoDateTimeSchema.nullable(),
    endedAt: isoDateTimeSchema.nullable(),
    participants: z.array(resultParticipantSchema)
  })
  .openapi('StaffUpdateMatchResultResponse')

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

export const createMatchResultRoute = createRoute({
  path: '/{matchId}/result',
  method: 'post',
  tags: ['staff'],
  summary: '試合結果を新規登録し、試合を完了状態にする',
  request: {
    params: matchIdParamSchema,
    ...createReqBody(createMatchResultReqSchema, true)
  },
  responses: {
    200: createResBody(updateMatchResultResSchema, '試合結果登録成功'),
    400: createErrResBody('不正なリクエスト'),
    404: createErrResBody('試合が見つかりません'),
    409: createErrResBody('依存チームが未確定のため入力できません'),
    422: createErrResBody('participantId または入力値が不正です'),
    500: createErrResBody('更新失敗')
  }
})

export const patchMatchResultRoute = createRoute({
  path: '/{matchId}/result',
  method: 'patch',
  tags: ['staff'],
  summary: '登録済み試合結果を修正し、試合を完了状態に保つ',
  request: {
    params: matchIdParamSchema,
    ...createReqBody(patchMatchResultReqSchema, true)
  },
  responses: {
    200: createResBody(updateMatchResultResSchema, '試合結果修正成功'),
    400: createErrResBody('不正なリクエスト'),
    404: createErrResBody('試合が見つかりません'),
    409: createErrResBody('依存チームが未確定のため入力できません'),
    422: createErrResBody('participantId または入力値が不正です'),
    500: createErrResBody('更新失敗')
  }
})

export type UpdateMatchStatusReq = z.infer<typeof updateMatchStatusReqSchema>
export type UpdateMatchStatusRes = z.infer<typeof updateMatchStatusResSchema>
export type CreateMatchResultReq = z.infer<typeof createMatchResultReqSchema>
export type PatchMatchResultReq = z.infer<typeof patchMatchResultReqSchema>
export type UpdateMatchResultRes = z.infer<typeof updateMatchResultResSchema>
