import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { startRoomHarness } from './node-room-harness'
import { FAST_GAME, hostView, waitFor } from './room-harness'

vi.mock('@/infrastructure/questions/question-bank', async () => {
  const { questionBankStub } = await import('./room-harness')

  return questionBankStub()
})

vi.mock('@/infrastructure/music/deezer-client', async () => {
  const { deezerClientStub } = await import('./room-harness')

  return deezerClientStub()
})

describe('live rooms and what a room reports', () => {
  let harness: Awaited<ReturnType<typeof startRoomHarness>>

  beforeEach(async () => {
    harness = await startRoomHarness()
  })

  afterEach(async () => {
    await harness.stop()
  })

  it('[live-rooms] writes a row as a room opens, gains a seat and closes, and never a name', async () => {
    const { code, host } = await harness.openRoom(FAST_GAME)
    const rowOf = () => harness.reports.liveRoomRows.get(code)

    expect(rowOf()).toMatchObject({
      closedAt: null,
      code,
      game: 'blindtest',
      phase: 'lobby',
      wallCount: 0
    })

    await harness.seat({ code, nickname: 'Zoe Lefebvre' })
    await waitFor(() => rowOf()?.seatCount === 1, 'the seat to be counted')

    expect(JSON.stringify(rowOf())).not.toContain('Zoe')

    host.send({ type: 'host.closeRoom' })
    await waitFor(() => rowOf()?.closedAt != null, 'the room to say it closed')
  })

  it('[live-rooms] follows the phase as a round opens', async () => {
    const { code, host } = await harness.openRoom(FAST_GAME)

    await harness.seat({ code, nickname: 'Zoe' })
    host.send({ type: 'host.startRound' })

    await waitFor(
      () => harness.reports.liveRoomRows.get(code)?.phase === 'playing',
      'the row to reach the round'
    )
    expect(harness.reports.liveRoomRows.get(code)?.roundIndex).toBe(1)
  })

  it('[reports] keeps the clip a speaking console reports silent as a server row', async () => {
    const { code, host } = await harness.openRoom(FAST_GAME)

    await harness.seat({ code, nickname: 'Zoe' })
    host.send({ type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the clip')

    const roundId = hostView(host)?.round?.id ?? 'no-round'

    host.send({ fault: 'blocked', roundId, type: 'speaker.reportClip' })
    await waitFor(
      () => harness.reports.kept.some((row) => row.kind === 'clip-reported'),
      'the server to keep the report'
    )

    expect(
      harness.reports.kept.find((row) => row.kind === 'clip-reported')
    ).toMatchObject({
      code: 'blocked',
      game: 'blindtest',
      role: 'host',
      roomCode: code,
      source: 'server'
    })
  })
})
