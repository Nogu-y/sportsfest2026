import { db } from "../../db/client.js";
import { teams } from "../../db/schema.js";
import { OpenAPIHono } from "@hono/zod-openapi";

export const updateTeamsResult = async(data:{name: string}) => {
  const [result] = await db
    .insert(teams)
    .values({
        name: data.name,
    })
    .returning();
    return result
  }

export const getTeamsResult = async()=> {
    const result = await db
      .select()
      .from(teams)
    return result
}