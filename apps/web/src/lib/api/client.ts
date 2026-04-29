import { AppType } from "../../../../api/src/index"
import { hc } from "hono/client"
import { webEnv } from "src/env"

export const api = hc<AppType>(webEnv.NEXT_PUBLIC_API_BASE_URL)