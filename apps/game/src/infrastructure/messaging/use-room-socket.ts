import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { z } from 'zod'

import type {
  ClientMessage,
  ConnectionRole
} from '@melee/protocol/client-message'
import { decodeMessage, encodeMessage } from '@melee/protocol/codec'
import type { RoomCode } from '@melee/protocol/identifiers'
import { fillRoute, ROOM_SOCKET_ROUTE } from '@melee/protocol/routes'
import {
  type ProtocolErrorMessage,
  protocolErrorMessageSchema,
  timePongMessageSchema
} from '@melee/protocol/server-message'
import type { PawnPiece } from '@melee/protocol/team'
import { PROTOCOL_VERSION } from '@melee/protocol/version'

import { refusalVoidsSeat } from '@melee/core/room/session-memory'
import {
  type ClockEstimate,
  type ClockSample,
  estimateClockOffset
} from '@melee/core/time/clock-sync'

import {
  onReturnToForeground,
  replaceScreen,
  socketOrigin
} from '@/infrastructure/browser'
import { nowMs } from '@/infrastructure/clock'
import {
  isOurOwnMalformedFrame,
  reportRefusedFrame
} from '@/infrastructure/diagnostics'
import { reloadOntoNewBuild } from '@/infrastructure/stale-build'
import { readStoredPawnPiece } from '@/infrastructure/storage/preferences-storage'
import {
  ensureSessionId,
  forgetSessionId,
  readHostToken
} from '@/infrastructure/storage/session-storage'
import { ensureWallSessionId } from '@/infrastructure/storage/wall-session-storage'

import { useSettledStatus } from './use-settled-status'

/** The piece a new seat asks for: the one this device last picked, if any. */
const storedPawnPiece = (): PawnPiece | null => {
  const stored = readStoredPawnPiece()

  return stored.status === 'success' ? stored.data : null
}

/**
 * `closed` and `refused` both mean "no socket", and the difference is the whole
 * point: `closed` is still counting down to another attempt, `refused` is the
 * server having said why and the client having stopped. A screen that shows one
 * as the other tells the user to wait for a reconnection that will never come.
 */
export type SocketStatus = 'connecting' | 'open' | 'closed' | 'refused'

export type RoomSocket = {
  /**
   * Forgets the last refusal. The socket itself only clears one on reconnect,
   * which is far too long a life for a message about a moment: a room that has
   * moved to another phase is being told why something it is no longer doing was
   * refused. The connection hooks call this when the phase turns over.
   */
  clearError: () => void
  clock: ClockEstimate | null
  error: ProtocolErrorMessage | null
  /**
   * Opens a fresh socket after a **refusal**, and does nothing on a socket that
   * had not given up. A refusal is final until something changes on this side —
   * a screen handed the room's token is the case that exists for — so this is a
   * press rather than another timer.
   */
  retry: () => void
  /** `false` when the frame could not be written — the socket is down. */
  send: (message: ClientMessage) => boolean
  status: SocketStatus
}

/**
 * The two frames this hook answers itself. Everything else is forwarded
 * untouched to the role-specific hook, which decodes it against the schema for
 * *its* role — the reason a player's decoder never even describes a host view.
 */
const controlFrameSchema = z.discriminatedUnion('type', [
  timePongMessageSchema,
  protocolErrorMessageSchema
])

const CLOCK_SAMPLE_LIMIT = 8
/** A burst on connect, so the first countdown is already synchronised. */
const OPENING_PING_COUNT = 3
const OPENING_PING_SPACING_MS = 250
const PING_INTERVAL_MS = 5_000
const RECONNECT_BASE_MS = 500
const RECONNECT_CEILING_MS = 8_000
/**
 * How long a socket that still says it is open has to answer a ping once the
 * page is back in front. A phone resuming a suspended page can hand back a
 * socket whose connection died while it slept, and the browser only notices
 * when the operating system gives up on it, seconds later.
 */
const RESUME_PROBE_MS = 2_000

/**
 * Owns the socket, the reconnect policy and the clock handshake. It is the only
 * module in the app that touches `WebSocket`.
 */
