import { defineConfig } from 'drizzle-kit'
import { apiEnv } from './src/env'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: apiEnv.DATABASE_URL
  }
})
