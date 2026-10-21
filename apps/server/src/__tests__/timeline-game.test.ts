import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_TIMELINE_SETTINGS } from '@melee/protocol/game'
import type { HostToken } from '@melee/protocol/identifiers'
import {
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings,
  type RoundContent,
  type RoundView
} from '@melee/protocol/room'
import { POINT } from '@melee/protocol/scoring'
import {
  type WallServerMessage,
  wallServerMessageSchema
} from '@melee/protocol/server-message'
import { PROTOCOL_VERSION } from '@melee/protocol/version'

import { startRoomHarness } from './node-room-harness'
import {
  basePointsFor,
  errorsIn,
  hostView,
  type Peer,
  playerView,
  type RoomHarness,
  waitFor
} from './room-harness'

const EVENTS = [
  { id: 'first', year: 1111 },
  { id: 'second', year: 1222 },
  { id: 'third', year: 1333 },
  { id: 'fourth', year: 1444 },
  { id: 'fifth', year: 1555 }
].map(({ id, year }) => ({
  id,
  labels: { en: `The ${id} event`, fr: `Le fait ${id}` },
  year
}))

const TRUE_ORDER = EVENTS.map(({ id }) => id)

vi.mock('@/infrastructure/questions/timeline-bank', () => ({
  drawTimelineEvents: ({ playedIds }: { playedIds: ReadonlySet<string> }) =>
    playedIds.has('timeline:first') ? null : EVENTS.toReversed(),
  playedTimelineEventId: (id: string) => `timeline:${id}`
}))

const TIMELINE: RoomSettings = {
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game: DEFAULT_TIMELINE_SETTINGS,
  mode: DEFAULT_MODE_SETTINGS.order,
  roundCount: 3
}

const timelineRound = (
  view: { round: RoundView | null } | null
): Extract<RoundContent, { kind: 'timeline' }> | null => {
  const content = view?.round?.content

  return content?.kind === 'timeline' ? content : null
}

const transcriptOf = (peer: { frames: { raw: string }[] }): string =>
  peer.frames.map(({ raw }) => raw).join('')

/** A year as a JSON value, so a timestamp that happens to hold the digits is not one. */
const holdsAYear = (transcript: string): boolean =>
  transcript.includes('"year"') ||
  EVENTS.some(({ year }) => new RegExp(`[:,[]${year}[,}]]`).test(transcript))

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

const roundInPlay = async () => {
  const { code, host, hostToken } = await harness.openRoom(TIMELINE)
  const wall = await pairedWall({ code, hostToken })
  const zoe = await harness.seat({ code, nickname: 'Zoe' })
  const max = await harness.seat({ code, nickname: 'Max' })

  host.send({ type: 'host.startRound' })
  await waitFor(
    () => playerView(zoe)?.phase === 'playing',
    'the events to go up'
  )

  return {
    host,
    max,
    roundId: playerView(zoe)?.round?.id ?? '',
    wall,
    zoe
  }
}

describe('a timeline round through the seam', () => {
  it('[timeline] deals five events to every screen with no year, and their years to the console alone', async () => {
    const { host, wall, zoe } = await roundInPlay()

    expect(
      timelineRound(playerView(zoe))
        ?.events.map(({ id }) => id)
        .toSorted()
    ).toEqual(TRUE_ORDER.toSorted())
    expect(timelineRound(playerView(zoe))?.events[0]?.labels.fr).toMatch(
      /^Le fait/
    )
    expect(timelineRound(playerView(zoe))?.revealedEvents).toBeNull()
    expect(wallView(wall)?.currentContent).toEqual({ kind: 'timeline' })

    const console = hostView(host)?.currentContent

    expect(
      console?.kind === 'timeline'
        ? console.datedEvents?.map(({ year }) => year)
        : null
    ).toEqual([1111, 1222, 1333, 1444, 1555])
  })

  it('[timeline] pays the true order above one with a pair swapped', async () => {
    const { host, max, roundId, zoe } = await roundInPlay()
    const [first = '', second = '', ...rest] = TRUE_ORDER

    zoe.send({
      answer: { eventIds: TRUE_ORDER, kind: 'order' },
      roundId,
      type: 'player.answer'
    })
    max.send({
      answer: { eventIds: [second, first, ...rest], kind: 'order' },
      roundId,
      type: 'player.answer'
    })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    const view = hostView(host)
    const zoeId = playerView(zoe)?.youId ?? null
    const maxId = playerView(max)?.youId ?? null
    const verdictOf = (playerId: string | null) =>
      view?.round?.awards.find((award) => award.playerId === playerId)?.verdict

    expect(verdictOf(zoeId)).toEqual({ kind: 'order', swappedPairs: 0 })
    expect(verdictOf(maxId)).toEqual({ kind: 'order', swappedPairs: 1 })
    expect(basePointsFor({ playerId: zoeId, view })).toBe(3 * POINT)
    expect(basePointsFor({ playerId: maxId, view })).toBe(2 * POINT)
  })

  it('[timeline] keeps every year off a player and the wall until the reveal, then shows the true order', async () => {
    const { max, roundId, wall, zoe } = await roundInPlay()

    zoe.send({
      answer: { eventIds: TRUE_ORDER, kind: 'order' },
      roundId,
      type: 'player.answer'
    })
    await waitFor(
      () => (playerView(max)?.round?.answers.length ?? 0) === 1,
      'the order to land'
    )

    expect(holdsAYear(transcriptOf(zoe))).toBe(false)
    expect(holdsAYear(transcriptOf(max))).toBe(false)
    expect(holdsAYear(transcriptOf(wall))).toBe(false)

    max.send({
      answer: { eventIds: TRUE_ORDER.toReversed(), kind: 'order' },
      roundId,
      type: 'player.answer'
    })
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    expect(
      timelineRound(playerView(zoe))?.revealedEvents?.map(
        ({ id, year }) => `${id} ${year}`
      )
    ).toEqual([
      'first 1111',
      'second 1222',
      'third 1333',
      'fourth 1444',
      'fifth 1555'
    ])
  })

  it('[timeline] takes one order a seat, and refuses one that is not every event once', async () => {
    const { roundId, zoe } = await roundInPlay()
    const send = (eventIds: string[]) =>
      zoe.send({
        answer: { eventIds, kind: 'order' },
        roundId,
        type: 'player.answer'
      })

    send(TRUE_ORDER.slice(1))
    await waitFor(() => errorsIn(zoe).length === 1, 'the short order refused')
    send(TRUE_ORDER)
    send(TRUE_ORDER)
    await waitFor(() => errorsIn(zoe).length === 2, 'the second order refused')

    expect(errorsIn(zoe).map(({ code }) => code)).toEqual([
      'invalid_message',
      'already_buzzed'
    ])
  })

  it('[timeline] says so when the bank cannot deal another round', async () => {
    const { host, max, roundId, zoe } = await roundInPlay()

    for (const seat of [zoe, max]) {
      seat.send({
        answer: { eventIds: TRUE_ORDER, kind: 'order' },
        roundId,
        type: 'player.answer'
      })
    }
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')
    host.send({ type: 'host.nextRound' })
    await waitFor(() => errorsIn(host).length > 0, 'the spent bank')

    expect(errorsIn(host).map(({ code }) => code)).toContain(
      'no_content_available'
    )
  })
})
