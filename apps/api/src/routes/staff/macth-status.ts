import { OpenAPIHono } from '@hono/zod-openapi'
import {  matchPlans } from '../../db/schema'
import { db } from '../../db/client.js';
// schemas
import { MatchStatusSchema, updateMatchStatusRoute } 
from '../../schemas/staff/matches'
//repositories
import { matchRoutes } from '../../repositories/staff/matches'
//チャッピーから出力
export const matchPlanRoute = new OpenAPIHono()

//試合のステータス状況
matchPlanRoute.patch(
  '/:id/status',
  async (c) => {
    // URL parameter 取得
    const id = Number(
      c.req.param('id')
    )

    // request body取得
    const body =
      await c.req.json()

    // schema validation
    const parsed = MatchStatusSchema
        .parse(body)

    // DB更新
    //awaitの後ろはresponsｋらimportした関数を呼び出してねたぶん。
    //respositoriesにasyncでくくったやつがあると思う。それかも
    await matchRoutes(
      id,
      parsed.status
    )
  });