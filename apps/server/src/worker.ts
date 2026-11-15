import { env } from 'cloudflare:workers'

import { ROOM_SOCKET_ROUTE } from '@melee/protocol/routes'

import { normalizeRoomCode } from '@melee/core/room/room-code'

import { env as serverEnv } from '@/env'
import {
  HASHED_ASSET_ROUTE,
  servedHashedAsset
} from '@/infrastructure/http/hashed-asset'
import { createHttpApp } from '@/infrastructure/http/http-app'
import { limitRoomCreationWith } from '@/infrastructure/http/rate-limit'
import { registerHttpRoutes } from '@/infrastructure/http/routes'
import {
  PRERENDER_MANIFEST,
  prerenderManifestSchema,
  robotsTxt,
  sitemapXml
} from '@/infrastructure/http/site-index'
import { logger } from '@/infrastructure/logging/logger'
import { keepServerReportsIn } from '@/infrastructure/reports/server-reports'
import { d1ReportStore } from '@/infrastructure/worker/d1-report-store'
import {
  durableRoomDoor,
  durableWallPairings,
  roomObjectFor
} from '@/infrastructure/worker/durable-ports'

export { RoomObject } from '@/infrastructure/worker/room-object'
export { WallPairingObject } from '@/infrastructure/worker/wall-pairing-object'

const reports = d1ReportStore(env.OBSERVABILITY)

keepServerReportsIn(reports)

const app = createHttpApp()

registerHttpRoutes({
  adminToken: serverEnv.ADMIN_TOKEN ?? null,
  app,
  limitRoomCreation: limitRoomCreationWith(env.ROOM_CREATION_LIMITER),
  reportLimiter: env.REPORT_LIMITER,
  reports,
  rooms: durableRoomDoor,
  walls: durableWallPairings
})

app.get(ROOM_SOCKET_ROUTE, async (context) => {
  const code = normalizeRoomCode(context.req.param('code'))

  return code === null
    ? context.text('No room behind this address', 404)
    : await roomObjectFor(code).fetch(context.req.raw)
})

const readAsset = async (url: URL, path: string): Promise<string | null> => {
  const response = await env.ASSETS.fetch(new URL(path, url))

  return response.ok ? response.text() : null
}

app.get(HASHED_ASSET_ROUTE, async (context) =>
  servedHashedAsset(await env.ASSETS.fetch(context.req.raw))
)

app.get('/sitemap.xml', async (context) => {
  const url = new URL(context.req.url)
  const manifest = await readAsset(url, `/${PRERENDER_MANIFEST}`)
  const documents =
    manifest === null ? [] : prerenderManifestSchema.parse(JSON.parse(manifest))

  return context.body(sitemapXml({ documents, origin: url.origin }), 200, {
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/xml'
  })
})

app.get('/robots.txt', async (context) => {
  const url = new URL(context.req.url)
  const rules = (await readAsset(url, '/robots.txt')) ?? ''

  return context.text(
    robotsTxt({ isIndexable: serverEnv.INDEXABLE, origin: url.origin, rules })
  )
})

/**
 * The daily Cron Trigger of `wrangler.jsonc`: reports past their thirty days,
 * and live-room rows no room has touched in a day. A failed run throws, so
 * Cloudflare lists it as failed and the next day tries again.
 */
const purgeObservability: ExportedHandlerScheduledHandler<Env> = async (
  controller
) => {
  const purged = await reports.purge({ now: controller.scheduledTime })

  logger.info('Purged expired observability rows', purged)
}

export default {
  fetch: app.fetch,
  scheduled: purgeObservability
} satisfies ExportedHandler<Env>
