import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_MATCHSTICKS_SETTINGS } from '@melee/protocol/game'
import type { HostToken } from '@melee/protocol/identifiers'
import type { StickMove } from '@melee/protocol/matchsticks'
import {
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings,
  type RoundContent,
  type RoundView
} from '@melee/protocol/room'
import { POINT, POINTS_FOR_A_CLAIM } from '@melee/protocol/scoring'
import {
  type PlayerServerMessage,
  type WallServerMessage,
  wallServerMessageSchema
} from '@melee/protocol/server-message'
import { PROTOCOL_VERSION } from '@melee/protocol/version'

import { emptyPlacesOf, sticksOf } from '@melee/core/matchsticks/glyphs'
import {
  applyMove,
  isTrueEquation,
  oneStickMoves
} from '@melee/core/matchsticks/one-move'

import { startRoomHarness } from './node-room-harness'
import {
  basePointsFor,
  errorsIn,
  hostView,
  type Peer,
  playerView,
  type RoomHarness,
  sessionIdOf,
  sleep,
  waitFor
} from './room-harness'

vi.mock('@/infrastructure/music/deezer-client', async () => {
  const { deezerClientStub } = await import('./room-harness')

  return deezerClientStub()
})

/**
 * One equation, so a round always has a right move, a wrong one, one whose
 * sticks read as nothing and one no screen sends: a dealt equation may have no wrong move at all — every stick of
 * `4-1=2` that can move makes it true.
 */
vi.mock('@melee/core/matchsticks/deal', async () => {
  const { solutionsOf } = await import('@melee/core/matchsticks/one-move')
  const puzzle = { glyphs: '6+4=4', goal: 'equation' } as const

  return { dealPuzzle: () => ({ puzzle, solutions: solutionsOf(puzzle) }) }
})

/** Equations alone, so every solution can be checked as one. */
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

/** The same equations, every screen moving a stick and the server judging it. */
const MOVES: RoomSettings = {
  ...EQUATIONS,
  game: {
    ...DEFAULT_MATCHSTICKS_SETTINGS,
    goals: ['equation'],
    roundDurationMs: 10_000
  },
  mode: DEFAULT_MODE_SETTINGS.move
}

/**
 * A move that leaves the equation true, one that leaves it false, one that
 * leaves sticks reading as nothing, and one no screen can send — a stick
 * lifted off the equals sign.
 */
const movesFor = (glyphs: string) => {
  const legal = oneStickMoves(glyphs)
  const right = legal.find((moved) => isTrueEquation(moved.glyphs))
  const wrong = legal.find((moved) => !isTrueEquation(moved.glyphs))

  if (right === undefined || wrong === undefined) {
    throw new Error(`${glyphs} has no right and wrong move to send`)
  }

  const impossible: StickMove = {
    from: { glyphIndex: [...glyphs].indexOf('='), slot: 'a' },
    to: { glyphIndex: 0, slot: 'a' }
  }
  const chars = [...glyphs]
  const unreadable = chars
    .flatMap((fromGlyph, fromIndex) =>
      sticksOf(fromGlyph).flatMap((fromSlot) =>
        chars.flatMap((toGlyph, toIndex) =>
          emptyPlacesOf(toGlyph).map((toSlot) => ({
            from: { glyphIndex: fromIndex, slot: fromSlot },
            to: { glyphIndex: toIndex, slot: toSlot }
          }))
        )
      )
    )
    .find((move) => applyMove({ glyphs, move }) === null)

  if (unreadable === undefined) {
    throw new Error(`${glyphs} has no move that reads as nothing`)
  }

  return { impossible, right, unreadable, wrong }
}

const sendMove = ({
  move,
  roundId,
  seat
}: {
  move: StickMove
  roundId: string
  seat: Peer<PlayerServerMessage>
}) =>
  seat.send({ answer: { kind: 'move', move }, roundId, type: 'player.answer' })

