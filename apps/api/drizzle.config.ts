import { defineConfig } from 'drizzle-kit'
import { apiEnv } from './src/env'

export default defineConfig({
  dialect: 'postgresql',
  schema: ['./src/db/schema.ts', './src/db/enums.ts'],
  out: './drizzle',
  dbCredentials: {
    url: apiEnv.DATABASE_URL
  }
})
