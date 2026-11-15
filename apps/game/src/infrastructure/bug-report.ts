import { Result } from '@adrienlcp/result'

import type { BugReport } from '@melee/protocol/http'
import {
  BUG_REPORT_BODY_MAX_BYTES,
  BUG_REPORT_KIND,
  BUG_REPORT_NOTE_MAX,
  BUG_REPORT_SHORT_TEXT_MAX,
  BUG_REPORT_USER_AGENT_MAX,
  bugReportSchema
} from '@melee/protocol/http'
import type { Locale } from '@melee/protocol/locale'

import type { ClockEstimate } from '@melee/core/time/clock-sync'

import { browserIdentityOf, inAppBrowserOf } from '@/helpers/browser-identity'
import { fittedBugReport } from '@/helpers/fitted-bug-report'
import { type ApiError, sendBugReport } from '@/infrastructure/api/melee-api'
import { describeScreen } from '@/infrastructure/browser'
import { describeDevice } from '@/infrastructure/browser-device'
import { nowMs } from '@/infrastructure/clock'
import {
  type RoomReportContext,
  reportTrailAt
} from '@/infrastructure/diagnostics'

/** One report per device per this long: the menu holds its thanks for as long. */
export const BUG_REPORT_COOLDOWN_MS = 30_000

let lastBugReportAt: number | null = null

/** How long before this device may send another report; `0` once it may. */
export const bugReportCooldownLeftMs = (): number =>
  lastBugReportAt === null
    ? 0
    : Math.max(0, lastBugReportAt + BUG_REPORT_COOLDOWN_MS - nowMs())

/** A value the report can carry as JSON, or `null` for one it cannot. */
const asJson = (value: unknown): BugReport['view'] => {
  if (value === undefined || value === null) {
    return null
  }

  const parsed = bugReportSchema.shape.view.safeParse(
    JSON.parse(JSON.stringify(value))
  )

  return parsed.success ? parsed.data : null
}

const USER_AGENT_BRANDS_KEPT = 12

const clippedUserAgentData = (
  data: ReturnType<typeof describeDevice>['userAgentData']
): BugReport['userAgentData'] =>
  data === null
    ? null
    : {
        brands: data.brands
          .slice(0, USER_AGENT_BRANDS_KEPT)
          .map(({ brand, version }) => ({
            brand: brand.slice(0, BUG_REPORT_SHORT_TEXT_MAX),
            version: version.slice(0, BUG_REPORT_SHORT_TEXT_MAX)
          })),
        mobile: data.mobile,
        platform: data.platform.slice(0, BUG_REPORT_SHORT_TEXT_MAX)
      }

const reportRoleOf = (context: RoomReportContext | null): BugReport['role'] => {
  if (context === null) {
    return 'front-door'
  }

  return context.role === 'host' && context.isSeated
    ? 'seated-host'
    : context.role
}

/** What the menu holds that the diagnostics do not: the socket's state, the theme and the language. */
export type BugReportScreen = {
  connection: {
    clock: ClockEstimate | null
    status: NonNullable<BugReport['connection']>['status']
  } | null
  locale: Locale
  theme: BugReport['preferences']['theme']
}

/**
 * Everything the screen knows about itself, with the note somebody typed,
 * sent the moment they press _Send_ and never before. `too_soon` is this
 * device asking again inside `BUG_REPORT_COOLDOWN_MS`.
 */
export const reportProblem = async ({
  note,
  screen: { connection, locale, theme }
}: {
  note: string
  screen: BugReportScreen
}): Promise<Result<void, ApiError | 'too_soon'>> => {
  if (bugReportCooldownLeftMs() > 0) {
    return Result.failure('too_soon')
  }

  const sentAt = nowMs()
  const page = describeScreen()
  const device = describeDevice()
  const { build, events, frames, room, route } = reportTrailAt(sentAt)
  const report: BugReport = {
    browser: browserIdentityOf(page.userAgent),
    build,
    connection:
      connection === null
        ? null
        : {
            clockOffsetMs: connection.clock?.offsetMs ?? null,
            roundTripMs: connection.clock?.roundTripMs ?? null,
            status: connection.status
          },
    events,
    frames,
    game: room?.game ?? null,
    inAppBrowser: inAppBrowserOf(page.userAgent),
    kind: BUG_REPORT_KIND,
    note: note.trim().slice(0, BUG_REPORT_NOTE_MAX),
    phase: room?.phase ?? null,
    preferences: {
      colorScheme: device.colorScheme,
      locale,
      reducedMotion: device.reducedMotion,
      theme
    },
    role: reportRoleOf(room),
    roomCode: room?.roomCode ?? null,
    roundContentKind: room?.roundContentKind ?? null,
    roundIndex: room?.roundIndex ?? null,
    route,
    safeArea: device.safeArea,
    screen: device.screen,
    sentAt,
    settings: asJson(room?.settings),
    userAgent: page.userAgent.slice(0, BUG_REPORT_USER_AGENT_MAX),
    userAgentData: clippedUserAgentData(device.userAgentData),
    view: asJson(room?.view),
    viewport: page.viewport,
    visualViewport: device.visualViewport
  }
  const fitted = fittedBugReport({
    maxBytes: BUG_REPORT_BODY_MAX_BYTES,
    report
  })

  if (fitted === null) {
    return Result.failure('rejected')
  }

  const sent = await sendBugReport(fitted)

  if (sent.status === 'success') {
    lastBugReportAt = nowMs()
  }

  return sent
}
