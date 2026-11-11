import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_MYSTERY_WORD_SETTINGS,
  type MysteryWordSettings
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

import { pointsForWord } from '@melee/core/mysteryword/word-pay'

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

/** The words the mocked bank hides, in the order it deals them while each is unplayed. */
const HIDDEN = ['BOUCLE', 'BATEAU']

/** French words of six letters starting with B, none of them `BOUCLE`. */
const MISSES = ['BELLES', 'BALLES', 'BILLES', 'BALLET', 'BILLET', 'BUREAU']

vi.mock('@/infrastructure/questions/word-bank', async (importOriginal) => {
  const bank =
    await importOriginal<
      typeof import('@/infrastructure/questions/word-bank')
    >()

  return {
    ...bank,
    drawMysteryWord: ({
      language,
      playedIds
    }: Parameters<typeof bank.drawMysteryWord>[0]) => {
      const word = HIDDEN.find(
        (hidden) =>
          !playedIds.has(bank.playedMysteryWordId({ language, word: hidden }))
      )

      return word === undefined ? null : { tier: 'easy' as const, word }
    }
  }
})

const GAME: MysteryWordSettings = {
  ...DEFAULT_MYSTERY_WORD_SETTINGS,
  roundDurationMs: 60_000
}

const MYSTERY_WORD: RoomSettings = {
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game: GAME,
  lineUp: [GAME],
  lineUpAt: 0,
  mode: DEFAULT_MODE_SETTINGS.word,
  roundCount: 3
}

const wordRound = (
  view: { round: RoundView | null } | null
): Extract<RoundContent, { kind: 'mysteryword' }> | null => {
  const content = view?.round?.content

  return content?.kind === 'mysteryword' ? content : null
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
    MYSTERY_WORD,
    hostNickname
  )
  const wall = await pairedWall({ code, hostToken })
  const zoe = await harness.seat({ code, nickname: 'Zoe' })
  const max = await harness.seat({ code, nickname: 'Max' })
  const lou = await harness.seat({ code, nickname: 'Lou' })

  host.send({ type: 'host.startRound' })
  await waitFor(() => playerView(zoe)?.phase === 'playing', 'the word to hide')

  return {
    host,
    lou,
    max,
    roundId: playerView(zoe)?.round?.id ?? '',
    wall,
    zoe
  }
}

const triesOf = (seat: Peer<PlayerServerMessage>): number =>
  wordRound(playerView(seat))?.yourTries?.length ?? 0

const sendTry = async ({
  guess,
  roundId,
  seat
}: {
  guess: string
  roundId: string
  seat: Peer<PlayerServerMessage>
}): Promise<void> => {
  const before = triesOf(seat)
  const refusals = errorsIn(seat).length

  seat.send({ answer: { guess, kind: 'word' }, roundId, type: 'player.answer' })
  await waitFor(
    () => triesOf(seat) > before || errorsIn(seat).length > refusals,
    `the try ${guess} to land or be refused`
  )
}

const idOf = (seat: Peer<PlayerServerMessage>) =>
  playerView(seat)?.youId ?? null

