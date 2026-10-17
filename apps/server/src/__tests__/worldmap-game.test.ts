import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_WORLDMAP_SETTINGS } from '@melee/protocol/game'
import {
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings
} from '@melee/protocol/room'
import { POINT } from '@melee/protocol/scoring'

import { startRoomHarness } from './node-room-harness'
import {
  basePointsFor,
  errorsIn,
  hostView,
  playerView,
  type RoomHarness,
  waitFor,
  worldmapRound
} from './room-harness'

vi.mock('@/infrastructure/questions/country-bank', () => ({
  BANKED_COUNTRIES: ['FRA'],
  drawCountry: ({ playedIds }: { playedIds: ReadonlySet<string> }) =>
    playedIds.has('worldmap:FRA') ? null : 'FRA',
  playedCountryId: (code: string) => `worldmap:${code}`
}))

const WORLDMAP: RoomSettings = {
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game: { ...DEFAULT_WORLDMAP_SETTINGS, roundDurationMs: 5_000 },
  mode: DEFAULT_MODE_SETTINGS.point,
  roundCount: 3
}

const PARIS = { latitude: 48.8566, longitude: 2.3522 }
const OFF_BRITTANY = { latitude: 48.0123, longitude: -6.5432 }

const transcriptOf = (peer: { frames: { raw: string }[] }): string =>
  peer.frames.map(({ raw }) => raw).join('')

describe('a world map round through the seam', () => {
  let harness: RoomHarness

  beforeEach(async () => {
    harness = await startRoomHarness()
  })

  afterEach(async () => {
    await harness.stop()
  })

  const roundInPlay = async () => {
    const { code, host } = await harness.openRoom(WORLDMAP)
    const zoe = await harness.seat({ code, nickname: 'Zoe' })
    const max = await harness.seat({ code, nickname: 'Max' })

    host.send({ type: 'host.startRound' })
    await waitFor(() => playerView(zoe)?.phase === 'playing', 'the map to open')

    return { host, max, roundId: playerView(zoe)?.round?.id ?? '', zoe }
  }

  it('[worldmap] names the country to every screen from the first frame', async () => {
    const { zoe } = await roundInPlay()

    expect(worldmapRound(playerView(zoe))?.countryCode).toBe('FRA')
    expect(worldmapRound(playerView(zoe))?.revealedPlacements).toBeNull()
  })

  it('[worldmap] pays inside the country above a marker in the sea beside it', async () => {
    const { host, max, roundId, zoe } = await roundInPlay()

    zoe.send({
      answer: { kind: 'point', point: PARIS },
      roundId,
      type: 'player.answer'
    })
    max.send({
      answer: { kind: 'point', point: OFF_BRITTANY },
      roundId,
      type: 'player.answer'
    })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    const view = hostView(host)
    const awardOf = (playerId: string | null | undefined) =>
      view?.round?.awards.find((award) => award.playerId === playerId)
    const zoeId = playerView(zoe)?.youId
    const maxId = playerView(max)?.youId

    expect(awardOf(zoeId)?.verdict).toEqual({ distanceKm: 0, kind: 'distance' })
    expect(basePointsFor({ playerId: zoeId ?? null, view })).toBe(3 * POINT)

    const maxVerdict = awardOf(maxId)?.verdict
    const maxDistanceKm =
      maxVerdict?.kind === 'distance' ? maxVerdict.distanceKm : null

    expect(maxDistanceKm).toBeGreaterThan(80)
    expect(maxDistanceKm).toBeLessThan(200)
    expect(basePointsFor({ playerId: maxId ?? null, view })).toBe(2 * POINT)
  })

  it('[worldmap] shows nobody another marker before the reveal, and everyone after', async () => {
    const { max, roundId, zoe } = await roundInPlay()

    max.send({
      answer: { kind: 'point', point: OFF_BRITTANY },
      roundId,
      type: 'player.answer'
    })
    await waitFor(
      () => (playerView(zoe)?.round?.answers.length ?? 0) === 1,
      'the marker to land'
    )

    expect(transcriptOf(zoe)).not.toContain('-6.54')
    expect(worldmapRound(playerView(zoe))?.revealedPlacements).toBeNull()

    zoe.send({
      answer: { kind: 'point', point: PARIS },
      roundId,
      type: 'player.answer'
    })
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    expect(worldmapRound(playerView(zoe))?.revealedPlacements).toEqual([
      { playerId: playerView(max)?.youId, point: OFF_BRITTANY },
      { playerId: playerView(zoe)?.youId, point: PARIS }
    ])
  })

  it('[worldmap] takes one marker a seat, however far the first fell', async () => {
    const { roundId, zoe } = await roundInPlay()

    const send = (point: typeof PARIS) =>
      zoe.send({
        answer: { kind: 'point', point },
        roundId,
        type: 'player.answer'
      })

    send(OFF_BRITTANY)
    send(PARIS)
    await waitFor(() => errorsIn(zoe).length === 1, 'the second marker refused')

    expect(errorsIn(zoe)[0]?.code).toBe('already_buzzed')
  })

  it('[worldmap] refuses a typed line where a marker is owed', async () => {
    const { roundId, zoe } = await roundInPlay()

    zoe.send({
      answer: { guess: 'France', kind: 'typed' },
      roundId,
      type: 'player.answer'
    })
    await waitFor(() => errorsIn(zoe).length === 1, 'the line refused')

    expect(errorsIn(zoe)[0]?.code).toBe('invalid_message')
  })

  it('[worldmap] says so when the bank has no country left to ask', async () => {
    const { host, max, roundId, zoe } = await roundInPlay()

    for (const seat of [zoe, max]) {
      seat.send({
        answer: { kind: 'point', point: PARIS },
        roundId,
        type: 'player.answer'
      })
    }
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')
    host.send({ type: 'host.nextRound' })
    await waitFor(() => errorsIn(host).length > 0, 'the empty bank')

    expect(errorsIn(host).map(({ code }) => code)).toContain(
      'no_content_available'
    )
  })
})
