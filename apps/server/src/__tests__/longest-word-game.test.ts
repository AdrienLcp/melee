import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_LONGEST_WORD_SETTINGS,
  type LongestWordSettings
} from '@melee/protocol/game'
import type { HostToken } from '@melee/protocol/identifiers'
import {
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings,
  type RoundContent,
  type RoundView
} from '@melee/protocol/room'
import { MOST_A_ROUND_PAYS, MOST_THE_CLOCK_PAYS } from '@melee/protocol/scoring'
import {
  type PlayerServerMessage,
  type WallServerMessage,
  wallServerMessageSchema
} from '@melee/protocol/server-message'
import { PROTOCOL_VERSION } from '@melee/protocol/version'

import { pointsForLetters } from '@melee/core/longestword/letters-pay'

import { startRoomHarness } from './node-room-harness'
import {
  answerShareOf,
  basePointsFor,
  errorsIn,
  hostView,
  type Peer,
  playerView,
  type RoomHarness,
  waitFor
} from './room-harness'

/** The draw the mocked bank deals every round, solved against the real French forms: its longest are nine letters. */
const LETTERS = ['P', 'A', 'T', 'R', 'O', 'N', 'S', 'E', 'I']

const BEST = 'INTERPOSA'

vi.mock('@/infrastructure/questions/word-bank', async (importOriginal) => {
  const bank =
    await importOriginal<
      typeof import('@/infrastructure/questions/word-bank')
    >()

  return {
    ...bank,
    drawLongestWord: ({
      language
    }: Parameters<typeof bank.drawLongestWord>[0]) =>
      bank.solvedLongestWordDraw({ language, letters: LETTERS })
  }
})

const GAME: LongestWordSettings = {
  ...DEFAULT_LONGEST_WORD_SETTINGS,
  roundDurationMs: 60_000
}

const LONGEST_WORD: RoomSettings = {
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game: GAME,
  lineUp: [GAME],
  lineUpAt: 0,
  mode: DEFAULT_MODE_SETTINGS.letters,
  roundCount: 3
}

const draw = (
  view: { round: RoundView | null } | null
): Extract<RoundContent, { kind: 'longestword' }> | null => {
  const content = view?.round?.content

  return content?.kind === 'longestword' ? content : null
}

const transcriptOf = (frames: { raw: string }[]): string =>
  frames.map(({ raw }) => raw).join('')

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
  hostNickname
}: {
  /** Seats the console under this name. */
  hostNickname?: string
} = {}) => {
  const { code, host, hostToken } = await harness.openRoom(
    LONGEST_WORD,
    hostNickname
  )
  const wall = await pairedWall({ code, hostToken })
  const zoe = await harness.seat({ code, nickname: 'Zoe' })
  const max = await harness.seat({ code, nickname: 'Max' })
  const lou = await harness.seat({ code, nickname: 'Lou' })

  host.send({ type: 'host.startRound' })
  await waitFor(() => playerView(zoe)?.phase === 'playing', 'the draw')

  return {
    host,
    lou,
    max,
    roundId: playerView(zoe)?.round?.id ?? '',
    wall,
    zoe
  }
}

const wordsOf = (seat: Peer<PlayerServerMessage>): number =>
  draw(playerView(seat))?.yourWords?.length ?? 0

const sendWord = async ({
  guess,
  roundId,
  seat
}: {
  guess: string
  roundId: string
  seat: Peer<PlayerServerMessage>
}): Promise<void> => {
  const before = wordsOf(seat)
  const refusals = errorsIn(seat).length

  seat.send({
    answer: { guess, kind: 'letters' },
    roundId,
    type: 'player.answer'
  })
  await waitFor(
    () => wordsOf(seat) > before || errorsIn(seat).length > refusals,
    `the word ${guess} to land or be refused`
  )
}

const leanWord = ({
  guess,
  roundId,
  seat
}: {
  guess: string
  roundId: string
  seat: Peer<PlayerServerMessage>
}): void => {
  seat.send({
    answer: { guess, kind: 'letters' },
    roundId,
    type: 'player.lean'
  })
}

/** A lean is answered with no frame, so a ping behind it on the same socket says it was read. */
const leansRead = async (
  seats: readonly Peer<PlayerServerMessage>[]
): Promise<void> => {
  for (const seat of seats) {
    seat.send({ clientSentAt: 1, type: 'time.ping' })
  }

  await waitFor(
    () =>
      seats.every((seat) =>
        seat.frames.some(({ message }) => message.type === 'time.pong')
      ),
    'the leans to be read'
  )
}

const idOf = (seat: Peer<PlayerServerMessage>) =>
  playerView(seat)?.youId ?? null

const lengthOf = ({
  seat,
  view
}: {
  seat: Peer<PlayerServerMessage>
  view: { round: RoundView | null } | null
}) =>
  draw(view)?.lengths.find(({ playerId }) => playerId === idOf(seat))?.length

