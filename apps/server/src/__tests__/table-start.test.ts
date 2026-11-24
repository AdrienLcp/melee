import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_BUZZER_SETTINGS } from '@melee/protocol/game'
import { DEFAULT_MODE_SETTINGS, type RoomSettings } from '@melee/protocol/room'

import { nowMs } from '@/infrastructure/clock'

import { startRoomHarness } from './node-room-harness'
import {
  FAST_GAME,
  hostView,
  playerView,
  type RoomHarness,
  sleep,
  waitFor
} from './room-harness'

/** Short enough that a suite watches a whole table start rather than its deadline. */
const { SHORT_READY_HOLD_MS } = vi.hoisted(() => ({ SHORT_READY_HOLD_MS: 600 }))

vi.mock('@melee/protocol/room', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@melee/protocol/room')>()),
  READY_HOLD_MS: SHORT_READY_HOLD_MS
}))

vi.mock('@melee/core/room/seat-presence', async () => {
  const { seatPresenceWithoutGrace } = await import('./room-harness')

  return seatPresenceWithoutGrace()
})

vi.mock('@/infrastructure/music/deezer-client', async () => {
  const { deezerClientStub } = await import('./room-harness')

  return deezerClientStub()
})

/** Longer than a whole ready hold, so a start that was due has happened. */
const PAST_THE_HOLD_MS = SHORT_READY_HOLD_MS * 3

const ONE_ROUND: RoomSettings = { ...FAST_GAME, roundCount: 1 }

/** A game with no track to draw, whose start waits out the whole hold. */
const BARE_BUZZER: RoomSettings = {
  ...FAST_GAME,
  game: DEFAULT_BUZZER_SETTINGS,
  lineUp: [DEFAULT_BUZZER_SETTINGS],
  mode: DEFAULT_MODE_SETTINGS.buzzer
}

