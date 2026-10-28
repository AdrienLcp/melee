import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_SWATCH_SETTINGS } from '@melee/protocol/game'
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
  type PlayerServerMessage,
  type WallServerMessage,
  wallServerMessageSchema
} from '@melee/protocol/server-message'
import { PROTOCOL_VERSION } from '@melee/protocol/version'

import { pointsForColour } from '@melee/core/swatch/colour-pay'
import { colourDistance } from '@melee/core/swatch/oklab'

import { nowMs } from '@/infrastructure/clock'

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

const SHOWN = '#3a7bd5'
const NEAR = '#5080c0'
const GREY = '#808080'

/** The settings' floor is two seconds a glance, which a suite has no reason to wait out. */
vi.mock('@/domain/round/swatch-round', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/domain/round/swatch-round')>()),
  swatchContent: () => ({
    colour: SHOWN,
    kind: 'swatch',
    sent: [],
    showMs: 150
  })
}))

const SWATCH: RoomSettings = {
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game: DEFAULT_SWATCH_SETTINGS,
  mode: DEFAULT_MODE_SETTINGS.colour,
  roundCount: 3
}

const swatchRound = (
  view: { round: RoundView | null } | null
): Extract<RoundContent, { kind: 'swatch' }> | null => {
  const content = view?.round?.content

  return content?.kind === 'swatch' ? content : null
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
  const { code, host, hostToken } = await harness.openRoom(SWATCH)
  const wall = await pairedWall({ code, hostToken })
  const zoe = await harness.seat({ code, nickname: 'Zoe' })
  const max = await harness.seat({ code, nickname: 'Max' })

  host.send({ type: 'host.startRound' })
  await waitFor(
    () => swatchRound(playerView(zoe))?.colour != null,
    'the colour to go up'
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

const untilHidden = async (seat: Peer<PlayerServerMessage>) => {
  const hidesAt = swatchRound(playerView(seat))?.hidesAt

  if (hidesAt == null) {
    throw new Error('The colour never hides')
  }

  await new Promise((resolve) =>
    setTimeout(resolve, Math.max(0, hidesAt + 10 - nowMs()))
  )
}

describe('a shades round through the seam', () => {
  it('[swatch] shows the colour to every seat with when it hides, and withholds nothing from the console', async () => {
    const { host, wall, zoe } = await roundInPlay()
    const round = swatchRound(playerView(zoe))

    expect(round?.colour).toBe(SHOWN)
    expect(round?.hidesAt).toBe((playerView(zoe)?.round?.startsAt ?? 0) + 150)
    expect(round?.revealedColours).toBeNull()
    expect(round?.yourColour).toBeNull()
    expect(swatchRound(hostView(host))?.colour).toBe(SHOWN)
    expect(hostView(host)?.currentContent).toEqual({ kind: 'swatch' })
    expect(wallView(wall)?.currentContent).toEqual({ kind: 'swatch' })
  })

  it('[swatch] sends no colour during the countdown', async () => {
    const { zoe } = await roundInPlay()
    const countdownFrames = zoe.frames.filter(
      ({ message }) =>
        message.type === 'room.updated' && message.view.phase === 'countdown'
    )

    expect(countdownFrames.length).toBeGreaterThan(0)
    expect(transcriptOf(countdownFrames)).not.toContain(SHOWN)
  })

  it('[swatch] refuses a colour while it is still shown, and keeps the seat its one shot', async () => {
    const { roundId, zoe } = await roundInPlay()
    const send = () =>
      zoe.send({
        answer: { colour: SHOWN, kind: 'colour' },
        roundId,
        type: 'player.answer'
      })

    send()
    await waitFor(() => errorsIn(zoe).length === 1, 'the early colour refused')
    await untilHidden(zoe)
    send()
    await waitFor(
      () => swatchRound(playerView(zoe))?.yourColour === SHOWN,
      'the colour to land'
    )
    send()
    await waitFor(() => errorsIn(zoe).length === 2, 'the second colour refused')

    expect(errorsIn(zoe).map(({ code }) => code)).toEqual([
      'colour_still_shown',
      'already_buzzed'
    ])
  })

  it('[swatch] sends no frame carrying the colour once it hid, to a seat, the wall or a late arrival', async () => {
    const { code, max, roundId, wall, zoe } = await roundInPlay()

    await untilHidden(zoe)

    const zoeFrom = zoe.frames.length
    const wallFrom = wall.frames.length

    max.send({
      answer: { colour: GREY, kind: 'colour' },
      roundId,
      type: 'player.answer'
    })
    await waitFor(
      () => (playerView(zoe)?.round?.answers.length ?? 0) === 1,
      'the colour to land'
    )

    const late = await harness.seat({ code, nickname: 'Lou' })

    expect(zoe.frames.length).toBeGreaterThan(zoeFrom)
    expect(transcriptOf(zoe.frames.slice(zoeFrom))).not.toContain(SHOWN)
    expect(transcriptOf(wall.frames.slice(wallFrom))).not.toContain(SHOWN)
    expect(transcriptOf(late.frames)).not.toContain(SHOWN)
    expect(swatchRound(playerView(zoe))?.colour).toBeNull()
  })

  it('[swatch] pays the nearest colour most, with no speed bonus, and reveals every colour beside the shown one', async () => {
    const { host, max, roundId, zoe } = await roundInPlay()

    await untilHidden(zoe)
    zoe.send({
      answer: { colour: SHOWN, kind: 'colour' },
      roundId,
      type: 'player.answer'
    })
    max.send({
      answer: { colour: NEAR, kind: 'colour' },
      roundId,
      type: 'player.answer'
    })
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    const view = hostView(host)
    const zoeId = playerView(zoe)?.youId ?? null
    const maxId = playerView(max)?.youId ?? null
    const awardOf = (playerId: string | null) =>
      view?.round?.awards.find((award) => award.playerId === playerId)
    const nearPays = pointsForColour({
      distance: colourDistance({ sent: NEAR, shown: SHOWN })
    })

    expect(awardOf(zoeId)?.verdict).toEqual({ distance: 0, kind: 'colour' })
    expect(basePointsFor({ playerId: zoeId, view })).toBe(3 * POINT)
    expect(basePointsFor({ playerId: maxId, view })).toBe(nearPays)
    expect(nearPays).toBeGreaterThan(0)
    expect(nearPays).toBeLessThan(3 * POINT)
    expect(awardOf(zoeId)?.speedBonus).toBe(0)
    expect(awardOf(maxId)?.speedBonus).toBe(0)

    const revealed = swatchRound(playerView(max))

    expect(revealed?.colour).toBe(SHOWN)
    expect(
      revealed?.revealedColours?.map(({ colour }) => colour).toSorted()
    ).toEqual([NEAR, SHOWN].toSorted())
  })
})
