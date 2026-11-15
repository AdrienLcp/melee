import { upgradeWebSocket } from '@hono/node-server'
import { WebSocketServer } from 'ws'

import { ROOM_SOCKET_ROUTE } from '@melee/protocol/routes'

import { normalizeRoomCode } from '@melee/core/room/room-code'

import { createHttpApp } from '@/infrastructure/http/http-app'
import {
  limitRoomCreationWith,
  limitSoundChecksWith
} from '@/infrastructure/http/rate-limit'
import { registerHttpRoutes } from '@/infrastructure/http/routes'
import { createRoomSocketEvents } from '@/infrastructure/messaging/socket-handler'
import { inProcessRateLimiter } from '@/infrastructure/node/in-process-rate-limit'
import { inProcessReportStore } from '@/infrastructure/node/in-process-report-store'
import {
  findRoomEngine,
  inProcessRoomDoor
} from '@/infrastructure/node/in-process-rooms'
import { inProcessWallPairings } from '@/infrastructure/node/in-process-wall-pairings'
import { keepServerReportsIn } from '@/infrastructure/reports/server-reports'

/** What `http-routes.test.ts` spends to the last room before it is refused. */
export const ROOMS_BEFORE_RATE_LIMIT = 30

/** What `http-routes.test.ts` spends from one address before the next check is refused. */
export const SOUND_CHECKS_BEFORE_RATE_LIMIT = 10

/** What `error-reports.test.ts` spends from one room before the next is refused. */
export const REPORTS_BEFORE_RATE_LIMIT = 20

/**
 * The engine on one Node process, which is what the socket suites run: their
 * `vi.mock` of the music client and the question bank only reaches code in the
 * test's own process. Nothing deploys it — production is `worker.ts`.
 */
export const createApp = ({
  adminToken = null
}: {
  /** What opens `/api/admin/*` in this process; none by default, as on a server with no secret set. */
  adminToken?: string | null
} = {}) => {
  const app = createHttpApp()
  const websocket = { server: new WebSocketServer({ noServer: true }) }
  const reports = inProcessReportStore()

  keepServerReportsIn(reports)

  app.get(
    ROOM_SOCKET_ROUTE,
    upgradeWebSocket((context) =>
      createRoomSocketEvents(() => {
        const raw = context.req.param('code')
        const code = raw === undefined ? null : normalizeRoomCode(raw)

        return code === null ? null : findRoomEngine(code)
      })
    )
  )

  registerHttpRoutes({
    adminToken,
    app,
    limitRoomCreation: limitRoomCreationWith(
      inProcessRateLimiter(ROOMS_BEFORE_RATE_LIMIT)
    ),
    limitSoundChecks: limitSoundChecksWith(
      inProcessRateLimiter(SOUND_CHECKS_BEFORE_RATE_LIMIT)
    ),
    reportLimiter: inProcessRateLimiter(REPORTS_BEFORE_RATE_LIMIT),
    reports,
    rooms: inProcessRoomDoor,
    walls: inProcessWallPairings
  })

  return { app, reports, websocket }
}
