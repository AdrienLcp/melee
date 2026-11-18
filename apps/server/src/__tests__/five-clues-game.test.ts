import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_FIVE_CLUES_SETTINGS } from '@melee/protocol/game'
import type { HostToken } from '@melee/protocol/identifiers'
import {
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings,
  type RoundContent,
  type RoundView
} from '@melee/protocol/room'
import {
  type HostServerMessage,
  type PlayerServerMessage,
  type WallServerMessage,
  wallServerMessageSchema
} from '@melee/protocol/server-message'
import { PROTOCOL_VERSION } from '@melee/protocol/version'

import { worthOfClue } from '@melee/core/fiveclues/clue-pay'

import {
  fiveCluesAnswerOf,
  fiveCluesCountries,
  fiveCluesLadderOf
} from '@/infrastructure/questions/five-clues-bank'

import { startRoomHarness } from './node-room-harness'
import {
  errorsIn,
  hostView,
  type Peer,
  playerView,
  type RoomHarness,
  sleep,
  waitFor
} from './room-harness'

const PERU_CODE = 'PER'

vi.mock(
  '@/infrastructure/questions/five-clues-bank',
  async (importOriginal) => {
    const bank =
      await importOriginal<
        typeof import('@/infrastructure/questions/five-clues-bank')
      >()

    return {
      ...bank,
      drawFiveCluesCountry: () => ({
        country: bank
          .fiveCluesCountries()
          .find(({ code }) => code === PERU_CODE),
        playedId: `fiveclues:${PERU_CODE}`
      })
    }
  }
)

const peruOf = () => {
  const country = fiveCluesCountries().find(({ code }) => code === PERU_CODE)

  if (country === undefined) {
    throw new Error('Peru is no longer dealt')
  }

  return country
}

const PERU = peruOf()
const LADDER = fiveCluesLadderOf({ country: PERU, language: 'fr' })
const ANSWER = fiveCluesAnswerOf({ country: PERU, language: 'fr' })

/** What each rung puts in a frame, read off the ladder itself: nothing of a rung may travel before it opens. */
const MARKS_BY_CLUE: readonly (readonly string[])[] = [
  [`"population":${LADDER[0].population}`],
  [`"region":"${LADDER[1].region}"`],
  [LADDER[2].silhouette],
  LADDER[3].cities,
  [LADDER[4].flag, LADDER[4].capital]
]

/** What names the country: on no screen before the reveal, `choice`'s four names aside. */
const COUNTRY_MARKS = [ANSWER.answer, ...ANSWER.accepted, `"${PERU_CODE}"`]

/** One wrong country a clue, none of them a neighbour a typed slip could be forgiven into. */
const WRONG_GUESSES = ['Chili', 'Cuba', 'Mali', 'Canada', 'Laos'] as const

const roomOf = (mode: 'choice' | 'typed'): RoomSettings => ({
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game: DEFAULT_FIVE_CLUES_SETTINGS,
  mode: DEFAULT_MODE_SETTINGS[mode],
  roundCount: 3
})

type Seat = Peer<PlayerServerMessage>

/** A seat or a seated console: both send `player.answer`. */
type Guesser = Seat | Peer<HostServerMessage>

const cluesRound = (
  view: { round: RoundView | null } | null
): Extract<RoundContent, { kind: 'fiveclues' }> | null => {
  const content = view?.round?.content

  return content?.kind === 'fiveclues' ? content : null
}

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

const roundInPlay = async ({
  consoleName,
  mode
}: {
  /** A name seats the console, which then climbs with the room. */
  consoleName?: string
  mode: 'choice' | 'typed'
}) => {
  const { code, host, hostToken } = await harness.openRoom(
    roomOf(mode),
    consoleName
  )
  const wall = await pairedWall({ code, hostToken })
  const zoe = await harness.seat({ code, nickname: 'Zoe' })
  const max = await harness.seat({ code, nickname: 'Max' })

  host.send({ type: 'host.startRound' })
  await waitFor(
    () => playerView(zoe)?.phase === 'playing',
    'the first clue to go up'
  )

  return {
    code,
    host,
    max,
    roundId: playerView(zoe)?.round?.id ?? '',
    wall,
    zoe
  }
}

const type = ({
  guess,
  roundId,
  seat
}: {
  guess: string
  roundId: string
  seat: Guesser
}) =>
  seat.send({
    answer: { guess, kind: 'typed' },
    roundId,
    type: 'player.answer'
  })

const pick = ({
  choiceIndex,
  roundId,
  seat
}: {
  choiceIndex: number
  roundId: string
  seat: Seat
}) =>
  seat.send({
    answer: { choiceIndex, kind: 'choice' },
    roundId,
    type: 'player.answer'
  })

