import { createHash } from 'node:crypto'
import { OpenAPIHono } from '@hono/zod-openapi'
import { getLiveDoc } from '../../schemas/public/live'
import { fetchPublicLiveData } from '../../repositories/public/live'

const createEtag = (value: string) => {
  return `"${createHash('sha1').update(value).digest('hex')}"`
}

const hasMatchingEtag = (value: string | undefined, etag: string) => {
  if (!value) {
    return false
  }

  return value
    .split(',')
    .map((tag) => tag.trim())
    .includes(etag)
}

export const publicLiveRoutes = new OpenAPIHono()
  .openapi(getLiveDoc,
    async (c) => {
      try {
        const data = await fetchPublicLiveData()
        const body = JSON.stringify(data)
        const etag = createEtag(body)

        c.header('Cache-Control', 'public, must-revalidate')
        c.header('ETag', etag)

        if (hasMatchingEtag(c.req.header('if-none-match'), etag)) {
          return c.body(null, 304)
        }

        return c.json(data, 200)
      } catch {
        return c.json({ message: 'failed to fetch' }, 500)
      }
    }
)
