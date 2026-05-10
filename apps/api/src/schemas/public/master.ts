import { createRoute, z } from '@hono/zod-openapi'
import { isoDateTimeSchema } from '../common'
import { createErrResBody, createResBody } from '../../utils/schemaParser'

export const masterSystemSchema = z.object({
  day1: isoDateTimeSchema,
  day2: isoDateTimeSchema,
  masterVersion: z.string(),
})

export const getPublicMasterDoc = createRoute({
  path: '/',
  method: 'get',
  tags: ['public'],
  summary: '一般公開向けマスタデータを返す',
  responses: {
    200: createResBody(masterSystemSchema, "マスタデータ取得成功"),
    500: createErrResBody("取得失敗"),
  },
})

export type PublicMasterResponse = z.infer<typeof masterSystemSchema>