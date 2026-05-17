import {createRoute, z} from '@hono/zod-openapi'
import {createErrResBody, createResBody} from '../../utils/schemaParser'
import {blockRankingSchema, matchSchema, scoreSchema} from "../sportsData";


export const LiveResSchema = z
    .object({
        matches: z.array(matchSchema),
        blockRankings: z.array(blockRankingSchema),
        scores: z.array(scoreSchema)
    })
    .openapi('PublicLiveResponse')
    .describe('一般公開向けライブデータ')

export const getLiveDoc = createRoute({
    path: '/',
    method: 'get',
    tags: ['public'],
    summary: '一般公開向けライブデータを返す',
    responses: {
        200: createResBody(LiveResSchema, 'ライブデータ取得成功'),
        304: {
            description: 'レスポンス内容に変更なし'
        },
        500: createErrResBody('取得失敗')
    }
})

export type LiveResponse = z.infer<typeof LiveResSchema>
