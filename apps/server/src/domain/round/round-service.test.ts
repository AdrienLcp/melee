import { describe, expect, it } from 'vitest'

import type { GameKind } from '@melee/protocol/game'

import { drawPlayableNumbers } from '@melee/core/makenumber/playable-draw'
import { generateHostToken } from '@melee/core/room/host-token'

import { newRoom } from '@/domain/room/new-room'
import { joinAsPlayer } from '@/domain/room/room-service'

import {
  MAKE_NUMBER_IN_FLIGHT_GRACE_MS,
  makeNumberContent
} from './make-number-round'
import {
  advanceDueAt,
  closeRound,
  controlClip,
  elapsedRoundMs,
  openRound,
  registerLean,
  remainingRoundMs,
  resumeRoundClock,
  revealRound,
  startRoundClock,
  TRACK_DRAW_LEAD_MS
} from './round-service'

const OPENED_AT = 1_000_000
const COUNTDOWN_MS = 3_000
const HOLD_MS = 8_000
const REVEALED_AT = OPENED_AT + 20_000

const revealedRoom = ({
  game,
  roundCount
}: {
  game: Extract<GameKind, 'blindtest' | 'buzzer'>
  roundCount: number | null
}) => {
  const room = newRoom({
    code: 'ABCD',
    games: [game],
    hostToken: generateHostToken(),
    locale: 'fr',
    now: OPENED_AT
  })

  room.settings.countdownMs = COUNTDOWN_MS
  room.settings.autoAdvanceMs = HOLD_MS
  room.settings.roundCount = roundCount

  openRound({
    content:
      game === 'buzzer'
        ? { kind: 'buzzer' }
        : {
            choices: [],
            clip: { startMs: 0, windowMs: null },
            correctChoiceIndex: null,
            kind: 'blindtest',
            playback: { isPaused: false, restarts: 0 },
            track: {
              artist: 'Daft Punk',
              coverUrl: null,
              film: null,
              id: '1',
              previewUrl: 'https://preview.test/1.mp3',
              title: 'Around the World'
            }
          },
    id: 'round-1',
    now: OPENED_AT,
    room
  })
  revealRound(room, REVEALED_AT)

  return room
}

describe('advanceDueAt', () => {
  it('[hold] wakes a blind test a countdown and a track draw before its next clip', () => {
    const room = revealedRoom({ game: 'blindtest', roundCount: 10 })

    expect(advanceDueAt(room)).toBe(
      REVEALED_AT + HOLD_MS - COUNTDOWN_MS - TRACK_DRAW_LEAD_MS
    )
  })

  it('[hold] wakes a game with nothing to draw a countdown before its next start, and no earlier', () => {
    const room = revealedRoom({ game: 'buzzer', roundCount: 10 })

    expect(advanceDueAt(room)).toBe(REVEALED_AT + HOLD_MS - COUNTDOWN_MS)
  })

  it('[hold] ends the final round when the hold itself runs out', () => {
    const room = revealedRoom({ game: 'blindtest', roundCount: 1 })

    expect(advanceDueAt(room)).toBe(REVEALED_AT + HOLD_MS)
  })

  it('[hold] never treats a room with no round count as on its final round', () => {
    const room = revealedRoom({ game: 'blindtest', roundCount: null })

    expect(advanceDueAt(room)).toBe(
      REVEALED_AT + HOLD_MS - COUNTDOWN_MS - TRACK_DRAW_LEAD_MS
    )
  })

  it('[hold] asks for nothing when the reveal waits for the host', () => {
    const room = revealedRoom({ game: 'blindtest', roundCount: 10 })

    if (room.round !== null) {
      room.round.advancesAt = null
    }

    expect(advanceDueAt(room)).toBeNull()
  })
})

describe('controlClip', () => {
  const playbackOf = (room: ReturnType<typeof revealedRoom>) =>
    room.round?.content.kind === 'blindtest'
      ? room.round.content.playback
      : null

  it('[clip] pauses, resumes and replays the clip under a reveal', () => {
    const room = revealedRoom({ game: 'blindtest', roundCount: 10 })
    const steer = (action: 'pause' | 'restart' | 'resume') =>
      controlClip({ action, now: REVEALED_AT, room, roundId: 'round-1' })

    steer('pause')
    expect(playbackOf(room)).toEqual({ isPaused: true, restarts: 0 })

    steer('resume')
    expect(playbackOf(room)).toEqual({ isPaused: false, restarts: 0 })

    steer('pause')
    steer('restart')
    expect(playbackOf(room)).toEqual({ isPaused: false, restarts: 1 })
  })

  it('[clip] holds the reveal for the host once they reach for the clip', () => {
    const room = revealedRoom({ game: 'blindtest', roundCount: 10 })

    controlClip({ action: 'pause', now: REVEALED_AT, room, roundId: 'round-1' })

    expect(room.round?.advancesAt).toBeNull()
    expect(advanceDueAt(room)).toBeNull()
  })

  it('[clip] leaves the clip of a round still running to the round', () => {
    const room = revealedRoom({ game: 'blindtest', roundCount: 10 })

    if (room.round !== null) {
      room.round.revealed = false
    }

    const steered = controlClip({
      action: 'pause',
      now: REVEALED_AT,
      room,
      roundId: 'round-1'
    })

    expect(steered).toEqual({ error: 'wrong_phase', status: 'failure' })
    expect(playbackOf(room)).toEqual({ isPaused: false, restarts: 0 })
  })
})

