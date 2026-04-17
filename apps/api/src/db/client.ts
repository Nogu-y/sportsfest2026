import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { apiEnv } from '../env'

const client = postgres(apiEnv.DATABASE_URL)

export const db = drizzle(client)
