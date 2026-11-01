import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PAWN_COLOUR_COUNT } from '@melee/protocol/team'

import { startRoomHarness } from './node-room-harness'
import {
  errorsIn,
  FAST_GAME,
  hostView,
  playerView,
  type RoomHarness,
  waitFor
} from './room-harness'

vi.mock('@/infrastructure/music/deezer-client', async () => {
  const { deezerClientStub } = await import('./room-harness')

  return deezerClientStub()
})

const colourOf = (
  view: { players: { colour: number; nickname: string }[] } | null,
  nickname: string
): number | undefined =>
  view?.players.find((player) => player.nickname === nickname)?.colour

describe("a seat's own pawn colour", () => {
  let harness: RoomHarness

  beforeEach(async () => {
    harness = await startRoomHarness()
  })

  afterEach(async () => {
    await harness.stop()
  })

  it('[seats] seats an arrival in the colour its screen asks for, or the first free one', async () => {
    const { code, host } = await harness.openRoom(FAST_GAME)

    await harness.seat({ code, nickname: 'Anna', pawnColour: 7 })
    await harness.seat({ code, nickname: 'Ben', pawnColour: 7 })
    await harness.seat({ code, nickname: 'Carl' })

    expect(hostView(host)?.players.map((player) => player.colour)).toEqual([
      7, 1, 2
    ])
  })

  it('[seats] keeps the colour a returning seat holds, whatever its screen asks for', async () => {
    const { code, host } = await harness.openRoom(FAST_GAME)
    const anna = await harness.seat({
      code,
      nickname: 'Anna',
      pawnColour: 4,
      sessionId: 'anna-session'
    })

    anna.close()
    await harness.seat({
      code,
      nickname: 'Anna',
      pawnColour: 9,
      sessionId: 'anna-session'
    })
    await waitFor(
      () => hostView(host)?.players[0]?.isConnected === true,
      'the seat back'
    )

    expect(colourOf(hostView(host), 'Anna')).toBe(4)
  })

  it('[seats] repaints a seat on every screen, and refuses a colour another seat holds', async () => {
    const { code, host } = await harness.openRoom(FAST_GAME)
    const anna = await harness.seat({ code, nickname: 'Anna' })
    const ben = await harness.seat({ code, nickname: 'Ben' })

    anna.send({ colour: 11, type: 'player.recolourSeat' })
    await waitFor(() => colourOf(playerView(ben), 'Anna') === 11, 'the repaint')
    expect(colourOf(hostView(host), 'Anna')).toBe(11)

    ben.send({ colour: 11, type: 'player.recolourSeat' })
    await waitFor(() => errorsIn(ben).length > 0, 'the refusal')

    expect(errorsIn(ben)[0]?.code).toBe('colour_taken')
    expect(colourOf(hostView(host), 'Ben')).toBe(2)
  })

  it('[seats] lets a seat share a colour once every colour is held', async () => {
    const { code, host } = await harness.openRoom(FAST_GAME)
    const seats = []

    for (let index = 0; index <= PAWN_COLOUR_COUNT; index += 1) {
      seats.push(await harness.seat({ code, nickname: `Seat ${index}` }))
    }

    seats[0]?.send({ colour: 5, type: 'player.recolourSeat' })
    await waitFor(
      () => colourOf(hostView(host), 'Seat 0') === 5,
      'the shared colour'
    )
  })

  it('[seats] refuses a repaint while a round plays, and takes the console repaint between two', async () => {
    const { code, host } = await harness.openRoom(FAST_GAME)
    const anna = await harness.seat({ code, nickname: 'Anna' })

    host.send({ type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the clip')

    anna.send({ colour: 6, type: 'player.recolourSeat' })
    await waitFor(() => errorsIn(anna).length > 0, 'the refusal')
    expect(errorsIn(anna)[0]?.code).toBe('wrong_phase')

    host.send({ roundId: hostView(host)?.round?.id ?? '', type: 'host.reveal' })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')
    host.send({
      colour: 6,
      playerId: playerView(anna)?.youId ?? '',
      type: 'host.recolourSeat'
    })
    await waitFor(() => colourOf(playerView(anna), 'Anna') === 6, 'the repaint')
  })

  it('[seats] refuses a seat repaint sent by a player as the host', async () => {
    const { code } = await harness.openRoom(FAST_GAME)
    const anna = await harness.seat({ code, nickname: 'Anna' })

    anna.send({
      colour: 6,
      playerId: playerView(anna)?.youId ?? '',
      type: 'host.recolourSeat'
    })
    await waitFor(() => errorsIn(anna).length > 0, 'the refusal')

    expect(colourOf(playerView(anna), 'Anna')).toBe(1)
  })
})