describe('a mystery-word round through the seam', () => {
  it('[mysteryword] shows every screen the first letter and the length, and the word to a seatless console alone', async () => {
    const { host, wall, zoe } = await roundInPlay()
    const round = wordRound(playerView(zoe))

    expect(round).toEqual({
      firstLetter: 'B',
      grids: [],
      kind: 'mysteryword',
      language: 'fr',
      length: 6,
      revealedGrids: null,
      revealedWord: null,
      yourTries: []
    })
    expect(hostView(host)?.currentContent).toEqual({
      kind: 'mysteryword',
      word: 'BOUCLE'
    })
    expect(wallView(wall)?.currentContent).toEqual({ kind: 'mysteryword' })
    expect(wordRound(wallView(wall))?.yourTries).toBeNull()
  })

  it('[mysteryword] sends no frame carrying the word before the reveal, to a seat, the wall or a seated console', async () => {
    const { host, max, roundId, wall, zoe } = await roundInPlay({
      hostNickname: 'Marina'
    })

    expect(hostView(host)?.youId).not.toBeNull()

    await sendTry({ guess: 'BELLES', roundId, seat: zoe })
    await sendTry({ guess: 'BALLET', roundId, seat: max })
    host.send({
      answer: { guess: 'BUREAU', kind: 'word' },
      roundId,
      type: 'player.answer'
    })
    await waitFor(
      () => (wordRound(hostView(host))?.yourTries?.length ?? 0) === 1,
      'the console’s own try to land'
    )

    expect(hostView(host)?.currentContent).toEqual({
      kind: 'mysteryword',
      word: null
    })
    for (const peer of [zoe, max, wall, host]) {
      expect(transcriptOf(peer.frames)).not.toContain('BOUCLE')
    }

    host.send({ roundId, type: 'host.reveal' })
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    expect(wordRound(playerView(zoe))?.revealedWord).toBe('BOUCLE')
  })

  it('[mysteryword] shows another seat’s grid as colours, never its letters, and its own with them', async () => {
    const { max, roundId, wall, zoe } = await roundInPlay()

    await sendTry({ guess: 'belles', roundId, seat: max })

    // BOUCLE holds one L and one E: the second of each is absent.
    const marks = ['placed', 'present', 'present', 'absent', 'absent', 'absent']

    expect(wordRound(playerView(max))?.yourTries).toEqual([
      { marks, word: 'BELLES' }
    ])
    expect(wordRound(playerView(zoe))?.grids).toEqual([
      { playerId: idOf(max), rows: [marks] }
    ])
    expect(wordRound(wallView(wall))?.grids).toEqual([
      { playerId: idOf(max), rows: [marks] }
    ])
    for (const peer of [zoe, wall]) {
      expect(transcriptOf(peer.frames)).not.toContain('BELLES')
    }
  })

  it('[mysteryword] refuses a line that is not one word, the wrong length, the wrong first letter or no word at all, each at no cost', async () => {
    const { roundId, zoe } = await roundInPlay()

    for (const guess of ['BL-ANC', 'BOUCLES', 'CABLES', 'BEHIND']) {
      await sendTry({ guess, roundId, seat: zoe })
    }

    expect(errorsIn(zoe).map(({ code }) => code)).toEqual([
      'not_one_word',
      'wrong_length',
      'wrong_first_letter',
      'not_in_dictionary'
    ])
    expect(wordRound(playerView(zoe))?.yourTries).toEqual([])

    for (const guess of MISSES) {
      await sendTry({ guess, roundId, seat: zoe })
    }

    expect(wordRound(playerView(zoe))?.yourTries).toHaveLength(6)
    expect(errorsIn(zoe)).toHaveLength(4)
  })

  it('[mysteryword] refuses a seventh try, and any try once the word is found', async () => {
    const { max, roundId, zoe } = await roundInPlay()

    for (const guess of MISSES) {
      await sendTry({ guess, roundId, seat: zoe })
    }
    await sendTry({ guess: 'BATEAU', roundId, seat: zoe })
    await sendTry({ guess: 'BOUCLE', roundId, seat: max })
    await sendTry({ guess: 'BELLES', roundId, seat: max })

    expect(errorsIn(zoe).map(({ code }) => code)).toEqual(['already_buzzed'])
    expect(errorsIn(max).map(({ code }) => code)).toEqual(['already_buzzed'])
    expect(wordRound(playerView(zoe))?.yourTries).toHaveLength(6)
    expect(wordRound(playerView(max))?.yourTries).toHaveLength(1)
    expect(playerView(zoe)?.phase).toBe('playing')
  })

  it('[mysteryword] closes early once every seat has found the word or spent its tries, paying the second try more than the third and a word not found nothing', async () => {
    const { host, lou, max, roundId, zoe } = await roundInPlay()

    await sendTry({ guess: 'BELLES', roundId, seat: zoe })
    await sendTry({ guess: 'BOUCLE', roundId, seat: zoe })
    for (const guess of ['BELLES', 'BALLES', 'BOUCLE']) {
      await sendTry({ guess, roundId, seat: max })
    }
    for (const guess of MISSES.slice(0, -1)) {
      await sendTry({ guess, roundId, seat: lou })
    }

    expect(playerView(lou)?.phase).toBe('playing')

    await sendTry({ guess: MISSES.at(-1) ?? '', roundId, seat: lou })
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    const view = hostView(host)
    const awardOf = (seat: Peer<PlayerServerMessage>) =>
      view?.round?.awards.find((award) => award.playerId === idOf(seat))

    expect(basePointsFor({ playerId: idOf(zoe), view })).toBe(
      answerShareOf(MOST_A_ROUND_PAYS)
    )
    expect(basePointsFor({ playerId: idOf(max), view })).toBe(
      answerShareOf(pointsForWord({ foundOnTry: 3 }))
    )
    expect(awardOf(zoe)?.speedBonus).toBeGreaterThan(0)
    expect(awardOf(max)?.speedBonus).toBe(0)
    expect(awardOf(lou)?.points).toBe(0)
    expect(awardOf(zoe)?.verdict).toMatchObject({ foundOnTry: 2, kind: 'word' })
    expect(awardOf(lou)?.verdict).toMatchObject({
      foundOnTry: null,
      kind: 'word'
    })
    expect(
      wordRound(playerView(lou))
        ?.revealedGrids?.find(({ playerId }) => playerId === idOf(max))
        ?.tries.map(({ word }) => word)
    ).toEqual(['BELLES', 'BALLES', 'BOUCLE'])
  })

  it('[mysteryword] times a found word at the try that found it, not the first', async () => {
    const waitedMs = 1_000
    const { host, lou, max, roundId, zoe } = await roundInPlay()

    await sendTry({ guess: 'BELLES', roundId, seat: zoe })
    await new Promise((resolve) => setTimeout(resolve, waitedMs))
    await sendTry({ guess: 'BOUCLE', roundId, seat: zoe })
    for (const seat of [max, lou]) {
      await sendTry({ guess: 'BOUCLE', roundId, seat })
    }
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    const award = hostView(host)?.round?.awards.find(
      ({ playerId }) => playerId === idOf(zoe)
    )

    expect(award?.speedBonus).toBeGreaterThan(0)
    expect(award?.speedBonus).toBeLessThanOrEqual(
      Math.round(MOST_THE_CLOCK_PAYS * (1 - waitedMs / GAME.roundDurationMs))
    )
  })

  it('[mysteryword] never deals an evening the same word twice, and says so once every word is spent', async () => {
    const { host, roundId } = await roundInPlay()

    host.send({ roundId, type: 'host.reveal' })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')
    host.send({ type: 'host.nextRound' })
    await waitFor(
      () =>
        hostView(host)?.phase === 'playing' &&
        hostView(host)?.round?.id !== roundId,
      'the second word'
    )

    expect(hostView(host)?.currentContent).toEqual({
      kind: 'mysteryword',
      word: 'BATEAU'
    })

    host.send({
      roundId: hostView(host)?.round?.id ?? '',
      type: 'host.reveal'
    })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')
    host.send({ type: 'host.nextRound' })
    await waitFor(() => errorsIn(host).length > 0, 'the spent bank')

    expect(errorsIn(host).map(({ code }) => code)).toContain(
      'no_content_available'
    )
  })
})
