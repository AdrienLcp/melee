import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PAWN_COLOUR_COUNT, type PawnPiece } from '@melee/protocol/team'

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

const pieceOf = (
  view: { players: (PawnPiece & { nickname: string })[] } | null,
  nickname: string
): PawnPiece | undefined => {
  const player = view?.players.find((seated) => seated.nickname === nickname)

  return player === undefined
    ? undefined
    : { colour: player.colour, head: player.head }
}

describe("a seat's own piece", () => {
  let harness: RoomHarness

  beforeEach(async () => {
    harness = await startRoomHarness()
  })

  afterEach(async () => {
    await harness.stop()
  })

  it('[seats] seats an arrival in the piece its screen asks for, or the first free one', async () => {
    const { code, host } = await harness.openRoom(FAST_GAME)

    await harness.seat({
      code,
      nickname: 'Anna',
      pawnColour: 7,
      pawnHead: 'square'
    })
    await harness.seat({
      code,
      nickname: 'Ben',
      pawnColour: 7,
      pawnHead: 'square'
    })
    await harness.seat({ code, nickname: 'Carl', pawnColour: 7 })

    expect(
      hostView(host)?.players.map(({ colour, head }) => ({ colour, head }))
    ).toEqual([
      { colour: 7, head: 'square' },
      { colour: 1, head: 'round' },
      { colour: 7, head: 'round' }
    ])
  })

  it('[seats] keeps the piece a returning seat holds, whatever its screen asks for', async () => {
    const { code, host } = await harness.openRoom(FAST_GAME)
    const anna = await harness.seat({
      code,
      nickname: 'Anna',
      pawnColour: 4,
      pawnHead: 'point',
      sessionId: 'anna-session'
    })

    anna.close()
    await harness.seat({
      code,
      nickname: 'Anna',
      pawnColour: 9,
      pawnHead: 'square',
      sessionId: 'anna-session'
    })
    await waitFor(
      () => hostView(host)?.players[0]?.isConnected === true,
      'the seat back'
    )

    expect(pieceOf(hostView(host), 'Anna')).toEqual({
      colour: 4,
      head: 'point'
    })
  })

  it('[seats] changes a piece on every screen, and refuses one another seat holds', async () => {
    const { code, host } = await harness.openRoom(FAST_GAME)
    const anna = await harness.seat({ code, nickname: 'Anna' })
    const ben = await harness.seat({ code, nickname: 'Ben' })

    anna.send({ colour: 11, head: 'point', type: 'player.recolourSeat' })
    await waitFor(
      () => pieceOf(playerView(ben), 'Anna')?.head === 'point',
      'the new piece'
    )
    expect(pieceOf(hostView(host), 'Anna')).toEqual({
      colour: 11,
      head: 'point'
    })

    ben.send({ colour: 11, head: 'point', type: 'player.recolourSeat' })
    await waitFor(() => errorsIn(ben).length > 0, 'the refusal')

    expect(errorsIn(ben)[0]?.code).toBe('colour_taken')
    expect(pieceOf(hostView(host), 'Ben')).toEqual({ colour: 2, head: 'round' })

    ben.send({ colour: 11, head: 'square', type: 'player.recolourSeat' })
    await waitFor(
      () => pieceOf(hostView(host), 'Ben')?.colour === 11,
      'the same colour in another head'
    )
    expect(pieceOf(hostView(host), 'Ben')).toEqual({
      colour: 11,
      head: 'square'
    })
  })

  it('[seats] seats the thirteenth arrival in a square head, and never shares a piece past twelve', async () => {
    const { code, host } = await harness.openRoom(FAST_GAME)
    const second = await harness.seat({ code, nickname: 'Seat 1' })

    for (let index = 2; index <= PAWN_COLOUR_COUNT + 1; index += 1) {
      await harness.seat({ code, nickname: `Seat ${index}` })
    }

    expect(pieceOf(hostView(host), `Seat ${PAWN_COLOUR_COUNT + 1}`)).toEqual({
      colour: 1,
      head: 'square'
    })

    second.send({ colour: 5, head: 'round', type: 'player.recolourSeat' })
    await waitFor(() => errorsIn(second).length > 0, 'the refusal')

    expect(errorsIn(second)[0]?.code).toBe('colour_taken')
  })

  it('[seats] refuses a repaint while a round plays, and takes the console repaint between two', async () => {
    const { code, host } = await harness.openRoom(FAST_GAME)
    const anna = await harness.seat({ code, nickname: 'Anna' })

    host.send({ type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the clip')

    anna.send({ colour: 6, head: 'round', type: 'player.recolourSeat' })
    await waitFor(() => errorsIn(anna).length > 0, 'the refusal')
    expect(errorsIn(anna)[0]?.code).toBe('wrong_phase')

    host.send({ roundId: hostView(host)?.round?.id ?? '', type: 'host.reveal' })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')
    host.send({
      colour: 6,
      head: 'square',
      playerId: playerView(anna)?.youId ?? '',
      type: 'host.recolourSeat'
    })
    await waitFor(
      () => pieceOf(playerView(anna), 'Anna')?.head === 'square',
      'the new piece'
    )
    expect(pieceOf(playerView(anna), 'Anna')?.colour).toBe(6)
  })

  it('[seats] refuses a seat repaint sent by a player as the host', async () => {
    const { code } = await harness.openRoom(FAST_GAME)
    const anna = await harness.seat({ code, nickname: 'Anna' })

    anna.send({
      colour: 6,
      head: 'point',
      playerId: playerView(anna)?.youId ?? '',
      type: 'host.recolourSeat'
    })
    await waitFor(() => errorsIn(anna).length > 0, 'the refusal')

    expect(pieceOf(playerView(anna), 'Anna')).toEqual({
      colour: 1,
      head: 'round'
    })
  })
})