export const useRoomSocket = ({
  enabled,
  isLeaving = false,
  nickname,
  onFrame,
  role,
  roomCode
}: {
  enabled: boolean
  /**
   * The screen is already on its way to another page, as a console that has
   * just closed its room is: the refusal answering it is taken with no
   * transition of its own, since the page change is the motion and would skip
   * one started under it. `false` by default.
   */
  isLeaving?: boolean
  nickname: string | null
  onFrame: (raw: string) => void
  role: ConnectionRole
  roomCode: RoomCode
}): RoomSocket => {
  const [socketStatus, setSocketStatus] = useState<SocketStatus>('connecting')
  const [error, setError] = useState<ProtocolErrorMessage | null>(null)
  const [clock, setClock] = useState<ClockEstimate | null>(null)

  const socketRef = useRef<WebSocket | null>(null)
  const samplesRef = useRef<ClockSample[]>([])
  const reconnectRef = useRef<(() => void) | null>(null)

  // An Effect Event rather than a dependency: a fresh `onFrame` on every render
  // would tear the socket down and rebuild it on every render too.
  const forwardFrame = useEffectEvent(onFrame)
  const isOnItsWayOut = useEffectEvent(() => isLeaving)

  useEffect(() => {
    if (!enabled) {
      setSocketStatus('closed')

      return
    }

    let disposed = false
    let giveUp = false
    let attempt = 0
    let reconnectTimer: number | undefined
    let pingTimer: number | undefined
    let probeTimer: number | undefined
    let lastHeardAt = 0
    const openingPingTimers: number[] = []

    const ping = (socket: WebSocket): void => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(encodeMessage({ clientSentAt: nowMs(), type: 'time.ping' }))
      }
    }

    const recordPongAt = (sample: ClockSample): void => {
      samplesRef.current = [...samplesRef.current, sample].slice(
        -CLOCK_SAMPLE_LIMIT
      )
      setClock(estimateClockOffset(samplesRef.current))
    }

    const connect = (): void => {
      const socket = new WebSocket(
        `${socketOrigin()}${fillRoute(ROOM_SOCKET_ROUTE, { code: roomCode })}`
      )

      socketRef.current = socket
      setSocketStatus('connecting')

      socket.addEventListener('open', () => {
        attempt = 0
        lastHeardAt = nowMs()
        setSocketStatus('open')
        setError(null)
        // Everything the hello carries is read here rather than when the effect
        // ran: a refusal can have voided the seat since, and a screen handed the
        // room's token holds it only from the press that reopens this socket.
        const askedPiece = nickname === null ? null : storedPawnPiece()

        socket.send(
          encodeMessage({
            hostToken:
              role === 'player'
                ? undefined
                : (readHostToken(roomCode) ?? undefined),
            nickname: nickname ?? undefined,
            pawnColour: askedPiece?.colour,
            pawnHead: askedPiece?.head,
            protocolVersion: PROTOCOL_VERSION,
            role,
            sessionId:
              role === 'wall'
                ? ensureWallSessionId(roomCode)
                : ensureSessionId({ role, roomCode }),
            type: 'hello'
          })
        )

        for (let index = 0; index < OPENING_PING_COUNT; index++) {
          openingPingTimers.push(
            window.setTimeout(() => {
              ping(socket)
            }, index * OPENING_PING_SPACING_MS)
          )
        }

        pingTimer = window.setInterval(() => {
          ping(socket)
        }, PING_INTERVAL_MS)
      })

      socket.addEventListener('message', (event) => {
        lastHeardAt = nowMs()

        if (typeof event.data !== 'string') {
          return
        }

        const control = decodeMessage(controlFrameSchema, event.data)

        if (control.status === 'failure') {
          forwardFrame(event.data)

          return
        }

        if (control.message.type === 'time.pong') {
          recordPongAt({
            clientReceivedAt: nowMs(),
            clientSentAt: control.message.clientSentAt,
            serverTime: control.message.serverTime
          })

          return
        }

        if (isOurOwnMalformedFrame(control.message)) {
          reportRefusedFrame(control.message)

          return
        }

        const refusal = control.message

        if (!refusal.fatal) {
          setError(refusal)

          return
        }

        // The room lives on the server, so a screen left on the previous
        // build loses nothing but a second by fetching the current one, and
        // the seat comes back with it. The screen stays as it is until the
        // reload lands.
        if (
          refusal.code === 'protocol_version_mismatch' &&
          reloadOntoNewBuild()
        ) {
          giveUp = true
          socket.close()

          return
        }

        // The end of the line is what the frame says, not what the socket does
        // next. Waiting for a close left a player on a stale scoreboard when
        // the host closed the room: it is the one fatal refusal a socket can
        // carry while staying open, since the server is answering a *third*
        // party. The page is replaced by the refusal, so it goes as one.
        giveUp = true
        const refuse = (): void => {
          setError(refusal)
          setSocketStatus('refused')
        }

        if (isOnItsWayOut()) {
          refuse()
        } else {
          replaceScreen(() => {
            flushSync(refuse)
          })
        }

        if (refusalVoidsSeat(refusal.code)) {
          forgetSessionId({ role, roomCode })
        }

        socket.close()
      })

      socket.addEventListener('close', () => {
        // A torn-down or replaced socket closes after its successor has
        // opened, and its status would overwrite the live one with a false
        // reconnecting. A refusal set its own status, inside the screen it
        // replaces.
        if (disposed || socketRef.current !== socket) {
          return
        }

        window.clearInterval(pingTimer)

        if (giveUp) {
          return
        }

        setSocketStatus('closed')

        attempt += 1
        reconnectTimer = window.setTimeout(
          connect,
          Math.min(RECONNECT_CEILING_MS, RECONNECT_BASE_MS * 2 ** (attempt - 1))
        )
      })
    }

    // A refusal is final until something changes on this side, so the way back
    // is a press rather than a dependency: nothing about the socket's inputs has
    // changed, and the value that did — the room's token — is read on open.
    reconnectRef.current = () => {
      if (!giveUp) {
        return
      }

      giveUp = false
      attempt = 0
      connect()
    }

    const replaceSocket = (): void => {
      const stale = socketRef.current

      window.clearTimeout(reconnectTimer)
      window.clearInterval(pingTimer)
      socketRef.current = null
      stale?.close()
      connect()
    }

    // The backoff grew while the page sat hidden, every attempt refused by a
    // phone that suspends what nobody looks at: waiting it out made a player
    // coming back watch up to eight seconds of nothing.
    const reconnectNow = (): void => {
      if (disposed || giveUp) {
        return
      }

      attempt = 0
      window.clearTimeout(probeTimer)

      const socket = socketRef.current

      if (
        socket === null ||
        socket.readyState === WebSocket.CLOSING ||
        socket.readyState === WebSocket.CLOSED
      ) {
        replaceSocket()

        return
      }

      const probedAt = nowMs()

      ping(socket)
      probeTimer = window.setTimeout(() => {
        if (socketRef.current === socket && lastHeardAt < probedAt) {
          replaceSocket()
        }
      }, RESUME_PROBE_MS)
    }

    const stopWatchingForeground = onReturnToForeground(reconnectNow)

    connect()

    return () => {
      disposed = true
      reconnectRef.current = null
      stopWatchingForeground()
      window.clearTimeout(reconnectTimer)
      window.clearTimeout(probeTimer)
      window.clearInterval(pingTimer)

      for (const timer of openingPingTimers) {
        window.clearTimeout(timer)
      }

      socketRef.current?.close()
      socketRef.current = null
    }
  }, [enabled, nickname, role, roomCode])

  const { reveal, status } = useSettledStatus(socketStatus)

  const send = useCallback(
    (message: ClientMessage): boolean => {
      const socket = socketRef.current

      if (socket === null || socket.readyState !== WebSocket.OPEN) {
        // The frame is gone, so the calm the blink was being given ends here.
        reveal()

        return false
      }

      socket.send(encodeMessage(message))

      return true
    },
    [reveal]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const retry = useCallback(() => {
    reconnectRef.current?.()
  }, [])

  return { clearError, clock, error, retry, send, status }
}
