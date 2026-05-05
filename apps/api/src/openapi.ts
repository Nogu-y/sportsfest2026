import { swaggerUI } from '@hono/swagger-ui'
import { appName } from '@sportsfest/shared'
import { openAPIRouteHandler } from 'hono-openapi'
import type { Hono } from 'hono'

export const openAPIPath = '/openapi.json'
export const swaggerUIPath = '/docs'

export const registerOpenAPIRoutes = (app: Hono) => {
  app.get(
    openAPIPath,
    openAPIRouteHandler(app, {
      documentation: {
        openapi: '3.1.0',
        info: {
          title: `${appName} API`,
          version: '1.0.0',
          description: 'sportsfest2026 の API ドキュメントです。'
        }
      },
      exclude: [openAPIPath, swaggerUIPath]
    })
  )

  app.get(
    swaggerUIPath,
    swaggerUI({
      url: openAPIPath,
      persistAuthorization: true
    })
  )
}
