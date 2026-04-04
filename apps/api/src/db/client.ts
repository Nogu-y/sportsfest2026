import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const databaseUrl =
  process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/sportsfest2026'

const client = postgres(databaseUrl)

export const db = drizzle(client)