const openClueOf = (seat: Seat) =>
  cluesRound(playerView(seat))?.openClueIndex ?? null

const idOf = (seat: Seat) => playerView(seat)?.youId ?? null

type Frame = {
  message: HostServerMessage | PlayerServerMessage | WallServerMessage
  raw: string
}

/**
 * Where a frame stands: how many clues the room had open as it was sent, and
 * whether it is the reveal. Read off `openClueIndex` and the roster stamp, not
 * off the clue list a leak would lengthen.
 */
const stageOf = (
  message: Frame['message']
): { isRevealed: boolean; openCount: number } | null => {
  if (message.type !== 'room.updated' && message.type !== 'welcome') {
    return null
  }

  const content = cluesRound(message.view)

  if (content === null) {
    return { isRevealed: false, openCount: 0 }
  }

  return {
    isRevealed: message.view.phase === 'revealed',
    openCount:
      message.view.round?.openedWithPlayerIds === null
        ? 0
        : content.openClueIndex + 1
  }
}

/** Every mark a frame carried before its rung opened, or the country before the reveal. */
const leaksIn = (frames: readonly Frame[]): string[] => {
  let openCount = 0
  const leaks: string[] = []

  for (const { message, raw } of frames) {
    const stage = stageOf(message)

    if (stage?.isRevealed === true) {
      break
    }

    openCount = stage?.openCount ?? openCount

    const unopened = MARKS_BY_CLUE.slice(openCount).flat()

    leaks.push(
      ...[...unopened, ...COUNTRY_MARKS].filter((mark) => raw.includes(mark))
    )
  }

  return leaks
}

