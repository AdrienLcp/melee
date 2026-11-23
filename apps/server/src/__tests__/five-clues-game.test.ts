import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { FiveCluesClue } from '@melee/protocol/five-clues'
import { DEFAULT_FIVE_CLUES_SETTINGS } from '@melee/protocol/game'
import type { HostToken } from '@melee/protocol/identifiers'
import type { QuestionLanguage } from '@melee/protocol/question'
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
      drawFiveCluesCard: ({ language }: { language: QuestionLanguage }) => {
        const peru = bank
          .fiveCluesCountries()
          .find(({ code }) => code === PERU_CODE)

        return peru === undefined
          ? null
          : {
              answer: bank.fiveCluesAnswerOf({ country: peru, language }),
              ladder: bank.fiveCluesLadderOf({ country: peru, language }),
              playedId: `fiveclues:${PERU_CODE}`,
              subject: 'country'
            }
      }
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

const marksOf = (clue: FiveCluesClue): readonly string[] => {
  switch (clue.kind) {
    case 'size':
      return [`"population":${clue.population}`]
    case 'region':
      return [`"region":"${clue.region}"`]
    case 'outline':
      return [clue.silhouette]
    case 'cities':
      return clue.cities
    case 'flag':
      return [clue.flag, clue.capital]
    case 'text':
      return [clue.text]
    case 'image':
      return [clue.photo.file, clue.alt]
  }
}

/** What each rung puts in a frame, read off the ladder itself: nothing of a rung may travel before it opens. */
const MARKS_BY_CLUE = LADDER.map(marksOf)

/** What names the country: on no screen before the reveal, `choice`'s four names aside. */
const COUNTRY_MARKS = [ANSWER.answer, ...ANSWER.accepted, `"${PERU_CODE}"`]

/** One wrong country a clue, none of them a neighbour a typed slip could be forgiven into. */
const WRONG_GUESSES = ['Chili', 'Cuba', 'Mali', 'Canada', 'Laos'] as const

type CluesMode = 'buzzer' | 'choice' | 'typed'

/** How a buzzer room is played, the defaults unless a test needs a shorter clue or a floor that runs out. */
type BuzzerPace = {
  /** `null` holds the floor until the host judges. */
  answerWindowMs?: number | null
  clueDurationMs?: number
}

