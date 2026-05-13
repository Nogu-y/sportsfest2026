import{ OpenAPIHono } from "@hono/zod-openapi"
import{ postTeamsDoc, getTeamsDoc } from "../../schemas/admin/teams.js"
import{ updateTeamsResult, getTeamsResult } from "../../repositories/admin/teams.js"

export const Teams = new OpenAPIHono()
  .openapi(postTeamsDoc, async (c) => {
  const body = c.req.valid("json");

  const result = await updateTeamsResult(body); 

  return c.json(result, 200);
  })

  .openapi(getTeamsDoc, async (c) => {
    const result = await getTeamsResult();
    return c.json(result, 200)
  })