describe('a five-clues round through the seam', () => {
  it('[fiveclues] opens on the first clue alone with four names on a seat, and climbs blind on the console', async () => {
    const { host, wall, zoe } = await roundInPlay({ mode: 'choice' })
    const content = cluesRound(playerView(zoe))

    expect(content?.clues).toEqual([LADDER[0]])
    expect(content?.openClueIndex).toBe(0)
    expect(content?.choices.toSorted()).toEqual(
      [ANSWER.answer, ...ANSWER.decoys].toSorted()
    )
    expect(content?.answer).toBeNull()
    expect(content?.nextClueAt).not.toBeNull()
    expect(content?.yourStanding).toEqual({
      guessedOnClue: null,
      status: 'racing'
    })
    expect(cluesRound(wallView(wall))?.clues).toEqual([LADDER[0]])
    expect(hostView(host)?.currentContent).toEqual({ kind: 'fiveclues' })
  })

  it.each([
    { consoleName: undefined, label: 'a console' },
    { consoleName: 'Marina', label: 'a seated console' }
  ])(
    '[fiveclues] sends no seat, wall or $label a clue before it opens, nor the country before the reveal',
    async ({ consoleName }) => {
      const { host, max, roundId, wall, zoe } = await roundInPlay({
        consoleName,
        mode: 'typed'
      })
      const guessers: Guesser[] =
        consoleName === undefined ? [zoe, max] : [zoe, max, host]

      for (const [clueIndex, guess] of WRONG_GUESSES.entries()) {
        for (const seat of guessers) {
          type({ guess, roundId, seat })
        }

        await waitFor(
          () =>
            clueIndex === WRONG_GUESSES.length - 1
              ? playerView(zoe)?.phase === 'revealed'
              : openClueOf(zoe) === clueIndex + 1,
          `everyone to have guessed on clue ${clueIndex + 1}`
        )
      }

      expect(cluesRound(playerView(zoe))?.answer).toEqual({
        code: PERU_CODE,
        name: ANSWER.answer
      })
      expect(cluesRound(playerView(zoe))?.clues).toEqual([...LADDER])

      for (const peer of [zoe, max, host, wall]) {
        expect(leaksIn(peer.frames)).toEqual([])
      }
    }
  )

  it('[fiveclues] holds a typed seat after a wrong guess until the next clue, which opens once every seat still racing has guessed', async () => {
    const { max, roundId, zoe } = await roundInPlay({ mode: 'typed' })

    type({ guess: 'Chili', roundId, seat: zoe })
    await waitFor(
      () => playerView(zoe)?.round?.answers.length === 1,
      'the wrong guess to land'
    )
    type({ guess: ANSWER.answer, roundId, seat: zoe })
    await waitFor(() => errorsIn(zoe).length === 1, 'the second guess refused')

    expect(errorsIn(zoe).map(({ code }) => code)).toEqual(['already_buzzed'])
    expect(openClueOf(zoe)).toBe(0)
    expect(cluesRound(playerView(zoe))?.yourStanding).toEqual({
      guessedOnClue: 0,
      status: 'racing'
    })

    type({ guess: 'Cuba', roundId, seat: max })
    await waitFor(() => openClueOf(zoe) === 1, 'the second clue to open early')

    expect(cluesRound(playerView(zoe))?.clues).toEqual([LADDER[0], LADDER[1]])

    type({ guess: ANSWER.answer, roundId, seat: zoe })
    await waitFor(
      () => cluesRound(playerView(zoe))?.yourStanding?.status === 'found',
      'the guess on the next clue to land'
    )

    expect(errorsIn(zoe)).toHaveLength(1)
    expect(cluesRound(playerView(max))?.standings).toContainEqual({
      clueIndex: 1,
      playerId: idOf(zoe),
      status: 'found'
    })
  })

  it('[fiveclues] puts a wrong pick out for the round', async () => {
    const { roundId, zoe } = await roundInPlay({ mode: 'choice' })
    const choices = cluesRound(playerView(zoe))?.choices ?? []
    const wrong = choices.findIndex((name) => name !== ANSWER.answer)

    pick({ choiceIndex: wrong, roundId, seat: zoe })
    await waitFor(
      () => cluesRound(playerView(zoe))?.yourStanding?.status === 'out',
      'the wrong pick to land'
    )
    pick({ choiceIndex: choices.indexOf(ANSWER.answer), roundId, seat: zoe })
    await waitFor(() => errorsIn(zoe).length === 1, 'the second pick refused')

    expect(errorsIn(zoe).map(({ code }) => code)).toEqual(['player_locked_out'])
    expect(playerView(zoe)?.phase).toBe('playing')
  })

  it('[fiveclues] closes once everyone has found and pays each seat by its clue, the clock ordering a clue', async () => {
    const { host, max, roundId, zoe } = await roundInPlay({ mode: 'typed' })

    type({ guess: ANSWER.answer, roundId, seat: zoe })
    type({ guess: 'Cuba', roundId, seat: max })
    await waitFor(() => openClueOf(max) === 1, 'the second clue to open early')
    type({ guess: ANSWER.answer, roundId, seat: max })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    const awards = hostView(host)?.round?.awards ?? []
    const [first, second] = awards

    expect(awards.map(({ playerId }) => playerId)).toEqual([
      idOf(zoe),
      idOf(max)
    ])
    expect(first?.points).toBeGreaterThan(worthOfClue(0) * 0.9)
    expect(first?.points).toBeLessThanOrEqual(worthOfClue(0))
    expect(first?.speedBonus).toBeGreaterThan(0)
    expect(second?.points).toBeGreaterThan(worthOfClue(1) * 0.9)
    expect(second?.points).toBeLessThanOrEqual(worthOfClue(1))
    expect(
      hostView(host)?.players.find(({ id }) => id === idOf(zoe))?.score
    ).toBe(first?.points)
  })

  it('[fiveclues] refuses a latecomer’s guess', async () => {
    const { code, roundId } = await roundInPlay({ mode: 'typed' })
    const late = await harness.seat({ code, nickname: 'Ana' })

    type({ guess: ANSWER.answer, roundId, seat: late })
    await waitFor(() => errorsIn(late).length === 1, 'the late guess refused')

    expect(errorsIn(late).map(({ code }) => code)).toEqual(['joined_mid_round'])
    expect(cluesRound(playerView(late))?.yourStanding).toBeNull()
  })

  it('[fiveclues] opens the next clue as the window runs out, its clock stopped by a pause', async () => {
    const { host, roundId, zoe } = await roundInPlay({ mode: 'typed' })
    const clueMs = DEFAULT_FIVE_CLUES_SETTINGS.clueDurationMs
    const pausedForMs = 1_500

    await sleep(200)
    host.send({ isPaused: true, roundId, type: 'host.pause' })
    await waitFor(() => playerView(zoe)?.isPaused === true, 'the pause')

    expect(cluesRound(playerView(zoe))?.nextClueAt).toBeNull()

    await sleep(pausedForMs)
    host.send({ isPaused: false, roundId, type: 'host.pause' })
    await waitFor(() => playerView(zoe)?.isPaused === false, 'the resume')

    expect(cluesRound(playerView(zoe))?.nextClueAt).not.toBeNull()

    await sleep(clueMs - 200 - pausedForMs + 500)

    expect(openClueOf(zoe)).toBe(0)

    await waitFor(
      () => openClueOf(zoe) === 1,
      'the second clue to open on time',
      pausedForMs + 1_000
    )

    expect(cluesRound(playerView(zoe))?.clues).toEqual([LADDER[0], LADDER[1]])
  }, 15_000)
})