describe('a longest-word round through the seam', () => {
  it('[longestword] shows every screen the draw, and its longest words to a seatless console alone', async () => {
    const { host, wall, zoe } = await roundInPlay()

    expect(draw(playerView(zoe))).toEqual({
      bestLength: null,
      bestWords: null,
      kind: 'longestword',
      language: 'fr',
      lengths: [],
      letters: LETTERS,
      revealedWords: null,
      yourWords: []
    })
    expect(hostView(host)?.currentContent).toEqual({
      bestLength: 9,
      bestWords: expect.arrayContaining([BEST]),
      kind: 'longestword'
    })
    expect(wallView(wall)?.currentContent).toEqual({ kind: 'longestword' })
    expect(draw(wallView(wall))?.yourWords).toBeNull()
    expect(playerView(zoe)?.yourVerdict).toBeNull()
  })

  it('[longestword] sends no seat’s word to another seat, the wall or a seated console before the reveal, only its length', async () => {
    const { host, max, roundId, wall, zoe } = await roundInPlay({
      hostNickname: 'Marina'
    })

    await sendWord({ guess: 'patron', roundId, seat: zoe })
    await sendWord({ guess: 'SAPIN', roundId, seat: max })

    expect(draw(playerView(zoe))?.yourWords).toEqual(['PATRON'])
    expect(lengthOf({ seat: zoe, view: playerView(max) })).toBe(6)
    expect(lengthOf({ seat: zoe, view: wallView(wall) })).toBe(6)
    expect(lengthOf({ seat: zoe, view: hostView(host) })).toBe(6)
    expect(hostView(host)?.currentContent).toEqual({
      bestLength: null,
      bestWords: null,
      kind: 'longestword'
    })
    for (const peer of [max, wall, host]) {
      expect(transcriptOf(peer.frames)).not.toContain('PATRON')
    }
    for (const peer of [zoe, wall, host]) {
      expect(transcriptOf(peer.frames)).not.toContain('SAPIN')
    }
    for (const peer of [zoe, max, wall, host]) {
      expect(transcriptOf(peer.frames)).not.toContain(BEST)
    }

    host.send({ roundId, type: 'host.reveal' })
    await waitFor(() => playerView(max)?.phase === 'revealed', 'the reveal')

    const revealed = draw(playerView(max))

    expect(revealed?.revealedWords).toEqual(
      expect.arrayContaining([
        { playerId: idOf(zoe), word: 'PATRON' },
        { playerId: idOf(max), word: 'SAPIN' }
      ])
    )
    expect(revealed?.bestLength).toBe(9)
    expect(revealed?.bestWords).toContain(BEST)
  })

  it('[longestword] refuses a letter used twice, a letter the draw lacks and what is not a word, each at no cost', async () => {
    const { roundId, zoe } = await roundInPlay()

    for (const guess of ['TETE', 'BATEAU', 'PA-TRON', 'SNORE']) {
      await sendWord({ guess, roundId, seat: zoe })
    }

    expect(errorsIn(zoe).map(({ code }) => code)).toEqual([
      'letter_not_in_draw',
      'letter_not_in_draw',
      'not_one_word',
      'not_in_dictionary'
    ])
    expect(draw(playerView(zoe))?.yourWords).toEqual([])

    await sendWord({ guess: 'PATRONS', roundId, seat: zoe })

    expect(draw(playerView(zoe))?.yourWords).toEqual(['PATRONS'])
    expect(errorsIn(zoe)).toHaveLength(4)
  })

  it('[longestword] keeps a seat’s longest word: a longer one replaces it, one as long does not', async () => {
    const { host, max, roundId, zoe } = await roundInPlay()

    for (const guess of ['RAT', 'SAPIN', 'PINTE', 'PATRON', 'TAPIS']) {
      await sendWord({ guess, roundId, seat: zoe })
    }

    expect(draw(playerView(zoe))?.yourWords).toEqual([
      'RAT',
      'SAPIN',
      'PINTE',
      'PATRON',
      'TAPIS'
    ])
    expect(lengthOf({ seat: zoe, view: playerView(max) })).toBe(6)

    await sendWord({ guess: 'SAPIN', roundId, seat: max })
    await sendWord({ guess: 'PINTE', roundId, seat: max })
    host.send({ roundId, type: 'host.reveal' })
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    const revealed = draw(playerView(zoe))?.revealedWords
    const said = hostView(host)?.round?.revealedAnswers

    expect(revealed).toEqual(
      expect.arrayContaining([
        { playerId: idOf(zoe), word: 'PATRON' },
        { playerId: idOf(max), word: 'SAPIN' }
      ])
    )
    expect(said?.find(({ playerId }) => playerId === idOf(max))?.said).toBe(
      'SAPIN'
    )
  })

  it('[longestword] pays the best word the whole round, a shorter one its share and three letters nothing', async () => {
    const { host, lou, max, roundId, zoe } = await roundInPlay()

    await sendWord({ guess: BEST, roundId, seat: zoe })
    await sendWord({ guess: 'PATRON', roundId, seat: max })
    await sendWord({ guess: 'RAT', roundId, seat: lou })
    host.send({ roundId, type: 'host.reveal' })
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    const view = hostView(host)
    const awardOf = (seat: Peer<PlayerServerMessage>) =>
      view?.round?.awards.find((award) => award.playerId === idOf(seat))

    expect(basePointsFor({ playerId: idOf(zoe), view })).toBe(
      answerShareOf(MOST_A_ROUND_PAYS)
    )
    expect(basePointsFor({ playerId: idOf(max), view })).toBe(
      answerShareOf(pointsForLetters({ bestLength: 9, length: 6 }))
    )
    expect(awardOf(zoe)?.speedBonus).toBeGreaterThan(0)
    expect(awardOf(max)?.speedBonus).toBe(0)
    expect(awardOf(lou)?.points).toBe(0)
    expect(awardOf(max)?.verdict).toEqual({
      bestLength: 9,
      kind: 'letters',
      length: 6
    })
    expect(playerView(max)?.yourVerdict).toEqual({
      bestLength: 9,
      kind: 'letters',
      length: 6
    })
  })

  it('[longestword] pays the word left on a row unsent at the close, checked like a sent one and never shown before the reveal', async () => {
    const { host, lou, max, roundId, wall, zoe } = await roundInPlay()

    await sendWord({ guess: 'SAPIN', roundId, seat: lou })
    leanWord({ guess: 'patron', roundId, seat: zoe })
    leanWord({ guess: 'SNORE', roundId, seat: max })
    leanWord({ guess: 'PATRONS', roundId, seat: lou })
    await leansRead([zoe, max, lou])

    expect(errorsIn(max)).toEqual([])
    for (const peer of [zoe, max, lou, wall, host]) {
      expect(transcriptOf(peer.frames)).not.toContain('PATRON')
    }

    host.send({ roundId, type: 'host.reveal' })
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    const view = hostView(host)
    const awardOf = (seat: Peer<PlayerServerMessage>) =>
      view?.round?.awards.find((award) => award.playerId === idOf(seat))

    expect(awardOf(zoe)).toMatchObject({
      isUnsent: true,
      points: answerShareOf(pointsForLetters({ bestLength: 9, length: 6 })),
      speedBonus: 0,
      verdict: { length: 6 }
    })
    expect(awardOf(lou)).toMatchObject({
      isUnsent: true,
      speedBonus: 0,
      verdict: { length: 7 }
    })
    expect(awardOf(max)?.points ?? 0).toBe(0)
    expect(draw(playerView(zoe))?.revealedWords).toEqual(
      expect.arrayContaining([
        { playerId: idOf(zoe), word: 'PATRON' },
        { playerId: idOf(lou), word: 'PATRONS' }
      ])
    )
    expect(
      draw(playerView(max))?.revealedWords?.some(
        ({ playerId }) => playerId === idOf(max)
      )
    ).toBe(false)
  })

  it('[longestword] leaves a sent word standing over a shorter one left on the row', async () => {
    const { host, roundId, zoe } = await roundInPlay()

    await sendWord({ guess: 'PATRON', roundId, seat: zoe })
    leanWord({ guess: 'RAT', roundId, seat: zoe })
    await leansRead([zoe])
    host.send({ roundId, type: 'host.reveal' })
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    expect(
      hostView(host)?.round?.awards.find(
        ({ playerId }) => playerId === idOf(zoe)
      )
    ).toMatchObject({ isUnsent: false, verdict: { length: 6 } })
    expect(draw(playerView(zoe))?.revealedWords).toContainEqual({
      playerId: idOf(zoe),
      word: 'PATRON'
    })
  })

  it('[longestword] closes once every seat holds a word as long as the best, timing it when that word was sent', async () => {
    const waitedMs = 1_000
    const { host, lou, max, roundId, zoe } = await roundInPlay()

    await sendWord({ guess: 'RAT', roundId, seat: zoe })
    await new Promise((resolve) => setTimeout(resolve, waitedMs))
    await sendWord({ guess: BEST, roundId, seat: zoe })
    await sendWord({ guess: 'POINTERAS', roundId, seat: max })

    expect(playerView(zoe)?.phase).toBe('playing')

    await sendWord({ guess: 'PATRON', roundId, seat: zoe })

    expect(errorsIn(zoe).map(({ code }) => code)).toEqual(['already_buzzed'])

    await sendWord({ guess: BEST, roundId, seat: lou })
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    const award = hostView(host)?.round?.awards.find(
      ({ playerId }) => playerId === idOf(zoe)
    )

    expect(award?.speedBonus).toBeGreaterThan(0)
    expect(award?.speedBonus).toBeLessThanOrEqual(
      Math.round(MOST_THE_CLOCK_PAYS * (1 - waitedMs / GAME.roundDurationMs))
    )
  })
})
