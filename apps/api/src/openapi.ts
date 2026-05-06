import { swaggerUI } from '@hono/swagger-ui'
import type { OpenAPIHono } from '@hono/zod-openapi'
import { appName } from '@sportsfest/shared'

export const openAPIPath = '/openapi.json'
export const swaggerUIPath = '/docs'

export const registerOpenAPIRoutes = (app: OpenAPIHono) => {
  app.doc31(openAPIPath, {
    openapi: '3.1.0',
    info: {
      title: `${appName} API`,
      version: '1.0.0',
      description: 'sportsfest2026 の API ドキュメントです。'
    }
  })

  app.get(
    swaggerUIPath,
    swaggerUI({
      url: openAPIPath,
      persistAuthorization: true
    })
  )
}
