import{ OpenAPIHono } from "@hono/zod-openapi"
// 他で書いた関数やらを持ってくる
import{ postTeamsDoc, getTeamsDoc, deleteTeamsDoc, updateTeamsDoc } from "../../schemas/admin/teams.js"
import{ createTeams, getTeams, deleteTeams, updateTeams } from "../../repositories/admin/teams.js"

export const Teams = new OpenAPIHono()
  .openapi(postTeamsDoc, async (c) => {
  const body = c.req.valid("json");

  const result = await createTeams(body); 

  return c.json(result, 200);
  })

  .openapi(getTeamsDoc, async (c) => {
    const result = await getTeams();
    return c.json(result, 200)
  })

  .openapi(deleteTeamsDoc, async (c) => {
    const { id } = c.req.valid('param')
    const result = await deleteTeams(id);
    return c.json(result, 200)
  })

  .openapi(updateTeamsDoc, async (c) => {
    const { name } = c.req.valid('json')
    const id = Number(c.req.param('id'))
    const result = await updateTeams({id,name});
    return c.json(result, 200)
  })