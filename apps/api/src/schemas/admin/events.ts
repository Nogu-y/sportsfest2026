import { z } from '@hono/zod-openapi'
import { rankingOrderEnum , eventFormatEnum } from '../../db/enums'

// zodのenumスキーマを生成する
const RankingOrderSchema = z.enum(rankingOrderEnum.enumValues)
const EventFormatSchema = z.enum(eventFormatEnum.enumValues)

// 一応わかりやすいようにモックデータより、exampleを定義(mockと繋げたわけではない点に注意)
export const EventSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  name: z.string().openapi({ example: 'バスケットボール' }),
  description: z.string().nullable().openapi({ example: '8チームによる決勝トーナメント' }),
  color: z.string().nullable().openapi({ example: '#D9480F' }),
  ruleMd: z.string().nullable().openapi({ example: '# ルール\n...' }),

  rankingOrder: RankingOrderSchema.openapi({ example: 'DESC' }),
  format: EventFormatSchema.openapi({ example: 'TOURNAMENT' }),

  pointAllocation: z.record(z.any()).openapi({ example: {} }),
  isCompleted: z.boolean().openapi({ example: false }),
})

// POSTリクエスト用のスキーマ
export const CreateEventRequestSchema = EventSchema.omit({ id: true }).extend({
  isCompleted: z.boolean().optional().default(false),
})

// イベントのURLの値から数値を取り出す
export const EventIdParamSchema = z.object({
  // 文字列を数値に変換
  id: z.coerce.number().openapi({
    param: { name: 'id', in: 'path' },
    example: 1,
  }),
})

export const UpdateEventRequestSchema = CreateEventRequestSchema.partial()
