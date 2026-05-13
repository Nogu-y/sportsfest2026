// DB側はもとからあるやつからとってくる
import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { teams } from "../../db/schema.js";

// routeで使う関数。
export const createTeams = async(data:{name: string}) => {
  const [result] = await db
    .insert(teams)
    .values({
        name: data.name,
    })
    .returning();
    return result
  }

export const getTeams = async()=> {
    const result = await db
      .select()
      .from(teams)
    return result
}

export const updateTeams = async (data: { id: number; name: string }) => {
  const [result] = await db
    .update(teams)
    .set({
      name: data.name,
    })
    .where(eq(teams.id, data.id))
    .returning();
  return result;
};

export const deleteTeams = async (id: number) => {
  const [result] = await db
    .delete(teams)
    .where(eq(teams.id, id))
    .returning();
  return result;
};