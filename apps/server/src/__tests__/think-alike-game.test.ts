import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_THINK_ALIKE_SETTINGS } from '@melee/protocol/game'
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

import { pointsForMatch } from '@melee/core/thinkalike/crowd-pay'

import { startRoomHarness } from './node-room-harness'
import {
  errorsIn,
  hostView,
  type Peer,
  playerView,
  type RoomHarness,
  waitFor
} from './room-harness'

const PROMPT = 'Un fruit rouge'

/** Distinctive enough that a raw frame carrying it can only be carrying that seat's answer. */
const SECRET = 'Pomegranate'

vi.mock(
  '@/infrastructure/questions/think-alike-bank',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('@/infrastructure/questions/think-alike-bank')
    >()),
    drawThinkAlikePrompt: () => ({ id: 'red-fruit', prompt: PROMPT })
  })
)

const THINK_ALIKE: RoomSettings = {
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game: DEFAULT_THINK_ALIKE_SETTINGS,
  mode: DEFAULT_MODE_SETTINGS.match,
  roundCount: 3
}

type Seat = Peer<PlayerServerMessage>

const thinkAlikeRound = (
  view: { round: RoundView | null } | null
): Extract<RoundContent, { kind: 'thinkalike' }> | null => {
  const content = view?.round?.content

  return content?.kind === 'thinkalike' ? content : null
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

const roundInPlay = async () => {
  const { code, host, hostToken } = await harness.openRoom(THINK_ALIKE)
  const wall = await pairedWall({ code, hostToken })
  const zoe = await harness.seat({ code, nickname: 'Zoe' })
  const max = await harness.seat({ code, nickname: 'Max' })
  const lou = await harness.seat({ code, nickname: 'Lou' })

  host.send({ type: 'host.startRound' })
  await waitFor(
    () => playerView(zoe)?.phase === 'playing',
    'the prompt to go up'
  )

  return {
    code,
    host,
    lou,
    max,
    roundId: playerView(zoe)?.round?.id ?? '',
    wall,
    zoe
  }
}

const write = ({
  answer,
  roundId,
  seat
}: {
  answer: string
  roundId: string
  seat: Seat
}) =>
  seat.send({
    answer: { answer, kind: 'match' },
    roundId,
    type: 'player.answer'
  })

const idOf = (seat: Seat) => playerView(seat)?.youId ?? null

const paidTo = ({
  host,
  seat
}: {
  host: Peer<HostServerMessage>
  seat: Seat
}) => {
  const view = hostView(host)
  const award = view?.round?.awards.find(
    ({ playerId }) => playerId === idOf(seat)
  )

  return {
    points: award?.points ?? null,
    score: view?.players.find(({ id }) => id === idOf(seat))?.score ?? null,
    speedBonus: award?.speedBonus ?? null,
    verdict: award?.verdict ?? null
  }
}

/** Three seats where two wrote one fruit and the third another, revealed by the last send. */
const splitRound = async () => {
  const round = await roundInPlay()
  const { lou, max, roundId, zoe } = round

  write({ answer: 'Fraises', roundId, seat: zoe })
  write({ answer: 'une fraise', roundId, seat: max })
  write({ answer: 'Cerise', roundId, seat: lou })
  await waitFor(() => hostView(round.host)?.phase === 'revealed', 'the reveal')

  return round
}

const groupKeys = (seat: Seat) =>
  thinkAlikeRound(playerView(seat))?.groups?.map(({ key }) => key) ?? []

describe('a think-alike round through the seam', () => {
  it('[thinkalike] puts the prompt on every screen and no group before the reveal', async () => {
    const { host, wall, zoe } = await roundInPlay()

    expect(thinkAlikeRound(playerView(zoe))).toEqual({
      groups: null,
      kind: 'thinkalike',
      prompt: PROMPT,
      yourAnswer: null
    })
    expect(thinkAlikeRound(wallView(wall))?.prompt).toBe(PROMPT)
    expect(hostView(host)?.currentContent).toEqual({ kind: 'thinkalike' })
  })

  it('[thinkalike] sends no seat, console or wall frame another seat’s answer while the field is open', async () => {
    const { host, lou, max, roundId, wall, zoe } = await roundInPlay()

    write({ answer: SECRET, roundId, seat: max })
    await waitFor(
      () => thinkAlikeRound(playerView(max))?.yourAnswer === SECRET,
      'the answer to land'
    )
    write({ answer: 'Cerise', roundId, seat: zoe })
    await waitFor(
      () => thinkAlikeRound(playerView(zoe))?.yourAnswer === 'Cerise',
      'the second answer to land'
    )

    expect(hostView(host)?.phase).toBe('playing')
    for (const peer of [zoe, lou, host, wall]) {
      expect(transcriptOf(peer.frames)).not.toContain(SECRET)
    }
    expect(transcriptOf(max.frames)).not.toContain('Cerise')
  })

  it('[thinkalike] closes as the last seat sends and pays each seat by the others who wrote its answer, with no speed', async () => {
    const { host, lou, max, zoe } = await splitRound()

    expect(groupKeys(lou)).toHaveLength(2)
    expect(
      thinkAlikeRound(playerView(lou))?.groups?.map(({ authors }) =>
        authors.toSorted()
      )
    ).toEqual([[idOf(lou)], [idOf(zoe), idOf(max)].toSorted()])

    const half = pointsForMatch({ matched: 1, others: 2 })

    expect(paidTo({ host, seat: zoe })).toEqual({
      points: half,
      score: half,
      speedBonus: 0,
      verdict: { kind: 'match', matched: 1, others: 2 }
    })
    expect(paidTo({ host, seat: max }).points).toBe(half)
    expect(paidTo({ host, seat: lou })).toMatchObject({ points: 0, score: 0 })
  })

  it('[thinkalike] pays the round again when the console merges two groups, and back when it takes one out', async () => {
    const { host, lou, roundId, zoe } = await splitRound()
    const [lone, crowd] = groupKeys(lou)

    host.send({
      from: lone ?? '',
      into: crowd ?? '',
      roundId,
      type: 'host.mergeGroups'
    })
    await waitFor(() => groupKeys(lou).length === 1, 'the merge')

    const whole = pointsForMatch({ matched: 2, others: 2 })

    expect(thinkAlikeRound(playerView(lou))?.groups?.[0]?.mergedKeys).toEqual([
      lone
    ])
    expect(paidTo({ host, seat: lou })).toMatchObject({
      points: whole,
      score: whole
    })
    expect(paidTo({ host, seat: zoe })).toMatchObject({
      points: whole,
      score: whole
    })

    host.send({ key: lone ?? '', roundId, type: 'host.splitGroup' })
    await waitFor(() => groupKeys(lou).length === 2, 'the split')

    const half = pointsForMatch({ matched: 1, others: 2 })

    expect(paidTo({ host, seat: lou })).toMatchObject({ points: 0, score: 0 })
    expect(paidTo({ host, seat: zoe })).toMatchObject({
      points: half,
      score: half
    })
  })

  it('[thinkalike] refuses a merge before the reveal, into itself, or out of a group never merged', async () => {
    const { host, roundId, zoe } = await roundInPlay()

    host.send({
      from: 'cerise',
      into: 'fraise',
      roundId,
      type: 'host.mergeGroups'
    })
    await waitFor(() => errorsIn(host).length === 1, 'the early merge refused')

    write({ answer: 'Cerise', roundId, seat: zoe })
    host.send({ roundId, type: 'host.reveal' })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    const [key] = groupKeys(zoe)

    host.send({
      from: key ?? '',
      into: key ?? '',
      roundId,
      type: 'host.mergeGroups'
    })
    await waitFor(() => errorsIn(host).length === 2, 'the self-merge refused')
    host.send({ key: key ?? '', roundId, type: 'host.splitGroup' })
    await waitFor(() => errorsIn(host).length === 3, 'the empty split refused')

    expect(errorsIn(host).map(({ code }) => code)).toEqual([
      'wrong_phase',
      'invalid_message',
      'invalid_message'
    ])
  })

  it('[thinkalike] refuses a second answer and a latecomer’s', async () => {
    const { code, roundId, zoe } = await roundInPlay()
    const late = await harness.seat({ code, nickname: 'Ana' })

    write({ answer: 'Cerise', roundId, seat: zoe })
    await waitFor(
      () => thinkAlikeRound(playerView(zoe))?.yourAnswer === 'Cerise',
      'the answer to land'
    )
    write({ answer: 'Fraise', roundId, seat: zoe })
    await waitFor(() => errorsIn(zoe).length === 1, 'the second answer refused')
    write({ answer: 'Fraise', roundId, seat: late })
    await waitFor(() => errorsIn(late).length === 1, 'the late answer refused')

    expect(errorsIn(zoe).map(({ code }) => code)).toEqual(['already_buzzed'])
    expect(errorsIn(late).map(({ code }) => code)).toEqual(['joined_mid_round'])
    expect(thinkAlikeRound(playerView(zoe))?.yourAnswer).toBe('Cerise')
  })

  it('[thinkalike] sends a line still in its field for the seat when the round closes', async () => {
    const { host, lou, max, roundId, zoe } = await roundInPlay()

    lou.send({
      answer: { answer: 'Fraise', kind: 'match' },
      roundId,
      type: 'player.lean'
    })
    lou.send({ clientSentAt: 1, type: 'time.ping' })
    await waitFor(
      () => lou.frames.some(({ message }) => message.type === 'time.pong'),
      'the lean to be read'
    )
    write({ answer: 'Fraises', roundId, seat: zoe })
    write({ answer: 'Cerise', roundId, seat: max })
    await waitFor(
      () => thinkAlikeRound(playerView(max))?.yourAnswer === 'Cerise',
      'the sent answers to land'
    )

    expect(hostView(host)?.phase).toBe('playing')

    host.send({ roundId, type: 'host.reveal' })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    const lean = hostView(host)?.round?.awards.find(
      ({ playerId }) => playerId === idOf(lou)
    )

    expect(lean).toMatchObject({
      isUnsent: true,
      points: pointsForMatch({ matched: 1, others: 2 }),
      verdict: { kind: 'match', matched: 1, others: 2 }
    })
    expect(thinkAlikeRound(playerView(lou))?.yourAnswer).toBe('Fraise')
  })
})
