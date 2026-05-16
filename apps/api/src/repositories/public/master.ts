import { systemInfo } from '../../db/schema'
import { db } from '../../db/client'

export async function getMasterData(){
  const [data] = await db.select().from(systemInfo)
  return data
}