const movesInPlay = async () => {
  const { code, host, hostToken } = await harness.openRoom(MOVES)
  const wall = await pairedWall({ code, hostToken })
  const zoe = await harness.seat({ code, nickname: 'Zoe' })
  const max = await harness.seat({ code, nickname: 'Max' })
  const lea = await harness.seat({ code, nickname: 'Lea' })

  host.send({ type: 'host.startRound' })
  await waitFor(
    () => playerView(zoe)?.phase === 'playing',
    'the puzzle to go up'
  )

  return {
    code,
    host,
    lea,
    max,
    moves: movesFor(matchsticksRound(playerView(zoe))?.puzzle.glyphs ?? ''),
    roundId: playerView(zoe)?.round?.id ?? '',
    wall,
    zoe
  }
}

describe('matchsticks answered by moving a stick', () => {
  it('[matchsticks] pays a right move above a wrong one, and the faster of two right ones more', async () => {
    const { host, lea, max, moves, roundId, zoe } = await movesInPlay()

    sendMove({ move: moves.right.move, roundId, seat: zoe })
    await waitFor(
      () => (playerView(max)?.round?.answers.length ?? 0) === 1,
      'the first move to land'
    )
    await sleep(150)
    sendMove({ move: moves.right.move, roundId, seat: max })
    sendMove({ move: moves.wrong.move, roundId, seat: lea })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    const view = hostView(host)
    const idOf = (seat: Peer<PlayerServerMessage>) =>
      playerView(seat)?.youId ?? null
    const awardOf = (seat: Peer<PlayerServerMessage>) =>
      view?.round?.awards.find((award) => award.playerId === idOf(seat))

    expect(awardOf(zoe)?.verdict).toEqual({ kind: 'move', placesFromBest: 0 })
    expect(awardOf(lea)?.verdict).toEqual({
      kind: 'move',
      placesFromBest: null
    })
    expect(basePointsFor({ playerId: idOf(zoe), view })).toBe(3 * POINT)
    expect(basePointsFor({ playerId: idOf(max), view })).toBe(3 * POINT)
    expect(awardOf(lea)?.points).toBe(0)
    expect(awardOf(zoe)?.speedBonus ?? 0).toBeGreaterThan(
      awardOf(max)?.speedBonus ?? 0
    )
    expect(view?.round?.lockedOutPlayerIds).toEqual([])
  })

  it('[matchsticks] takes a move whose sticks read as nothing, pays it nothing and draws it on the reveal', async () => {
    const { host, lea, max, moves, roundId, zoe } = await movesInPlay()

    sendMove({ move: moves.unreadable, roundId, seat: zoe })
    sendMove({ move: moves.right.move, roundId, seat: max })
    await waitFor(
      () => matchsticksRound(playerView(zoe))?.yourMove != null,
      'the move to land'
    )
    sendMove({ move: moves.right.move, roundId, seat: lea })
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    const view = playerView(zoe)
    const award = view?.round?.awards.find(
      (entry) => entry.playerId === view.youId
    )

    expect(errorsIn(zoe)).toEqual([])
    expect(award?.verdict).toEqual({ kind: 'move', placesFromBest: null })
    expect(award?.points).toBe(0)
    expect(matchsticksRound(view)?.revealedMoves).toContainEqual({
      glyphs: null,
      move: moves.unreadable,
      playerId: view?.youId
    })
    expect(hostView(host)?.phase).toBe('revealed')
  })

  it('[matchsticks] refuses a move no screen can send without spending the shot, then a second move', async () => {
    const { moves, roundId, zoe } = await movesInPlay()

    sendMove({ move: moves.impossible, roundId, seat: zoe })
    await waitFor(
      () => errorsIn(zoe).length === 1,
      'the impossible move refused'
    )
    sendMove({ move: moves.wrong.move, roundId, seat: zoe })
    await waitFor(
      () => matchsticksRound(playerView(zoe))?.yourMove != null,
      'the move to land'
    )
    sendMove({ move: moves.right.move, roundId, seat: zoe })
    await waitFor(() => errorsIn(zoe).length === 2, 'the second move refused')

    expect(errorsIn(zoe).map(({ code }) => code)).toEqual([
      'invalid_message',
      'already_buzzed'
    ])
    expect(matchsticksRound(playerView(zoe))?.yourMove).toEqual(
      moves.wrong.move
    )
  })

  /**
   * Over the whole transcript of every screen that must not know: a solution,
   * another seat's move or a verdict seen in any frame is the answer handed
   * over, whatever a later frame says.
   */
  it('[matchsticks] tells no player nor the wall a solution, a move or a verdict until the reveal', async () => {
    const { code, host, lea, max, moves, roundId, wall, zoe } =
      await movesInPlay()
    const content = hostView(host)?.currentContent
    const solutions =
      content?.kind === 'matchsticks' ? (content.solutions ?? []) : []

    sendMove({ move: moves.right.move, roundId, seat: zoe })
    await waitFor(
      () => (playerView(max)?.round?.answers.length ?? 0) === 1,
      'the move to land'
    )

    const reloaded = await harness.seat({
      code,
      nickname: 'Zoe',
      sessionId: sessionIdOf(zoe)
    })

    expect(matchsticksRound(playerView(reloaded))?.yourMove).toEqual(
      moves.right.move
    )
    expect(solutions.length).toBeGreaterThan(0)

    for (const peer of [zoe, reloaded, max, lea, wall]) {
      const beforeTheReveal = transcriptOf(peer)

      expect(beforeTheReveal).not.toContain('"solutions"')
      expect(beforeTheReveal).not.toContain('"placesFromBest"')
      expect(beforeTheReveal).not.toContain('"revealedMoves":[')

      for (const solution of solutions) {
        expect(beforeTheReveal).not.toContain(`"${solution.glyphs}"`)
      }
    }

    for (const peer of [max, lea, wall]) {
      expect(transcriptOf(peer)).not.toContain('"yourMove":{')
    }

    sendMove({ move: moves.wrong.move, roundId, seat: max })
    sendMove({ move: moves.impossible, roundId, seat: lea })
    sendMove({ move: moves.wrong.move, roundId, seat: lea })
    await waitFor(() => playerView(max)?.phase === 'revealed', 'the reveal')

    const revealed = matchsticksRound(playerView(max))

    expect(revealed?.revealedSolution).toEqual(solutions[0])
    expect(revealed?.revealedMoves).toEqual([
      {
        glyphs: moves.right.glyphs,
        move: moves.right.move,
        playerId: playerView(zoe)?.youId
      },
      {
        glyphs: moves.wrong.glyphs,
        move: moves.wrong.move,
        playerId: playerView(max)?.youId
      },
      {
        glyphs: moves.wrong.glyphs,
        move: moves.wrong.move,
        playerId: playerView(lea)?.youId
      }
    ])
    expect(playerView(reloaded)?.yourVerdict).toEqual({
      kind: 'move',
      placesFromBest: 0
    })
  })

  it('[matchsticks] seats the console that opened the room, and pays its move', async () => {
    const { host } = await harness.openRoom(MOVES, 'Marina')

    expect(hostView(host)?.youId).not.toBeNull()

    host.send({ type: 'host.startRound' })
    await waitFor(
      () => hostView(host)?.phase === 'playing',
      'the puzzle to go up'
    )

    const view = hostView(host)
    const console = view?.currentContent

    expect(
      console?.kind === 'matchsticks' ? console.solutions : undefined
    ).toBeNull()

    host.send({
      answer: {
        kind: 'move',
        move: movesFor(matchsticksRound(view)?.puzzle.glyphs ?? '').right.move
      },
      roundId: view?.round?.id ?? '',
      type: 'player.answer'
    })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    expect(
      basePointsFor({
        playerId: hostView(host)?.youId ?? null,
        view: hostView(host)
      })
    ).toBe(3 * POINT)
  })
})