describe('resumeRoundClock', () => {
  const PLAYING_AT = OPENED_AT + COUNTDOWN_MS
  const RESTARTED_AFTER_MS = 22_000

  const playingRoom = () => {
    const room = newRoom({
      code: 'ABCD',
      games: ['buzzer'],
      hostToken: generateHostToken(),
      locale: 'fr',
      now: OPENED_AT
    })

    room.settings.countdownMs = COUNTDOWN_MS
    openRound({
      content: { kind: 'buzzer' },
      id: 'round-1',
      now: OPENED_AT,
      room
    })
    startRoundClock({ now: PLAYING_AT, room, roundId: 'round-1' })

    return room
  }

  it('[clock] keeps the time a round ran when its host comes back to a clock nobody held', () => {
    const room = playingRoom()
    const backAt = PLAYING_AT + RESTARTED_AFTER_MS

    resumeRoundClock(room, backAt)

    expect(room.round && elapsedRoundMs(room.round, backAt)).toBe(
      RESTARTED_AFTER_MS
    )
  })
})

describe('the make-the-number close', () => {
  const ROUND_MS = 60_000
  const RUNNING_FROM = OPENED_AT + COUNTDOWN_MS

  const runningRack = () => {
    const room = newRoom({
      code: 'ABCD',
      games: ['makenumber'],
      hostToken: generateHostToken(),
      locale: 'fr',
      now: OPENED_AT
    })
    const numbers = drawPlayableNumbers({
      draw: () => ({ target: 703, tiles: [75, 25, 7, 3, 10, 10] })
    })

    if (numbers === null || room.settings.game?.kind !== 'makenumber') {
      throw new Error('the draw should be playable')
    }

    room.settings.countdownMs = COUNTDOWN_MS
    room.settings.game.roundDurationMs = ROUND_MS
    joinAsPlayer({
      askedPiece: null,
      newPlayerId: 'player-zoe',
      nickname: 'Zoe',
      now: OPENED_AT,
      room,
      sessionId: 'session-zoe'
    })
    openRound({
      content: makeNumberContent(numbers),
      id: 'round-1',
      now: OPENED_AT,
      room
    })
    startRoundClock({ now: RUNNING_FROM, room, roundId: 'round-1' })

    return room
  }

  it('[makenumber] keeps the tiles open a grace past every screen’s clock, by the server’s own', () => {
    const room = runningRack()

    expect(remainingRoundMs(room, RUNNING_FROM + ROUND_MS)).toBe(
      MAKE_NUMBER_IN_FLIGHT_GRACE_MS
    )
  })

  it('[makenumber] banks a rack leaned inside the grace at the close, with no speed', () => {
    const room = runningRack()
    const arrivedAt =
      RUNNING_FROM + ROUND_MS + MAKE_NUMBER_IN_FLIGHT_GRACE_MS / 2

    expect(remainingRoundMs(room, arrivedAt)).toBeGreaterThan(0)

    const leaned = registerLean({
      attempt: {
        kind: 'calculation',
        steps: [
          { left: 0, operator: 'add', right: 1 },
          { left: 6, operator: 'multiply', right: 2 }
        ]
      },
      isWord: () => false,
      now: arrivedAt,
      playerId: 'player-zoe',
      room,
      roundId: 'round-1',
      shapeOf: () => null
    })

    closeRound(room, RUNNING_FROM + ROUND_MS + MAKE_NUMBER_IN_FLIGHT_GRACE_MS)

    expect(leaned.status).toBe('success')
    expect(room.round?.awards).toEqual([
      expect.objectContaining({
        isUnsent: true,
        playerId: 'player-zoe',
        speedBonus: 0,
        verdict: { distance: 3, kind: 'calculation', value: 700 }
      })
    ])
  })
})
