import { z } from 'zod'

import {
  type RoomCode,
  roomCodeSchema,
  type SessionId,
  sessionIdSchema
} from '@melee/protocol/identifiers'

import { newSessionId } from '@melee/core/room/session-id'

import { parseStoredWithSchema } from './read-stored-with-schema'

export const WALL_SESSIONS_KEY = 'melee:wall-sessions'

const wallSessionsSchema = z.record(roomCodeSchema, sessionIdSchema)

type WallSessions = z.infer<typeof wallSessionsSchema>

/**
 * A wall's session id, kept per tab in `sessionStorage` rather than with the
 * seats in `localStorage`: a reload keeps the wall the console picked, while a
 * second tab of the same browser — a laptop driving its own screen and a
 * projector — is a second wall the console can list and pick, not the first
 * one twice.
 *
 * Every access is guarded: storage throws outright in a Safari private window,
 * and the degradation is a reload arriving as a new wall, which beats a blank
 * page.
 */
export const ensureWallSessionId = (roomCode: RoomCode): SessionId => {
  const sessions = readWallSessions()
  const sessionId = sessions[roomCode] ?? newSessionId()

  if (sessions[roomCode] === undefined) {
    writeWallSessions({ ...sessions, [roomCode]: sessionId })
  }

  return sessionId
}

const readWallSessions = (): WallSessions => {
  try {
    const stored = sessionStorage.getItem(WALL_SESSIONS_KEY)

    if (stored === null) {
      return {}
    }

    const parsed = parseStoredWithSchema({
      schema: wallSessionsSchema,
      text: stored
    })

    return parsed.status === 'success' ? parsed.data : {}
  } catch {
    return {}
  }
}

const writeWallSessions = (sessions: WallSessions): void => {
  try {
    sessionStorage.setItem(WALL_SESSIONS_KEY, JSON.stringify(sessions))
  } catch {
    return
  }
}
