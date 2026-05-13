import { createRoute, z } from '@hono/zod-openapi'
<<<<<<< HEAD
import { positiveIntegerSchema } from '../common'
import {
  createErrResBody,
  createReqBody,
  createResBody
} from '../../utils/schemaParser'

export const staffMatchIdParamSchema = z
  .object({
    matchId: z.coerce.number().int().min(1)
  })
  .openapi('StaffMatchIdParam')

const staffMatchResultParticipantSchema = z
  .object({
    participantId: positiveIntegerSchema,
    score: z.number().int().nullable(),
    rank: z.number().int().min(1).nullable(),
    isDisqualified: z.boolean().default(false)
  })
  .openapi('StaffMatchResultParticipant')

export const staffMatchResultReqSchema = z
  .object({
    participants: z
      .array(staffMatchResultParticipantSchema)
      .min(1)
      .superRefine((participants, ctx) => {
        const seen = new Set<number>()

        for (const [index, participant] of participants.entries()) {
          if (seen.has(participant.participantId)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [index, 'participantId'],
              message: 'participantId が重複しています'
            })
            continue
          }

          seen.add(participant.participantId)
        }
      }),
    note: z.string().trim().max(1000).nullable().optional()
  })
  .openapi('StaffMatchResultRequest')
  .describe('試合結果登録・更新用データ')

const staffMatchResultResParticipantSchema = z.object({
  participantId: positiveIntegerSchema,
  teamId: positiveIntegerSchema.nullable(),
  score: z.number().int().nullable(),
  rank: z.number().int().nullable(),
  isDisqualified: z.boolean()
})

export const staffMatchResultResSchema = z
  .object({
    matchId: positiveIntegerSchema,
    status: z.literal('Completed'),
    note: z.string().nullable(),
    participants: z.array(staffMatchResultResParticipantSchema)
  })
  .openapi('StaffMatchResultResponse')
  .describe('登録・更新後の試合結果')

export const postStaffMatchResultRoute = createRoute({
  path: '/:matchId/result',
  method: 'post',
  tags: ['staff'],
  summary: '試合結果を新規登録する',
  request: {
    params: staffMatchIdParamSchema,
    ...createReqBody(staffMatchResultReqSchema, true)
  },
  responses: {
    200: createResBody(staffMatchResultResSchema, '登録成功'),
    400: createErrResBody('不正なリクエスト'),
    404: createErrResBody('試合が見つからない'),
    409: createErrResBody('試合状態または依存関係により登録できない')
  }
})

export const patchStaffMatchResultRoute = createRoute({
  path: '/:matchId/result',
  method: 'patch',
  tags: ['staff'],
  summary: '登録済みの試合結果を修正する',
  request: {
    params: staffMatchIdParamSchema,
    ...createReqBody(staffMatchResultReqSchema, true)
  },
  responses: {
    200: createResBody(staffMatchResultResSchema, '更新成功'),
    400: createErrResBody('不正なリクエスト'),
    404: createErrResBody('試合が見つからない'),
    409: createErrResBody('試合状態または依存関係により更新できない')
  }
})

export type StaffMatchResultReq = z.infer<typeof staffMatchResultReqSchema>
export type StaffMatchResultRes = z.infer<typeof staffMatchResultResSchema>
=======
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
>>>>>>> 8d6cf46 (いろいろ実装)
