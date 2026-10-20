import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ChallengeFinisher } from '@melee/protocol/challenge'
import { DEFAULT_CHALLENGE_SETTINGS } from '@melee/protocol/game'
import {
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings
} from '@melee/protocol/room'
import type {
  HostServerMessage,
  PlayerServerMessage
} from '@melee/protocol/server-message'

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
  lineUp: ['challenge'],
  mode: DEFAULT_MODE_SETTINGS.buzzer,
  roundCount: null
}

const ON_A_TRACK: RoomSettings = {
  ...CHALLENGE_GAME,
  board: { kind: 'track', length: 10, strategy: 'onePointOneCase' },
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

    expect(challengeRound(playerView(anna))?.text).toBe(POTATOES)
    expect(challengeRound(hostView(host))?.text).toBe(POTATOES)
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
      lineUp: ['buzzer']
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
  it('[challenge] walks the podium three, two and one cases', async () => {
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