describe('a table that opens, ends and replays its game by itself', () => {
  let harness: RoomHarness

  beforeEach(async () => {
    harness = await startRoomHarness()
  })

  afterEach(async () => {
    await harness.stop()
  })

  const seatedTable = async (settings: RoomSettings = FAST_GAME) => {
    const { code, host } = await harness.openRoom(settings)
    const zoe = await harness.seat({ code, nickname: 'Zoe' })
    const max = await harness.seat({ code, nickname: 'Max' })

    return { code, host, max, zoe }
  }

  const finalReveal = async () => {
    const table = await seatedTable(ONE_ROUND)

    table.host.send({ type: 'host.startRound' })
    await waitFor(
      () => hostView(table.host)?.phase === 'playing',
      'the clip to start'
    )
    table.host.send({
      roundId: hostView(table.host)?.round?.id ?? '',
      type: 'host.reveal'
    })
    await waitFor(
      () => hostView(table.host)?.phase === 'revealed',
      'the final reveal'
    )

    return table
  }

  const finishedTable = async () => {
    const table = await finalReveal()

    table.host.send({ type: 'host.nextRound' })
    await waitFor(
      () => hostView(table.host)?.phase === 'finished',
      'the final board'
    )

    return table
  }

  it('[table-start] opens the game once every seat in the lobby is ready', async () => {
    const { host, max, zoe } = await seatedTable()

    zoe.send({ isReady: true, type: 'player.ready' })
    max.send({ isReady: true, type: 'player.ready' })
    await waitFor(
      () => playerView(zoe)?.readyStartsAt != null,
      'the table’s start'
    )
    await waitFor(
      () => hostView(host)?.phase === 'playing',
      'the round the table opened'
    )

    expect(hostView(host)?.readyStartsAt).toBeNull()
    expect(hostView(host)?.players.some((seat) => seat.isReady)).toBe(false)
  })

  it('[table-start] waits on one seat that is not ready', async () => {
    const { host, zoe } = await seatedTable()

    zoe.send({ isReady: true, type: 'player.ready' })
    await waitFor(
      () => hostView(host)?.players.some((seat) => seat.isReady) === true,
      'the first ready'
    )
    await sleep(PAST_THE_HOLD_MS)

    expect(hostView(host)?.readyStartsAt).toBeNull()
    expect(hostView(host)?.phase).toBe('lobby')
  })

  it('[table-start] calls the start off when a seat takes its ready back', async () => {
    const { host, max, zoe } = await seatedTable()

    zoe.send({ isReady: true, type: 'player.ready' })
    max.send({ isReady: true, type: 'player.ready' })
    await waitFor(
      () => hostView(host)?.readyStartsAt != null,
      'the table’s start'
    )
    max.send({ isReady: false, type: 'player.ready' })
    await waitFor(
      () => hostView(host)?.readyStartsAt === null,
      'the start to go'
    )
    await sleep(PAST_THE_HOLD_MS)

    expect(hostView(host)?.phase).toBe('lobby')
  })

  it('[table-start] holds the start for a seat that sits down after everyone was ready', async () => {
    const { code, host, max, zoe } = await seatedTable()

    zoe.send({ isReady: true, type: 'player.ready' })
    max.send({ isReady: true, type: 'player.ready' })
    await waitFor(
      () => hostView(host)?.readyStartsAt != null,
      'the table’s start'
    )
    await harness.seat({ code, nickname: 'Léa' })
    await waitFor(
      () => hostView(host)?.readyStartsAt === null,
      'the newcomer to hold it'
    )
    await sleep(PAST_THE_HOLD_MS)

    expect(hostView(host)?.phase).toBe('lobby')
  })

  it('[table-start] opens the game for one seat alone', async () => {
    const { code, host } = await harness.openRoom(FAST_GAME)
    const zoe = await harness.seat({ code, nickname: 'Zoe' })

    zoe.send({ isReady: true, type: 'player.ready' })
    await waitFor(
      () => hostView(host)?.players[0]?.isReady === true,
      'the ready'
    )
    await sleep(PAST_THE_HOLD_MS)

    expect(hostView(host)?.phase).not.toBe('lobby')
  })

  it('[table-start] lets the host open the game at once over a counting table', async () => {
    const { host, max, zoe } = await seatedTable(BARE_BUZZER)

    zoe.send({ isReady: true, type: 'player.ready' })
    max.send({ isReady: true, type: 'player.ready' })
    await waitFor(
      () => hostView(host)?.readyStartsAt != null,
      'the table’s start'
    )

    const tableStartsAt = hostView(host)?.readyStartsAt ?? 0

    host.send({ type: 'host.startRound' })
    await waitFor(
      () => hostView(host)?.phase !== 'lobby',
      'the host’s own start'
    )

    expect(nowMs()).toBeLessThan(tableStartsAt - BARE_BUZZER.countdownMs)
    expect(hostView(host)?.readyStartsAt).toBeNull()
  })

  it('[table-start] opens nothing at a table whose host keeps every press', async () => {
    const { host, max, zoe } = await seatedTable({
      ...FAST_GAME,
      hostOpensNextRound: true
    })

    zoe.send({ isReady: true, type: 'player.ready' })
    max.send({ isReady: true, type: 'player.ready' })
    await sleep(PAST_THE_HOLD_MS)

    expect(hostView(host)?.readyStartsAt).toBeNull()
    expect(hostView(host)?.phase).toBe('lobby')
  })

  it('[table-start] puts the final board up once every seat is ready on the last reveal', async () => {
    const { host, max, zoe } = await finalReveal()

    zoe.send({ isReady: true, type: 'player.ready' })
    max.send({ isReady: true, type: 'player.ready' })
    await waitFor(
      () => hostView(host)?.round?.isReadyHold === true,
      'the ready hold'
    )
    await waitFor(() => hostView(host)?.phase === 'finished', 'the final board')

    expect(hostView(host)?.players.some((seat) => seat.isReady)).toBe(false)
    expect(hostView(host)?.readyStartsAt).toBeNull()
  })

  it('[table-start] keeps the last reveal up for a table whose host keeps every press', async () => {
    const table = await finalReveal()

    table.host.send({
      settings: { ...ONE_ROUND, hostOpensNextRound: true },
      type: 'host.updateSettings'
    })
    await waitFor(
      () => hostView(table.host)?.settings.hostOpensNextRound === true,
      'the setting'
    )
    table.zoe.send({ isReady: true, type: 'player.ready' })
    table.max.send({ isReady: true, type: 'player.ready' })
    await sleep(PAST_THE_HOLD_MS)

    expect(hostView(table.host)?.phase).toBe('revealed')
  })

  it('[table-start] plays the game again once every seat is ready on the final board', async () => {
    const { host, max, zoe } = await finishedTable()

    zoe.send({ isReady: true, type: 'player.ready' })
    max.send({ isReady: true, type: 'player.ready' })
    await waitFor(() => hostView(host)?.readyStartsAt != null, 'the replay')
    await waitFor(
      () => hostView(host)?.phase === 'playing',
      'the game played again'
    )

    expect(hostView(host)?.round?.index).toBe(1)
  })

  it('[table-start] waits on the final board for a seat that is not ready', async () => {
    const { host, zoe } = await finishedTable()

    zoe.send({ isReady: true, type: 'player.ready' })
    await sleep(PAST_THE_HOLD_MS)

    expect(hostView(host)?.readyStartsAt).toBeNull()
    expect(hostView(host)?.phase).toBe('finished')
  })

  it('[table-start] sends a table back to the room unready when the host does', async () => {
    const { host, max, zoe } = await finishedTable()

    zoe.send({ isReady: true, type: 'player.ready' })
    max.send({ isReady: true, type: 'player.ready' })
    host.send({ type: 'host.playAgain' })
    await waitFor(() => hostView(host)?.phase === 'lobby', 'the lobby')
    await sleep(PAST_THE_HOLD_MS)

    expect(hostView(host)?.phase).toBe('lobby')
  })
})
