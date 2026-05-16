import { getPublicMasterDoc } from '../../schemas/public/master'
import { getMasterData } from '../../repositories/public/master'
import { OpenAPIHono } from '@hono/zod-openapi'

export const publicMasterRoutes = new OpenAPIHono()
  .openapi(getPublicMasterDoc, async (c) => {
    try{
      const { day1, day2, masterVersion } = await getMasterData()
      return c.json({
        day1:day1.toISOString(),
        day2:day2.toISOString(),
        masterVersion 
      },200 )
    }catch{
      return c.json({ message:"failed to fetch" }, 500)
    }
  })
