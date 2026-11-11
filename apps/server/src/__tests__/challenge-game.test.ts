import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  CHALLENGE_HAND_SIZE,
  type ChallengeFinisher,
  type ChallengeLabels
} from '@melee/protocol/challenge'
import { DEFAULT_CHALLENGE_SETTINGS } from '@melee/protocol/game'
import type { HostToken } from '@melee/protocol/identifiers'
import {
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings
} from '@melee/protocol/room'
import {
  type HostServerMessage,
  type PlayerServerMessage,
  type WallServerMessage,
  wallServerMessageSchema
} from '@melee/protocol/server-message'
import { PROTOCOL_VERSION } from '@melee/protocol/version'

import { LETTER_SLOT, SLOT_LETTERS } from '@melee/core/challenge/letter-slot'
import { pointsForPlace } from '@melee/core/challenge/place-pay'

import { bankedChallengeLines } from '@/infrastructure/questions/challenge-bank'

import { startRoomHarness } from './node-room-harness'
import {
  challengeRound,
  errorsIn,
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

const CHALLENGE_GAME: RoomSettings = {
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game: DEFAULT_CHALLENGE_SETTINGS,
  lineUp: [DEFAULT_CHALLENGE_SETTINGS],
  lineUpAt: 0,
  mode: DEFAULT_MODE_SETTINGS.buzzer,
  roundCount: null
}

const ON_A_TRACK: RoomSettings = {
  ...CHALLENGE_GAME,
  board: {
    catchUp: false,
    kind: 'track',
    length: 10,
    strategy: 'onePointOneCase'
  },
  teams: { count: 3, kind: 'drawn' }
}

const POTATOES = 'Stack the most raclette potatoes'

const idOf = (player: Peer<PlayerServerMessage>): string =>
  playerView(player)?.youId ?? ''

const scoresOf = (host: Peer<HostServerMessage>, nicknames: string[]) =>
  nicknames.map(
    (nickname) =>
      hostView(host)?.players.find((player) => player.nickname === nickname)
        ?.score
  )

const seatFor = (playerId: string): ChallengeFinisher['target'] => ({
  kind: 'seat',
  playerId
})

let harness: RoomHarness

beforeEach(async () => {
  harness = await startRoomHarness()
})

afterEach(async () => {
  await harness.stop()
})

const openChallenge = async () => {
  const { code, host } = await harness.openRoom(CHALLENGE_GAME)
  const anna = await harness.seat({ code, nickname: 'Anna' })
  const ben = await harness.seat({ code, nickname: 'Ben' })
  const chloe = await harness.seat({ code, nickname: 'Chloe' })
  const dan = await harness.seat({ code, nickname: 'Dan' })

  host.send({ challengeText: POTATOES, type: 'host.startRound' })
  await waitFor(() => hostView(host)?.phase === 'playing', 'the challenge')

  return {
    anna,
    ben,
    chloe,
    dan,
    host,
    roundId: hostView(host)?.round?.id ?? ''
  }
}

const awardPlaces = async ({
  host,
  places,
  roundId
}: {
  host: Peer<HostServerMessage>
  places: ChallengeFinisher[]
  roundId: string
}) => {
  const framesBefore = host.frames.length

  host.send({ places, roundId, type: 'host.awardPlaces' })
  await waitFor(
    () => host.frames.length > framesBefore,
    'the placement to land'
  )
}

describe('a challenge played at the table', () => {
  it('[challenge] puts what the host typed on every screen', async () => {
    const { anna, host } = await openChallenge()

    expect(challengeRound(playerView(anna))?.labels).toEqual({
      en: POTATOES,
      fr: POTATOES
    })
    expect(challengeRound(hostView(host))?.labels).toEqual({
      en: POTATOES,
      fr: POTATOES
    })
    expect(hostView(host)?.currentContent).toEqual({ kind: 'challenge' })
  })

  it('[challenge] pays the whole round, two thirds and one third down the podium, and reveals', async () => {
    const { anna, ben, chloe, dan, host, roundId } = await openChallenge()

    await awardPlaces({
      host,
      places: [
        { place: 1, target: seatFor(idOf(chloe)) },
        { place: 2, target: seatFor(idOf(anna)) },
        { place: 3, target: seatFor(idOf(dan)) }
      ],
      roundId
    })

    expect(hostView(host)?.phase).toBe('revealed')
    expect(scoresOf(host, ['Anna', 'Ben', 'Chloe', 'Dan'])).toEqual([
      pointsForPlace(2),
      0,
      pointsForPlace(1),
      pointsForPlace(3)
    ])
    expect(playerView(ben)?.round?.awards).toHaveLength(3)
  })

  it('[challenge] lets two finishers share a place', async () => {
    const { anna, ben, chloe, host, roundId } = await openChallenge()

    await awardPlaces({
      host,
      places: [
        { place: 1, target: seatFor(idOf(anna)) },
        { place: 1, target: seatFor(idOf(ben)) },
        { place: 2, target: seatFor(idOf(chloe)) }
      ],
      roundId
    })

    expect(scoresOf(host, ['Anna', 'Ben', 'Chloe'])).toEqual([
      pointsForPlace(1),
      pointsForPlace(1),
      pointsForPlace(2)
    ])
  })

  it('[challenge] rebuilds a placement corrected on its reveal rather than adding to it', async () => {
    const { anna, ben, host, roundId } = await openChallenge()

    await awardPlaces({
      host,
      places: [{ place: 1, target: seatFor(idOf(anna)) }],
      roundId
    })
    await awardPlaces({
      host,
      places: [
        { place: 1, target: seatFor(idOf(ben)) },
        { place: 3, target: seatFor(idOf(anna)) }
      ],
      roundId
    })

    expect(errorsIn(host)).toEqual([])
    expect(scoresOf(host, ['Anna', 'Ben'])).toEqual([
      pointsForPlace(3),
      pointsForPlace(1)
    ])
    expect(hostView(host)?.round?.awards).toHaveLength(2)
  })

  it('[challenge] refuses a placement before the table has started', async () => {
    const { code, host } = await harness.openRoom({
      ...CHALLENGE_GAME,
      countdownMs: 10_000
    })
    const anna = await harness.seat({ code, nickname: 'Anna' })

    host.send({ challengeText: POTATOES, type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'countdown', 'the countdown')
    await awardPlaces({
      host,
      places: [{ place: 1, target: seatFor(idOf(anna)) }],
      roundId: hostView(host)?.round?.id ?? ''
    })

    expect(errorsIn(host).map((error) => error.code)).toEqual(['wrong_phase'])
    expect(scoresOf(host, ['Anna'])).toEqual([0])
  })

  it('[challenge] refuses a placement in a round of another game', async () => {
    const { code, host } = await harness.openRoom({
      ...CHALLENGE_GAME,
      game: { kind: 'buzzer', locksOutOnMiss: true },
      lineUp: [{ kind: 'buzzer', locksOutOnMiss: true }]
    })
    const anna = await harness.seat({ code, nickname: 'Anna' })

    host.send({ type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the round')
    await awardPlaces({
      host,
      places: [{ place: 1, target: seatFor(idOf(anna)) }],
      roundId: hostView(host)?.round?.id ?? ''
    })

    expect(errorsIn(host).map((error) => error.code)).toEqual(['wrong_phase'])
    expect(hostView(host)?.phase).toBe('playing')
  })

  it('[challenge] refuses a buzz, because the challenge is not on a screen', async () => {
    const { anna, host, roundId } = await openChallenge()

    anna.send({ roundId, type: 'player.buzz' })
    await waitFor(() => errorsIn(anna).length > 0, 'the refusal')

    expect(errorsIn(anna).map((error) => error.code)).toEqual(['wrong_phase'])
    expect(hostView(host)?.phase).toBe('playing')
  })
})

describe('a challenge between teams on a track', () => {
  it('[challenge] walks the podium three, two and one cases, paid once per team', async () => {
    const { code, host } = await harness.openRoom(ON_A_TRACK)
    const seats = await Promise.all(
      ['Anna', 'Ben', 'Chloe', 'Dan', 'Eve', 'Fred'].map((nickname) =>
        harness.seat({ code, nickname })
      )
    )
    const [anna, ben, chloe, dan, eve, fred] = seats.map(idOf)

    host.send({
      assignment: [
        [anna ?? '', ben ?? ''],
        [chloe ?? '', dan ?? ''],
        [eve ?? '', fred ?? '']
      ],
      type: 'host.drawTeams'
    })
    host.send({ challengeText: POTATOES, type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the challenge')
    await awardPlaces({
      host,
      places: [
        { place: 2, target: { kind: 'team', teamId: 'team-1' } },
        { place: 1, target: { kind: 'team', teamId: 'team-2' } },
        { place: 3, target: { kind: 'team', teamId: 'team-3' } }
      ],
      roundId: hostView(host)?.round?.id ?? ''
    })

    expect(hostView(host)?.teams.map((team) => team.board)).toEqual([
      { case: 2, move: 2 },
      { case: 3, move: 3 },
      { case: 1, move: 1 }
    ])

    expect(hostView(host)?.teams.map((team) => team.score)).toEqual([
      pointsForPlace(2),
      pointsForPlace(1),
      pointsForPlace(3)
    ])
  })

  it('[challenge] refuses a seat placed in a room playing in teams', async () => {
    const { code, host } = await harness.openRoom(ON_A_TRACK)
    const anna = await harness.seat({ code, nickname: 'Anna' })
    await harness.seat({ code, nickname: 'Ben' })
    await harness.seat({ code, nickname: 'Chloe' })

    host.send({ challengeText: POTATOES, type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the challenge')
    await awardPlaces({
      host,
      places: [{ place: 1, target: seatFor(idOf(anna)) }],
      roundId: hostView(host)?.round?.id ?? ''
    })

    expect(errorsIn(host).map((error) => error.code)).toEqual([
      'invalid_message'
    ])
  })
})

const isBankedLine = (labels: ChallengeLabels | null | undefined) =>
  bankedChallengeLines().some(({ labels: banked }) =>
    SLOT_LETTERS.some(
      (letter) => banked.en.replaceAll(LETTER_SLOT, letter) === labels?.en
    )
  )

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
  await waitFor(() => wall.frames.length > 0, 'the wall to be welcomed')

  return wall
}

/** A room that deals every line, with its wall and one seat. */
const openDealtChallenge = async (settings: RoomSettings = CHALLENGE_GAME) => {
  const { code, host, hostToken } = await harness.openRoom(settings)
  const wall = await pairedWall({ code, hostToken })
  const anna = await harness.seat({ code, nickname: 'Anna' })

  await waitFor(
    () => hostView(host)?.challengeHand.length === CHALLENGE_HAND_SIZE,
    'a hand dealt ahead'
  )

  return { anna, host, wall }
}

type DealtRound = {
  ahead: ChallengeLabels | null
  dealt: ChallengeLabels | null
}

/**
 * Opens each round with nothing typed and places nobody, so it reveals. What
 * each round opened on, beside what the console held ahead of it.
 */
const playDealtRounds = async ({
  count,
  host
}: {
  count: number
  host: Peer<HostServerMessage>
}): Promise<DealtRound[]> => {
  const rounds: DealtRound[] = []

  for (let index = 0; index < count; index += 1) {
    const ahead = hostView(host)?.challengeHand[0] ?? null
    const previousId = hostView(host)?.round?.id

    host.send(
      index === 0 ? { type: 'host.startRound' } : { type: 'host.nextRound' }
    )
    await waitFor(
      () =>
        hostView(host)?.phase === 'playing' &&
        hostView(host)?.round?.id !== previousId,
      'the next challenge'
    )
    rounds.push({
      ahead,
      dealt: challengeRound(hostView(host))?.labels ?? null
    })
    await awardPlaces({
      host,
      places: [],
      roundId: hostView(host)?.round?.id ?? ''
    })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')
  }

  return rounds
}

const redeal = async (host: Peer<HostServerMessage>) => {
  const before = hostView(host)?.challengeHand[0]

  host.send({ type: 'host.redealChallenge' })
  await waitFor(
    () => hostView(host)?.challengeHand[0]?.en !== before?.en,
    'another line'
  )
}

describe('a challenge dealt from the bank', () => {
  it('[challenge] opens a round left empty on the line dealt ahead, in every locale', async () => {
    const { anna, host } = await openDealtChallenge()
    const [round] = await playDealtRounds({ count: 1, host })

    expect(round?.dealt).toEqual(round?.ahead)
    expect(isBankedLine(round?.dealt)).toBe(true)
    expect(round?.dealt?.fr).not.toBe(round?.dealt?.en)
    expect(challengeRound(playerView(anna))?.labels).toEqual(round?.dealt)
  })

  it('[challenge] reads a blank typed line as none, and deals', async () => {
    const { host } = await openDealtChallenge()
    const ahead = hostView(host)?.challengeHand[0]

    host.send({ challengeText: '   ', type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the challenge')

    expect(challengeRound(hostView(host))?.labels).toEqual(ahead)
  })

  it('[challenge] keeps the line dealt ahead for later when the host types one', async () => {
    const { host } = await openDealtChallenge()
    const ahead = hostView(host)?.challengeHand[0]

    host.send({ challengeText: POTATOES, type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the challenge')

    expect(challengeRound(hostView(host))?.labels?.en).toBe(POTATOES)
    expect(hostView(host)?.challengeHand[0]).toEqual(ahead)
  })

  it('[challenge] never deals one line twice in an evening', async () => {
    const { host } = await openDealtChallenge()
    const rounds = await playDealtRounds({ count: 6, host })

    expect(new Set(rounds.map((round) => round.dealt?.en)).size).toBe(6)
  })

  it('[challenge] never shows a seat or the wall a line before its round opens', async () => {
    const { anna, host, wall } = await openDealtChallenge()
    const rounds = await playDealtRounds({ count: 3, host })
    const stillAheadLine = hostView(host)?.challengeHand[0]?.fr ?? ''
    const quotedOnTheWire = (line: string) => JSON.stringify(line)
    const transcripts = [anna.frames, wall.frames].map((frames) =>
      frames.map(({ raw }) => raw)
    )

    expect(stillAheadLine).not.toBe('')

    for (const raws of transcripts) {
      expect(raws.join('\n')).not.toContain('nextChallenge')
      expect(raws.join('\n')).not.toContain(quotedOnTheWire(stillAheadLine))

      for (const { dealt } of rounds) {
        const line = quotedOnTheWire(dealt?.fr ?? '')
        const firstShown = raws.findIndex((raw) => raw.includes(line))
        const roundOpened = raws.findIndex(
          (raw) => raw.includes(line) && raw.includes('"countdown"')
        )

        expect(firstShown).toBeGreaterThan(-1)
        expect(firstShown).toBe(roundOpened)
      }
    }
  })

  it('[challenge] deals another line ahead on request, and refuses a player', async () => {
    const { anna, host } = await openDealtChallenge()
    const before = hostView(host)?.challengeHand[0]

    await redeal(host)
    expect(isBankedLine(hostView(host)?.challengeHand[0])).toBe(true)
    expect(hostView(host)?.challengeHand[0]).not.toEqual(before)

    anna.send({ type: 'host.redealChallenge' })
    await waitFor(() => errorsIn(anna).length > 0, 'the refusal')
    expect(errorsIn(anna).map((error) => error.code)).toEqual([
      'host_only_action'
    ])
  })

  it('[challenge] refuses a redeal outside a challenge', async () => {
    const { host } = await harness.openRoom({
      ...CHALLENGE_GAME,
      game: { kind: 'buzzer', locksOutOnMiss: true },
      lineUp: [{ kind: 'buzzer', locksOutOnMiss: true }]
    })

    host.send({ type: 'host.redealChallenge' })
    await waitFor(() => errorsIn(host).length > 0, 'the refusal')

    expect(errorsIn(host).map((error) => error.code)).toEqual([
      'invalid_message'
    ])
    expect(hostView(host)?.challengeHand).toEqual([])
  })

  it('[challenge] opens on the slot of the hand the host picked, and keeps the rest', async () => {
    const { host } = await openDealtChallenge()
    const hand = hostView(host)?.challengeHand ?? []

    host.send({ challengeAt: 2, type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the challenge')

    expect(challengeRound(hostView(host))?.labels).toEqual(hand[2])
    expect(hostView(host)?.challengeHand.slice(0, 2)).toEqual(hand.slice(0, 2))
    expect(hostView(host)?.challengeHand).toHaveLength(CHALLENGE_HAND_SIZE)
    expect(hostView(host)?.challengeHand).not.toContainEqual(hand[2])
  })

  it('[challenge] redeals one slot of the hand alone', async () => {
    const { host } = await openDealtChallenge()
    const hand = hostView(host)?.challengeHand ?? []

    host.send({ at: 1, type: 'host.redealChallenge' })
    await waitFor(
      () => hostView(host)?.challengeHand[1]?.en !== hand[1]?.en,
      'another line in the second slot'
    )

    const redealt = hostView(host)?.challengeHand ?? []

    expect(redealt[0]).toEqual(hand[0])
    expect(redealt[2]).toEqual(hand[2])
    expect(new Set(redealt.map((line) => line.en)).size).toBe(
      CHALLENGE_HAND_SIZE
    )
  })

  it('[challenge] opens on no line when the host says it aloud, and takes nothing from the hand', async () => {
    const { anna, host } = await openDealtChallenge()
    const hand = hostView(host)?.challengeHand

    host.send({ isChallengeSaidAloud: true, type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the challenge')

    expect(challengeRound(hostView(host))).toMatchObject({ labels: null })
    expect(challengeRound(playerView(anna))).toMatchObject({ labels: null })
    expect(hostView(host)?.challengeHand).toEqual(hand)
  })
})

describe('a challenge deck of the evening’s own lines', () => {
  const LINES = [
    'Name every cousin in birth order',
    'Hum the song from the wedding',
    'Draw the house from memory'
  ]
  const lineOf = (text: string) => ({ en: text, fr: text })
  const transcriptOf = (peer: { frames: { raw: string }[] }) =>
    peer.frames.map(({ raw }) => raw).join('')

  it('[challenge] deals the deck’s lines ahead of the bank, on a round nobody pressed too, and shows no seat or wall one early', async () => {
    const { anna, host, wall } = await openDealtChallenge({
      ...CHALLENGE_GAME,
      autoAdvanceMs: 2_000
    })

    host.send({
      decks: [{ game: 'challenge', items: LINES }],
      type: 'host.setDecks'
    })
    await waitFor(
      () => hostView(host)?.challengeHand[0]?.en === LINES[0],
      'the deck to lead the hand'
    )
    expect(hostView(host)?.challengeHand).toEqual(LINES.map(lineOf))

    host.send({ type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the first line')
    expect(challengeRound(hostView(host))?.labels).toEqual(
      lineOf(LINES[0] ?? '')
    )

    await awardPlaces({
      host,
      places: [],
      roundId: hostView(host)?.round?.id ?? ''
    })
    await waitFor(
      () =>
        challengeRound(hostView(host))?.labels?.en === LINES[1] &&
        hostView(host)?.phase === 'playing',
      'the held reveal to open the next line by itself',
      6_000
    )

    for (const peer of [anna, wall]) {
      expect(transcriptOf(peer)).not.toContain(LINES[2])
    }

    const playOnByItself = async () => {
      const before = hostView(host)?.round?.id

      await awardPlaces({ host, places: [], roundId: before ?? '' })
      await waitFor(
        () =>
          hostView(host)?.phase === 'playing' &&
          hostView(host)?.round?.id !== before,
        'the next round to open by itself',
        6_000
      )

      return challengeRound(hostView(host))?.labels ?? null
    }

    expect(await playOnByItself()).toEqual(lineOf(LINES[2] ?? ''))
    expect(LINES).not.toContain((await playOnByItself())?.en)
    expect(hostView(host)?.deckSummaries).toEqual([{ played: 3, size: 3 }])
  }, 20_000)

  it('[challenge] sets a redealt deck line aside for good', async () => {
    const { host } = await openDealtChallenge()

    host.send({
      decks: [{ game: 'challenge', items: LINES }],
      type: 'host.setDecks'
    })
    await waitFor(
      () => hostView(host)?.challengeHand[0]?.en === LINES[0],
      'the deck to lead the hand'
    )
    await redeal(host)

    expect(hostView(host)?.challengeHand.map(({ en }) => en)).not.toContain(
      LINES[0]
    )
    expect(hostView(host)?.deckSummaries).toEqual([{ played: 1, size: 3 }])
  })

  it('[challenge] deals the bank line a redealt deck line makes room for behind every deck line', async () => {
    const { host } = await openDealtChallenge()

    host.send({
      decks: [{ game: 'challenge', items: LINES }],
      type: 'host.setDecks'
    })
    await waitFor(
      () => hostView(host)?.challengeHand[0]?.en === LINES[0],
      'the deck to lead the hand'
    )
    host.send({ at: 1, type: 'host.redealChallenge' })
    await waitFor(
      () => hostView(host)?.deckSummaries[0]?.played === 1,
      'the redealt deck line set aside'
    )

    const hand = hostView(host)?.challengeHand ?? []

    expect(hand.slice(0, 2)).toEqual(
      [LINES[0] ?? '', LINES[2] ?? ''].map(lineOf)
    )
    expect(isBankedLine(hand[2])).toBe(true)
  })
})

describe('the challenge lines a host wrote ahead', () => {
  const DECKED = 'Name every cousin in birth order'
  const WRITTEN = [
    'Balance a spoon on your nose',
    'Whistle the anthem',
    'Tell the story of the first kiss'
  ]
  const lineOf = (text: string) => ({ en: text, fr: text })
  const transcriptOf = (peer: { frames: { raw: string }[] }) =>
    peer.frames.map(({ raw }) => raw).join('')
  const writeLines = (host: Peer<HostServerMessage>, challenge: string[]) => {
    host.send({
      ownLines: { challenge, mostlikely: [] },
      type: 'host.setOwnLines'
    })
  }
  const handOf = (host: Peer<HostServerMessage>) =>
    hostView(host)?.challengeHand.map(({ en }) => en) ?? []

  it('[challenge] deals them after the entry’s deck and before the bank, on rounds nobody pressed too, and shows no seat or wall one early', async () => {
    const { anna, host, wall } = await openDealtChallenge({
      ...CHALLENGE_GAME,
      autoAdvanceMs: 2_000
    })

    host.send({
      decks: [{ game: 'challenge', items: [DECKED] }],
      type: 'host.setDecks'
    })
    writeLines(host, WRITTEN.slice(0, 2))
    await waitFor(
      () => handOf(host).join() === [DECKED, ...WRITTEN.slice(0, 2)].join(),
      'the deck, then the written lines, to make the hand'
    )

    for (const peer of [anna, wall]) {
      expect(transcriptOf(peer)).not.toContain(WRITTEN[0])
    }

    host.send({ type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the deck’s line')
    expect(challengeRound(hostView(host))?.labels).toEqual(lineOf(DECKED))

    const playOnByItself = async () => {
      const before = hostView(host)?.round?.id

      await awardPlaces({ host, places: [], roundId: before ?? '' })
      await waitFor(
        () =>
          hostView(host)?.phase === 'playing' &&
          hostView(host)?.round?.id !== before,
        'the next round to open by itself',
        6_000
      )

      return challengeRound(hostView(host))?.labels?.en
    }

    expect(await playOnByItself()).toBe(WRITTEN[0])

    for (const peer of [anna, wall]) {
      expect(transcriptOf(peer)).not.toContain(WRITTEN[1])
    }

    expect(await playOnByItself()).toBe(WRITTEN[1])
    expect(isBankedLine(lineOf((await playOnByItself()) ?? ''))).toBe(true)
  }, 20_000)

  it('[challenge] takes the list again mid-round, deals a new line next, drops a removed one and never a played one', async () => {
    const { host } = await openDealtChallenge()

    writeLines(host, WRITTEN.slice(0, 2))
    await waitFor(() => handOf(host)[0] === WRITTEN[0], 'the written lines')
    host.send({ type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the first line')
    expect(challengeRound(hostView(host))?.labels).toEqual(
      lineOf(WRITTEN[0] ?? '')
    )

    writeLines(host, [WRITTEN[0] ?? '', WRITTEN[2] ?? ''])
    await waitFor(() => handOf(host)[0] === WRITTEN[2], 'the new line ahead')
    expect(handOf(host)).not.toContain(WRITTEN[0])
    expect(handOf(host)).not.toContain(WRITTEN[1])
    expect(errorsIn(host)).toEqual([])

    await awardPlaces({
      host,
      places: [],
      roundId: hostView(host)?.round?.id ?? ''
    })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')
    host.send({ type: 'host.nextRound' })
    await waitFor(
      () => challengeRound(hostView(host))?.labels?.en === WRITTEN[2],
      'the line written mid-round'
    )
  })

  it('[challenge] plays a written line typed in by hand once, and takes it out of the hand', async () => {
    const { host } = await openDealtChallenge()

    writeLines(host, WRITTEN.slice(0, 1))
    await waitFor(() => handOf(host)[0] === WRITTEN[0], 'the written line')
    host.send({ challengeText: WRITTEN[0], type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the typed line')

    expect(handOf(host)).not.toContain(WRITTEN[0])
  })

  it('[challenge] refuses a seat sending the host’s lines', async () => {
    const { anna } = await openDealtChallenge()

    anna.send({
      ownLines: { challenge: WRITTEN, mostlikely: [] },
      type: 'host.setOwnLines'
    })
    await waitFor(() => errorsIn(anna).length > 0, 'the refusal')
    expect(errorsIn(anna).map((error) => error.code)).toEqual([
      'host_only_action'
    ])
  })
})
