import {createRoute, z} from '@hono/zod-openapi'
import {isoDateTimeSchema} from '../common'
import {createErrResBody, createResBody} from '../../utils/schemaParser'
import {
    blockRankingSchema,
    eventSchema,
    locationSchema,
    mapSchema,
    matchSchema,
    scoreSchema,
    teamSchema
} from "../sportsData";

export const masterSystemSchema = z.object({
    day1: isoDateTimeSchema,
    day2: isoDateTimeSchema,
    masterVersion: z.string(),
})

export const MasterResSchema = z
    .object({
        systemInfo: masterSystemSchema,
        matches: z.array(matchSchema),
        blockRankings: z.array(blockRankingSchema),
        scores: z.array(scoreSchema),
        maps: z.array(mapSchema),
        locations: z.array(locationSchema),
        teams: z.array(teamSchema),
        events: z.array(eventSchema),
    })
    .openapi('PublicMasterResponse') 
    .describe('一般公開向けマスタデータ') 

export const getPublicMasterDoc = createRoute({
    path: '/',
    method: 'get',
    tags: ['public'],
    summary: '一般公開向けマスタデータを返す',
    responses: {
        200: createResBody(MasterResSchema, "マスタデータ取得成功"), 
        304: { description: 'レスポンス内容に変更なし' },         
        500: createErrResBody("取得失敗"),
    },
})

export type PublicMasterResponse = z.infer<typeof MasterResSchema>