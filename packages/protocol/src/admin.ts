import { z } from 'zod'

import { clientReportKinds, reportBrowsers, serverReportKinds } from './http'

/**
 * The `/admin` page's reads: the rooms open now and the error reports kept.
 * Every field is what the database holds, written by the server itself — so a
 * stored value is read back as text rather than through the enums a screen's
 * report is checked against, because a row written by an older build may name
 * a game or a phase this one no longer knows, and the page must still list it.
 */
export const adminLiveRoomSchema = z.object({
  /** When the room said it closed, `null` while it is open. */
  closedAt: z.number().int().nullable(),
  code: z.string(),
  game: z.string().nullable(),
  openedAt: z.number().int(),
  phase: z.string(),
  roundIndex: z.number().int().nullable(),
  seatCount: z.number().int().nonnegative(),
  /** When the room last wrote its row — at least every `LIVE_ROOM_TOUCH_MS` while anything happens in it. */
  updatedAt: z.number().int(),
  wallCount: z.number().int().nonnegative()
})

export const adminLiveRoomsResponseSchema = z.object({
  /** The server's clock as it answered, which every age on the page is counted from. */
  now: z.number().int(),
  rooms: z.array(adminLiveRoomSchema)
})

export const ADMIN_REPORTS_PAGE_DEFAULT = 50
export const ADMIN_REPORTS_PAGE_MAX = 100

const optionalText = z
  .string()
  .trim()
  .max(64)
  .transform((value) => (value === '' ? undefined : value))
  .optional()

/** A query string's fields: each filter narrows, and an empty one is no filter. */
export const adminReportsQuerySchema = z.object({
  /** The id of the last row already shown; the page answers the older ones. */
  before: z.coerce.number().int().positive().optional(),
  browser: z.enum(reportBrowsers).optional(),
  /** Matched against either build, the screen's entry chunk or the server's commit. */
  build: optionalText,
  from: z.coerce.number().int().nonnegative().optional(),
  game: optionalText,
  kind: z.enum([...clientReportKinds, ...serverReportKinds]).optional(),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(ADMIN_REPORTS_PAGE_MAX)
    .default(ADMIN_REPORTS_PAGE_DEFAULT),
  room: optionalText,
  to: z.coerce.number().int().nonnegative().optional()
})

export const adminReportSummarySchema = z.object({
  browserName: z.string().nullable(),
  browserVersion: z.string().nullable(),
  clientBuild: z.string().nullable(),
  code: z.string().nullable(),
  errorMessage: z.string().nullable(),
  errorName: z.string().nullable(),
  game: z.string().nullable(),
  id: z.number().int().positive(),
  kind: z.string(),
  phase: z.string().nullable(),
  receivedAt: z.number().int(),
  role: z.string().nullable(),
  roomCode: z.string().nullable(),
  serverBuild: z.string(),
  source: z.enum(['client', 'server']),
  system: z.string().nullable()
})

export const adminReportsResponseSchema = z.object({
  /** Pass it back as `before` for the next page; `null` once the oldest is shown. */
  nextBefore: z.number().int().positive().nullable(),
  reports: z.array(adminReportSummarySchema)
})

export const adminReportResponseSchema = adminReportSummarySchema.extend({
  /** The whole report as it was kept: a screen's `errorReportSchema`, or what the server noted. */
  context: z.record(z.string(), z.unknown())
})

export type AdminLiveRoom = z.infer<typeof adminLiveRoomSchema>
export type AdminLiveRoomsResponse = z.infer<
  typeof adminLiveRoomsResponseSchema
>
export type AdminReportsQuery = z.infer<typeof adminReportsQuerySchema>
export type AdminReportsQueryInput = z.input<typeof adminReportsQuerySchema>
export type AdminReportSummary = z.infer<typeof adminReportSummarySchema>
export type AdminReportsResponse = z.infer<typeof adminReportsResponseSchema>
export type AdminReportResponse = z.infer<typeof adminReportResponseSchema>