const roomOf = ({
  answerWindowMs = null,
  clueDurationMs = DEFAULT_FIVE_CLUES_SETTINGS.clueDurationMs,
  mode
}: BuzzerPace & { mode: CluesMode }): RoomSettings => ({
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game: { ...DEFAULT_FIVE_CLUES_SETTINGS, clueDurationMs },
  mode:
    mode === 'buzzer'
      ? { answerWindowMs, kind: 'buzzer' }
      : DEFAULT_MODE_SETTINGS[mode],
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
  mode,
  ...pace
}: BuzzerPace & {
  /** A name seats the console, which then climbs with the room — or sits a buzzer round out to judge it. */
  consoleName?: string
  mode: CluesMode
}) => {
  const { code, host, hostToken } = await harness.openRoom(
    roomOf({ mode, ...pace }),
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
    expect(hostView(host)?.currentContent).toEqual({
      answer: null,
      kind: 'fiveclues'
    })
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
        name: ANSWER.answer,
        subject: 'country'
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

const buzz = ({ roundId, seat }: { roundId: string; seat: Seat }) =>
  seat.send({ roundId, type: 'player.buzz' })

const judge = ({
  host,
  isCorrect,
  roundId,
  seat
}: {
  host: Peer<HostServerMessage>
  isCorrect: boolean
  roundId: string
  seat: Seat
}) =>
  host.send({
    playerId: idOf(seat) ?? '',
    roundId,
    type: 'host.judge',
    verdict: { isCorrect, kind: 'single' }
  })

const floorOf = (seat: Seat) => playerView(seat)?.round?.activeBuzz ?? null

const takeFloor = async ({
  roundId,
  seat
}: {
  roundId: string
  seat: Seat
}) => {
  buzz({ roundId, seat })
  await waitFor(
    () => floorOf(seat)?.playerId === idOf(seat),
    'the floor to be taken'
  )
}

/** One seat taking the floor and the host saying no, then the round back in play — or revealed, past the last clue. */
const missOnFloor = async ({
  host,
  roundId,
  seat
}: {
  host: Peer<HostServerMessage>
  roundId: string
  seat: Seat
}) => {
  await takeFloor({ roundId, seat })
  judge({ host, isCorrect: false, roundId, seat })
  await waitFor(
    () => floorOf(seat) === null && playerView(seat)?.phase !== 'buzzed',
    'the floor to be given back'
  )
}

describe('a five-clues round on the buzzer', () => {
  it('[fiveclues] stops the clue clock under a buzz, opens no clue under the floor, and gives the window’s remainder back', async () => {
    const clueDurationMs = 5_000
    const { host, roundId, wall, zoe } = await roundInPlay({
      clueDurationMs,
      mode: 'buzzer'
    })
    const firstWindowEndsAt = cluesRound(playerView(zoe))?.nextClueAt ?? 0

    await sleep(3_500)
    await takeFloor({ roundId, seat: zoe })

    expect(cluesRound(playerView(zoe))?.nextClueAt).toBeNull()
    expect(cluesRound(wallView(wall))?.nextClueAt).toBeNull()

    const heldForMs = 2_500

    await sleep(heldForMs)

    expect(openClueOf(zoe)).toBe(0)
    expect(cluesRound(playerView(zoe))?.clues).toEqual([LADDER[0]])

    judge({ host, isCorrect: false, roundId, seat: zoe })
    await waitFor(() => playerView(zoe)?.phase === 'playing', 'the climb back')

    const shiftMs =
      (cluesRound(playerView(zoe))?.nextClueAt ?? 0) - firstWindowEndsAt

    expect(openClueOf(zoe)).toBe(0)
    expect(shiftMs).toBeGreaterThanOrEqual(heldForMs)
    expect(shiftMs).toBeLessThan(heldForMs + 2_000)

    await waitFor(
      () => openClueOf(zoe) === 1,
      'the second clue to open once the remainder runs out',
      3_000
    )
  }, 20_000)

  it('[fiveclues] holds a seat judged wrong or whose floor ran out on its clue, then lets it buzz again on the next', async () => {
    const { host, max, roundId, zoe } = await roundInPlay({
      answerWindowMs: 3_000,
      clueDurationMs: 30_000,
      mode: 'buzzer'
    })

    await missOnFloor({ host, roundId, seat: zoe })

    expect(playerView(zoe)?.round?.lockedOutPlayerIds).toEqual([idOf(zoe)])
    expect(cluesRound(playerView(zoe))?.yourStanding).toEqual({
      guessedOnClue: 0,
      status: 'racing'
    })

    buzz({ roundId, seat: zoe })
    await waitFor(() => errorsIn(zoe).length === 1, 'the second buzz refused')

    expect(errorsIn(zoe).map(({ code }) => code)).toEqual(['player_locked_out'])

    await takeFloor({ roundId, seat: max })
    await waitFor(
      () => openClueOf(zoe) === 1,
      'the floor to run out and the next clue to open, every seat held',
      5_000
    )

    expect(playerView(zoe)?.round?.lockedOutPlayerIds).toEqual([])

    await takeFloor({ roundId, seat: zoe })

    expect(errorsIn(zoe)).toHaveLength(1)
  }, 15_000)

  it('[fiveclues] pays a right buzz by the clue open as it arrived, its clock measured to the buzz, and ends the round', async () => {
    const clueDurationMs = 5_000
    const { host, max, roundId, zoe } = await roundInPlay({
      clueDurationMs,
      mode: 'buzzer'
    })

    await missOnFloor({ host, roundId, seat: zoe })
    await missOnFloor({ host, roundId, seat: max })
    await waitFor(() => openClueOf(zoe) === 1, 'the second clue to open early')
    await takeFloor({ roundId, seat: zoe })
    await sleep(3_000)
    judge({ host, isCorrect: true, roundId, seat: zoe })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    const awards = hostView(host)?.round?.awards ?? []
    const won = awards.find(({ playerId }) => playerId === idOf(zoe))
    const clockShare = worthOfClue(1) / 10

    expect(cluesRound(hostView(host))?.standings).toContainEqual({
      clueIndex: 1,
      playerId: idOf(zoe),
      status: 'found'
    })
    expect(won?.points).toBeLessThanOrEqual(worthOfClue(1))
    expect(won?.speedBonus).toBeGreaterThan(clockShare * 0.9)
    expect(awards.find(({ playerId }) => playerId === idOf(max))?.points).toBe(
      0
    )
    expect(
      hostView(host)?.players.find(({ id }) => id === idOf(zoe))?.score
    ).toBe(won?.points)
  }, 15_000)

  it('[fiveclues] sits a seated console out of a buzzer round and hands it the country to judge', async () => {
    const { host, zoe } = await roundInPlay({
      consoleName: 'Marina',
      mode: 'buzzer'
    })
    const consoleSeat = hostView(host)?.youId

    expect(consoleSeat).not.toBeNull()
    expect(playerView(zoe)?.round?.openedWithPlayerIds).not.toContain(
      consoleSeat
    )
    expect(hostView(host)?.currentContent).toEqual({
      answer: { name: ANSWER.answer, subject: 'country' },
      kind: 'fiveclues'
    })
    expect(cluesRound(hostView(host))?.yourStanding).toBeNull()
  })

  it.each([
    { consoleName: undefined, label: 'a console' },
    { consoleName: 'Marina', label: 'a seated console' }
  ])(
    '[fiveclues] sends no seat or wall the country before the reveal, $label alone holding it to judge',
    async ({ consoleName }) => {
      const { host, max, roundId, wall, zoe } = await roundInPlay({
        consoleName,
        mode: 'buzzer'
      })

      for (const clueIndex of LADDER.keys()) {
        await missOnFloor({ host, roundId, seat: zoe })
        await missOnFloor({ host, roundId, seat: max })
        await waitFor(
          () =>
            clueIndex === LADDER.length - 1
              ? playerView(zoe)?.phase === 'revealed'
              : openClueOf(zoe) === clueIndex + 1,
          `everyone to have missed on clue ${clueIndex + 1}`
        )
      }

      for (const peer of [zoe, max, wall]) {
        expect(leaksIn(peer.frames)).toEqual([])
      }

      const consoleLeaks = leaksIn(host.frames)

      expect(consoleLeaks).toContain(ANSWER.answer)
      expect(
        consoleLeaks.filter((mark) => !COUNTRY_MARKS.includes(mark))
      ).toEqual([])
    },
    20_000
  )
})
