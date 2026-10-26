import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_ATLAS_SETTINGS } from '@melee/protocol/game'
import {
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings
} from '@melee/protocol/room'
import { POINT } from '@melee/protocol/scoring'

import { startRoomHarness } from './node-room-harness'
import {
  atlasRound,
  basePointsFor,
  errorsIn,
  hostView,
  playerView,
  type RoomHarness,
  waitFor
} from './room-harness'

vi.mock('@/infrastructure/questions/country-bank', () => ({
  BANKED_COUNTRIES: ['FRA', 'BEL', 'DEU', 'ESP', 'ITA'],
  drawCountry: ({ playedIds }: { playedIds: ReadonlySet<string> }) =>
    playedIds.has('atlas:FRA') ? null : 'FRA',
  playedCountryId: (code: string) => `atlas:${code}`
}))

vi.mock('@/infrastructure/questions/city-bank', () => ({
  BANKED_CITIES: [
    { name: 'Rennes', point: { latitude: 48.117, longitude: -1.678 } },
    { name: 'Brest', point: { latitude: 48.39, longitude: -4.486 } },
    { name: 'Vannes', point: { latitude: 47.658, longitude: -2.76 } },
    { name: 'Laval', point: { latitude: 48.073, longitude: -0.77 } }
  ],
  drawCity: ({ playedIds }: { playedIds: ReadonlySet<string> }) =>
    playedIds.has('atlas:city:Rennes')
      ? null
      : { name: 'Rennes', point: { latitude: 48.117, longitude: -1.678 } },
  playedCityId: (name: string) => `atlas:city:${name}`
}))

const CANBERRA = {
  countryCode: 'AUS',
  names: { en: 'Canberra', fr: 'Canberra' },
  point: { latitude: -35.293, longitude: 149.127 }
} as const

vi.mock('@/infrastructure/questions/world-capitals', () => ({
  drawCapital: ({ playedIds }: { playedIds: ReadonlySet<string> }) =>
    playedIds.has('atlas:capital:AUS') ? null : CANBERRA,
  playedCapitalId: (code: string) => `atlas:capital:${code}`,
  worldCapitals: () => []
}))

const ATLAS: RoomSettings = {
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game: { ...DEFAULT_ATLAS_SETTINGS, roundDurationMs: 5_000 },
  mode: DEFAULT_MODE_SETTINGS.point,
  roundCount: 3
}

const FRENCH_CITIES: RoomSettings = {
  ...ATLAS,
  game: { ...DEFAULT_ATLAS_SETTINGS, places: ['frenchCities'] }
}

const WORLD_CAPITALS: RoomSettings = {
  ...ATLAS,
  game: { ...DEFAULT_ATLAS_SETTINGS, places: ['worldCapitals'] }
}

const NAME_THE_COUNTRY: RoomSettings = {
  ...ATLAS,
  game: { ...DEFAULT_ATLAS_SETTINGS, direction: 'name' },
  mode: DEFAULT_MODE_SETTINGS.choice
}

const NAME_THE_CITY: RoomSettings = {
  ...ATLAS,
  game: {
    ...DEFAULT_ATLAS_SETTINGS,
    direction: 'name',
    places: ['frenchCities']
  },
  mode: DEFAULT_MODE_SETTINGS.typed
}

const COUNTRIES_AND_CITIES: RoomSettings = {
  ...ATLAS,
  game: { ...DEFAULT_ATLAS_SETTINGS, places: ['countries', 'frenchCities'] }
}

