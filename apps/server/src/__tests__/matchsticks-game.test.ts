import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_MATCHSTICKS_SETTINGS } from '@melee/protocol/game'
import type { HostToken } from '@melee/protocol/identifiers'
import {
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings,
  type RoundContent,
  type RoundView
} from '@melee/protocol/room'
import { POINTS_FOR_A_CLAIM } from '@melee/protocol/scoring'
import {
  type WallServerMessage,
  wallServerMessageSchema
} from '@melee/protocol/server-message'
import { PROTOCOL_VERSION } from '@melee/protocol/version'

import { isTrueEquation } from '@melee/core/matchsticks/one-move'

import { startRoomHarness } from './node-room-harness'
import {
  hostView,
  type Peer,
  playerView,
  type RoomHarness,
  waitFor
} from './room-harness'

vi.mock('@/infrastructure/music/deezer-client', async () => {
  const { deezerClientStub } = await import('./room-harness')

  return deezerClientStub()
})

/**
 * Equations alone, so every solution can be checked as one. Not on the shelf
 * until its screens are, so the harness reaches it through `host.updateSettings`.
 */
const EQUATIONS: RoomSettings = {
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game: { ...DEFAULT_MATCHSTICKS_SETTINGS, goals: ['equation'] },
  mode: DEFAULT_MODE_SETTINGS.buzzer,
  roundCount: null
}

const matchsticksRound = (
  view: { round: RoundView | null } | null
): Extract<RoundContent, { kind: 'matchsticks' }> | null => {
  const content = view?.round?.content

  return content?.kind === 'matchsticks' ? content : null
}

const transcriptOf = (peer: { frames: { raw: string }[] }): string =>
  peer.frames.map(({ raw }) => raw).join('')

const wallView = (wall: Peer<WallServerMessage>) => {
  for (const { message } of wall.frames.toReversed()) {
    if (message.type === 'room.updated' || message.type === 'welcome') {
      return message.view
    }
  }

  return null
}

let harness: RoomHarness

beforeEach(async () => {
  harness = await startRoomHarness()
})

afterEach(async () => {
  await harness.stop()
})

const pairedWall = async ({
  code,
  hostToken
}: {
  code: string
  hostToken: HostToken
}): Promise<Peer<WallServerMessage>> => {
  const wall = await harness.connect(code, wallServerMessageSchema)

  wall.send({
    hostToken,
    protocolVersion: PROTOCOL_VERSION,
    role: 'wall',
    type: 'hello'
  })
  await waitFor(() => wallView(wall) !== null, 'the wall to be welcomed')

  return wall
}

const puzzleInPlay = async () => {
  const { code, host, hostToken } = await harness.openRoom(EQUATIONS)
  const wall = await pairedWall({ code, hostToken })
  const zoe = await harness.seat({ code, nickname: 'Zoe' })

  host.send({ type: 'host.startRound' })
  await waitFor(
    () => playerView(zoe)?.phase === 'playing',
    'the puzzle to go up'
  )

  const solutions = (() => {
    const content = hostView(host)?.currentContent

    return content?.kind === 'matchsticks' ? (content.solutions ?? []) : []
  })()

  return {
    host,
    roundId: playerView(zoe)?.round?.id ?? '',
    solutions,
    wall,
    zoe
  }
}

describe('matchsticks', () => {
  it('[matchsticks] deals a false equation and hands the host every move that makes it true', async () => {
    const { solutions, wall, zoe } = await puzzleInPlay()
    const puzzle = matchsticksRound(playerView(zoe))?.puzzle

    expect(puzzle?.goal).toBe('equation')
    expect(isTrueEquation(puzzle?.glyphs ?? '')).toBe(false)
    expect(matchsticksRound(wallView(wall))?.puzzle).toEqual(puzzle)
    expect(solutions.length).toBeGreaterThan(0)

    for (const solution of solutions) {
      expect(isTrueEquation(solution.glyphs)).toBe(true)
    }
  })

  /**
   * Over the whole transcript of both screens that must not know: a move seen
   * in any frame is the answer, whatever a later frame says.
   */
  it('[matchsticks] tells neither a player nor the wall the move until the reveal', async () => {
    const { host, roundId, solutions, wall, zoe } = await puzzleInPlay()

    zoe.send({ roundId, type: 'player.buzz' })
    await waitFor(
      () => hostView(host)?.round?.activeBuzz != null,
      'the floor to be taken'
    )

    for (const peer of [zoe, wall]) {
      const beforeTheReveal = transcriptOf(peer)

      expect(beforeTheReveal).not.toContain('"solutions"')

      for (const solution of solutions) {
        expect(beforeTheReveal).not.toContain(`"${solution.glyphs}"`)
      }
    }

    host.send({
      playerId: playerView(zoe)?.youId ?? '',
      roundId,
      type: 'host.judge',
      verdict: { isCorrect: true, kind: 'single' }
    })
    await waitFor(
      () => matchsticksRound(playerView(zoe))?.revealedSolution != null,
      'the move to be shown'
    )

    expect(matchsticksRound(playerView(zoe))?.revealedSolution).toEqual(
      solutions[0]
    )
    expect(playerView(zoe)?.players[0]?.score).toBe(POINTS_FOR_A_CLAIM)
  })
})
