import type { AppType } from '../../../../api/src'
import { hc } from 'hono/client'
import { webEnv } from 'src/env'

const fetchWithCredentials: typeof fetch = (input, init) =>
  fetch(input, {
    ...init,
    credentials: 'include'
  })

export const api = hc<AppType>(webEnv.NEXT_PUBLIC_API_BASE_URL, {
  fetch: fetchWithCredentials
})