const PARIS = { latitude: 48.8566, longitude: 2.3522 }
const BESIDE_RENNES = { latitude: 48.2, longitude: -1.678 }
const NANTES = { latitude: 47.218, longitude: -1.554 }
const SYDNEY = { latitude: -33.869, longitude: 151.209 }
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
    const { code, host } = await harness.openRoom(ATLAS)
    const zoe = await harness.seat({ code, nickname: 'Zoe' })
    const max = await harness.seat({ code, nickname: 'Max' })

    host.send({ type: 'host.startRound' })
    await waitFor(() => playerView(zoe)?.phase === 'playing', 'the map to open')

    return { host, max, roundId: playerView(zoe)?.round?.id ?? '', zoe }
  }

  it('[atlas] names the country to every screen from the first frame', async () => {
    const { zoe } = await roundInPlay()

    expect(atlasRound(playerView(zoe))?.target).toEqual({
      countryCode: 'FRA',
      kind: 'country'
    })
    expect(atlasRound(playerView(zoe))?.revealedPlacements).toBeNull()
  })

  it('[atlas] pays inside the country above a marker in the sea beside it', async () => {
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

    expect(awardOf(zoeId)?.verdict).toEqual({
      distanceKm: 0,
      kind: 'distance',
      target: 'country'
    })
    expect(basePointsFor({ playerId: zoeId ?? null, view })).toBe(3 * POINT)

    const maxVerdict = awardOf(maxId)?.verdict
    const maxDistanceKm =
      maxVerdict?.kind === 'distance' ? maxVerdict.distanceKm : null

    expect(maxDistanceKm).toBeGreaterThan(80)
    expect(maxDistanceKm).toBeLessThan(200)
    expect(basePointsFor({ playerId: maxId ?? null, view })).toBe(2 * POINT)
  })

  it('[atlas] shows nobody another marker before the reveal, and everyone after', async () => {
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
    expect(atlasRound(playerView(zoe))?.revealedPlacements).toBeNull()

    zoe.send({
      answer: { kind: 'point', point: PARIS },
      roundId,
      type: 'player.answer'
    })
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    expect(atlasRound(playerView(zoe))?.revealedPlacements).toEqual([
      { playerId: playerView(max)?.youId, point: OFF_BRITTANY },
      { playerId: playerView(zoe)?.youId, point: PARIS }
    ])
  })

  it('[atlas] takes one marker a seat, however far the first fell', async () => {
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

  it('[atlas] refuses a typed line where a marker is owed', async () => {
    const { roundId, zoe } = await roundInPlay()

    zoe.send({
      answer: { guess: 'France', kind: 'typed' },
      roundId,
      type: 'player.answer'
    })
    await waitFor(() => errorsIn(zoe).length === 1, 'the line refused')

    expect(errorsIn(zoe)[0]?.code).toBe('invalid_message')
  })

  it('[atlas] says so when the bank has no country left to ask', async () => {
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

describe('a French city round through the seam', () => {
  let harness: RoomHarness

  beforeEach(async () => {
    harness = await startRoomHarness()
  })

  afterEach(async () => {
    await harness.stop()
  })

  const roundInPlay = async () => {
    const { code, host } = await harness.openRoom(FRENCH_CITIES)
    const zoe = await harness.seat({ code, nickname: 'Zoe' })
    const max = await harness.seat({ code, nickname: 'Max' })

    host.send({ type: 'host.startRound' })
    await waitFor(() => playerView(zoe)?.phase === 'playing', 'the map to open')

    return { host, max, roundId: playerView(zoe)?.round?.id ?? '', zoe }
  }

  it('[atlas] names the city and keeps where it stands off every screen until the reveal', async () => {
    const { host, max, roundId, zoe } = await roundInPlay()

    expect(atlasRound(playerView(zoe))?.target).toEqual({
      kind: 'city',
      name: 'Rennes',
      point: null
    })
    expect(transcriptOf(zoe)).not.toContain('48.117')
    expect(transcriptOf(host)).not.toContain('48.117')

    for (const seat of [zoe, max]) {
      seat.send({
        answer: { kind: 'point', point: NANTES },
        roundId,
        type: 'player.answer'
      })
    }
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    expect(atlasRound(playerView(zoe))?.target).toEqual({
      kind: 'city',
      name: 'Rennes',
      point: { latitude: 48.117, longitude: -1.678 }
    })
  })

  it('[atlas] prices a marker by the city’s own tiers, to the city itself', async () => {
    const { host, max, roundId, zoe } = await roundInPlay()

    zoe.send({
      answer: { kind: 'point', point: BESIDE_RENNES },
      roundId,
      type: 'player.answer'
    })
    max.send({
      answer: { kind: 'point', point: NANTES },
      roundId,
      type: 'player.answer'
    })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    const view = hostView(host)
    const zoeId = playerView(zoe)?.youId ?? null
    const maxId = playerView(max)?.youId ?? null

    expect(
      view?.round?.awards.find((award) => award.playerId === zoeId)?.verdict
    ).toEqual({ distanceKm: 9, kind: 'distance', target: 'city' })
    expect(basePointsFor({ playerId: zoeId, view })).toBe(3 * POINT)
    expect(basePointsFor({ playerId: maxId, view })).toBe(POINT)
  })
})

describe('a world capital round through the seam', () => {
  let harness: RoomHarness

  beforeEach(async () => {
    harness = await startRoomHarness()
  })

  afterEach(async () => {
    await harness.stop()
  })

  const roundInPlay = async () => {
    const { code, host } = await harness.openRoom(WORLD_CAPITALS)
    const zoe = await harness.seat({ code, nickname: 'Zoe' })
    const max = await harness.seat({ code, nickname: 'Max' })

    host.send({ type: 'host.startRound' })
    await waitFor(() => playerView(zoe)?.phase === 'playing', 'the map to open')

    return { host, max, roundId: playerView(zoe)?.round?.id ?? '', zoe }
  }

  it('[atlas] names the capital and keeps where it stands and whose it is off every screen until the reveal', async () => {
    const { host, max, roundId, zoe } = await roundInPlay()

    expect(atlasRound(playerView(zoe))?.target).toEqual({
      countryCode: null,
      kind: 'capital',
      names: CANBERRA.names,
      point: null
    })

    for (const peer of [zoe, max, host]) {
      expect(transcriptOf(peer)).not.toContain('-35.293')
      expect(transcriptOf(peer)).not.toContain('"AUS"')
    }

    for (const seat of [zoe, max]) {
      seat.send({
        answer: { kind: 'point', point: SYDNEY },
        roundId,
        type: 'player.answer'
      })
    }
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    expect(atlasRound(playerView(zoe))?.target).toEqual({
      kind: 'capital',
      ...CANBERRA
    })
  })

  it('[atlas] pays the big city taken for the capital a tier below the capital itself', async () => {
    const { host, max, roundId, zoe } = await roundInPlay()

    zoe.send({
      answer: { kind: 'point', point: CANBERRA.point },
      roundId,
      type: 'player.answer'
    })
    max.send({
      answer: { kind: 'point', point: SYDNEY },
      roundId,
      type: 'player.answer'
    })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    const view = hostView(host)

    expect(
      basePointsFor({ playerId: playerView(zoe)?.youId ?? null, view })
    ).toBe(3 * POINT)
    expect(
      basePointsFor({ playerId: playerView(max)?.youId ?? null, view })
    ).toBe(2 * POINT)
  })
})

describe('a map round that shows a place for the table to name', () => {
  let harness: RoomHarness

  beforeEach(async () => {
    harness = await startRoomHarness()
  })

  afterEach(async () => {
    await harness.stop()
  })

  const roundInPlay = async (settings: RoomSettings) => {
    const { code, host } = await harness.openRoom(settings)
    const zoe = await harness.seat({ code, nickname: 'Zoe' })
    const max = await harness.seat({ code, nickname: 'Max' })

    host.send({ type: 'host.startRound' })
    await waitFor(() => playerView(zoe)?.phase === 'playing', 'the map to open')

    return { host, max, roundId: playerView(zoe)?.round?.id ?? '', zoe }
  }

  it('[atlas] shows a point inside the country and names it to nobody but the console until the reveal', async () => {
    const { host, max, roundId, zoe } = await roundInPlay(NAME_THE_COUNTRY)
    const round = atlasRound(playerView(zoe))
    const shown = round?.shown?.point

    expect(round?.direction).toBe('name')
    expect(round?.target).toBeNull()
    expect(round?.shown?.kind).toBe('country')
    expect(shown?.latitude).toBeGreaterThan(42)
    expect(shown?.latitude).toBeLessThan(51)
    expect(shown?.longitude).toBeGreaterThan(-5)
    expect(shown?.longitude).toBeLessThan(8)
    expect(round?.choices).toHaveLength(4)
    expect(round?.choices).toContainEqual({ en: 'France', fr: 'France' })
    expect(transcriptOf(zoe)).not.toContain('"FRA"')
    expect(hostView(host)?.currentContent).toEqual({
      answer: { countryCode: 'FRA', kind: 'country' },
      kind: 'atlas'
    })

    for (const seat of [zoe, max]) {
      seat.send({
        answer: { choiceIndex: 0, kind: 'choice' },
        roundId,
        type: 'player.answer'
      })
    }
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    expect(atlasRound(playerView(zoe))?.target).toEqual({
      countryCode: 'FRA',
      kind: 'country'
    })
  })

  it('[atlas] pays the right pick among four and nothing for a neighbour', async () => {
    const { host, max, roundId, zoe } = await roundInPlay(NAME_THE_COUNTRY)
    const choices = atlasRound(playerView(zoe))?.choices ?? []
    const france = choices.findIndex(({ en }) => en === 'France')

    zoe.send({
      answer: { choiceIndex: france, kind: 'choice' },
      roundId,
      type: 'player.answer'
    })
    max.send({
      answer: { choiceIndex: (france + 1) % 4, kind: 'choice' },
      roundId,
      type: 'player.answer'
    })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    const view = hostView(host)

    expect(
      basePointsFor({ playerId: playerView(zoe)?.youId ?? null, view })
    ).toBe(POINT)
    expect(
      basePointsFor({ playerId: playerView(max)?.youId ?? null, view })
    ).toBe(0)
  })

  it('[atlas] sends no screen the city’s name in a typed round, and takes it typed', async () => {
    const { host, max, roundId, zoe } = await roundInPlay(NAME_THE_CITY)

    expect(atlasRound(playerView(zoe))?.shown).toEqual({
      kind: 'city',
      point: { latitude: 48.117, longitude: -1.678 }
    })
    expect(atlasRound(playerView(zoe))?.choices).toEqual([])

    zoe.send({
      answer: { guess: 'rennes', kind: 'typed' },
      roundId,
      type: 'player.answer'
    })
    await waitFor(
      () => (playerView(zoe)?.round?.answers.length ?? 0) === 1,
      'the first line to land'
    )

    expect(transcriptOf(zoe)).not.toContain('Rennes')
    expect(transcriptOf(max)).not.toContain('Rennes')

    max.send({
      answer: { guess: 'Vannes', kind: 'typed' },
      roundId,
      type: 'player.answer'
    })
    await waitFor(
      () => (playerView(zoe)?.round?.answers.length ?? 0) === 2,
      'the second line to land'
    )
    host.send({ roundId, type: 'host.reveal' })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    const view = hostView(host)

    expect(
      basePointsFor({ playerId: playerView(zoe)?.youId ?? null, view })
    ).toBe(3 * POINT)
    expect(
      basePointsFor({ playerId: playerView(max)?.youId ?? null, view })
    ).toBe(0)
  })

  it('[atlas] refuses a marker where a name is owed', async () => {
    const { roundId, zoe } = await roundInPlay(NAME_THE_CITY)

    zoe.send({
      answer: { kind: 'point', point: PARIS },
      roundId,
      type: 'player.answer'
    })
    await waitFor(() => errorsIn(zoe).length === 1, 'the marker refused')

    expect(errorsIn(zoe)[0]?.code).toBe('invalid_message')
  })
})

describe('a map evening of several kinds of place', () => {
  let harness: RoomHarness

  beforeEach(async () => {
    harness = await startRoomHarness()
  })

  afterEach(async () => {
    await harness.stop()
  })

  it('[atlas] draws each round from a kind the table ticked, until every one is spent', async () => {
    const { code, host } = await harness.openRoom(COUNTRIES_AND_CITIES)
    const zoe = await harness.seat({ code, nickname: 'Zoe' })
    const kinds: (string | undefined)[] = []

    host.send({ type: 'host.startRound' })

    for (const index of [1, 2]) {
      await waitFor(
        () =>
          playerView(zoe)?.phase === 'playing' &&
          playerView(zoe)?.round?.index === index,
        `round ${index} to open`
      )
      kinds.push(atlasRound(playerView(zoe))?.target?.kind)
      zoe.send({
        answer: { kind: 'point', point: PARIS },
        roundId: playerView(zoe)?.round?.id ?? '',
        type: 'player.answer'
      })
      await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')
      host.send({ type: 'host.nextRound' })
    }

    await waitFor(() => errorsIn(host).length > 0, 'the empty banks')

    expect(kinds.toSorted()).toEqual(['city', 'country'])
    expect(errorsIn(host).map((error) => error.code)).toContain(
      'no_content_available'
    )
  })
})
