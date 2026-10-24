import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  ChallengeFinisher,
  ChallengeLabels
} from '@melee/protocol/challenge'
import { DEFAULT_CHALLENGE_SETTINGS } from '@melee/protocol/game'
import type { HostToken } from '@melee/protocol/identifiers'
import {
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings
} from '@melee/protocol/room'
import { POINT } from '@melee/protocol/scoring'
import {
  type HostServerMessage,
  type PlayerServerMessage,
  type WallServerMessage,
  wallServerMessageSchema
} from '@melee/protocol/server-message'
import { PROTOCOL_VERSION } from '@melee/protocol/version'

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

  it('[challenge] pays three, two and one points down the podium, and reveals', async () => {
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
      2_000, 0, 3_000, 1_000
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
      3_000, 3_000, 2_000
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
    expect(scoresOf(host, ['Anna', 'Ben'])).toEqual([1_000, 3_000])
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
      2 * POINT,
      3 * POINT,
      POINT
    ])
  })

  it('[challenge] refuses a seat placed in a room playing in teams', async () => {
    const { code, host } = await harness.openRoom(ON_A_TRACK)
    const anna = await harness.seat({ code, nickname: 'Anna' })

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

const categoryOf = (labels: ChallengeLabels | null | undefined) =>
  bankedChallengeLines().find((line) => line.labels.en === labels?.en)?.category

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
    () => (hostView(host)?.nextChallenge ?? null) !== null,
    'a line dealt ahead'
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
    const ahead = hostView(host)?.nextChallenge ?? null
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
  const before = hostView(host)?.nextChallenge

  host.send({ type: 'host.redealChallenge' })
  await waitFor(
    () => hostView(host)?.nextChallenge?.en !== before?.en,
    'another line'
  )
}

describe('a challenge dealt from the bank', () => {
  it('[challenge] opens a round left empty on the line dealt ahead, in every locale', async () => {
    const { anna, host } = await openDealtChallenge()
    const [round] = await playDealtRounds({ count: 1, host })

    expect(round?.dealt).toEqual(round?.ahead)
    expect(categoryOf(round?.dealt)).toBeDefined()
    expect(round?.dealt?.fr).not.toBe(round?.dealt?.en)
    expect(challengeRound(playerView(anna))?.labels).toEqual(round?.dealt)
  })

  it('[challenge] reads a blank typed line as none, and deals', async () => {
    const { host } = await openDealtChallenge()
    const ahead = hostView(host)?.nextChallenge

    host.send({ challengeText: '   ', type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the challenge')

    expect(challengeRound(hostView(host))?.labels).toEqual(ahead)
  })

  it('[challenge] keeps the line dealt ahead for later when the host types one', async () => {
    const { host } = await openDealtChallenge()
    const ahead = hostView(host)?.nextChallenge

    host.send({ challengeText: POTATOES, type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the challenge')

    expect(challengeRound(hostView(host))?.labels?.en).toBe(POTATOES)
    expect(hostView(host)?.nextChallenge).toEqual(ahead)
  })

  it('[challenge] never deals one line twice in an evening, and varies the category', async () => {
    const { host } = await openDealtChallenge()
    const rounds = await playDealtRounds({ count: 6, host })
    const categories = rounds.map((round) => categoryOf(round.dealt))

    expect(new Set(rounds.map((round) => round.dealt?.en)).size).toBe(6)
    expect(
      categories.filter(
        (category, index) => index > 0 && category === categories[index - 1]
      )
    ).toEqual([])
  })

  it('[challenge] deals no festive line unless the host asks', async () => {
    const { host } = await openDealtChallenge()

    for (let attempt = 0; attempt < 20; attempt += 1) {
      await redeal(host)
      expect(categoryOf(hostView(host)?.nextChallenge)).not.toBe('festive')
    }
  })

  it('[challenge] redeals a festive line held ahead once the host turns them off', async () => {
    const festiveGame = { ...DEFAULT_CHALLENGE_SETTINGS, hasFestiveLines: true }
    const { host } = await openDealtChallenge({
      ...CHALLENGE_GAME,
      game: festiveGame,
      lineUp: [festiveGame]
    })

    for (
      let attempt = 0;
      attempt < 60 && categoryOf(hostView(host)?.nextChallenge) !== 'festive';
      attempt += 1
    ) {
      await redeal(host)
    }
    expect(categoryOf(hostView(host)?.nextChallenge)).toBe('festive')

    host.send({ settings: CHALLENGE_GAME, type: 'host.updateSettings' })
    await waitFor(
      () => categoryOf(hostView(host)?.nextChallenge) !== 'festive',
      'a line that is not festive'
    )
  })

  it('[challenge] never shows a seat or the wall a line before its round opens', async () => {
    const { anna, host, wall } = await openDealtChallenge()
    const rounds = await playDealtRounds({ count: 3, host })
    const stillAhead = hostView(host)?.nextChallenge?.fr ?? ''
    const transcripts = [anna.frames, wall.frames].map((frames) =>
      frames.map(({ raw }) => raw)
    )

    expect(stillAhead).not.toBe('')

    for (const raws of transcripts) {
      expect(raws.join('\n')).not.toContain('nextChallenge')
      expect(raws.join('\n')).not.toContain(stillAhead)

      for (const { dealt } of rounds) {
        const line = dealt?.fr ?? ''
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
    const before = hostView(host)?.nextChallenge

    await redeal(host)
    expect(categoryOf(hostView(host)?.nextChallenge)).not.toBe(
      categoryOf(before)
    )

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
    expect(hostView(host)?.nextChallenge).toBeNull()
  })
})
