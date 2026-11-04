import { describe, expect, it } from 'vitest'

import { MAX_PLAYERS_PER_ROOM } from '@melee/protocol/room'
import {
  PAWN_COLOUR_COUNT,
  PAWN_HEADS,
  type PawnHead,
  type PawnPiece
} from '@melee/protocol/team'

import { isPawnPieceFree, pawnPieceForArrival, pawnPieceOf } from './pawn-piece'

const EVERY_COLOUR = Array.from(
  { length: PAWN_COLOUR_COUNT },
  (_, index) => index + 1
)

const everyColourIn = (head: PawnHead): PawnPiece[] =>
  EVERY_COLOUR.map((colour) => ({ colour, head }))

describe('pawn pieces', () => {
  it('[pawn] holds more pieces than a room holds seats, so a piece is never shared', () => {
    expect(MAX_PLAYERS_PER_ROOM).toBeLessThan(
      PAWN_COLOUR_COUNT * PAWN_HEADS.length
    )
  })

  it('[pawn] refuses a piece another seat holds, and offers its colour in another head', () => {
    const heldByOthers: PawnPiece[] = [{ colour: 3, head: 'round' }]

    expect(
      isPawnPieceFree({ heldByOthers, piece: { colour: 3, head: 'round' } })
    ).toBe(false)
    expect(
      isPawnPieceFree({ heldByOthers, piece: { colour: 3, head: 'point' } })
    ).toBe(true)
  })

  it('[pawn] refuses a held piece even once every colour is held', () => {
    expect(
      isPawnPieceFree({
        heldByOthers: everyColourIn('round'),
        piece: { colour: 3, head: 'round' }
      })
    ).toBe(false)
  })

  it('[pawn] seats an arrival in the piece its screen asks for when it is free', () => {
    expect(
      pawnPieceForArrival({
        asked: { colour: 7, head: 'square' },
        heldByOthers: [{ colour: 7, head: 'round' }]
      })
    ).toEqual({ colour: 7, head: 'square' })
  })

  it('[pawn] seats an arrival asking for a held piece in the first colour nobody holds', () => {
    expect(
      pawnPieceForArrival({
        asked: { colour: 1, head: 'round' },
        heldByOthers: [
          { colour: 1, head: 'round' },
          { colour: 2, head: 'point' },
          { colour: 4, head: 'round' }
        ]
      })
    ).toEqual({ colour: 3, head: 'round' })
    expect(
      pawnPieceForArrival({
        asked: null,
        heldByOthers: [{ colour: 1, head: 'round' }]
      })
    ).toEqual({ colour: 2, head: 'round' })
  })

  it('[pawn] stands a table of twelve in round heads, and the thirteenth in the first square one', () => {
    expect(
      pawnPieceForArrival({ asked: null, heldByOthers: everyColourIn('round') })
    ).toEqual({ colour: 1, head: 'square' })
  })

  it('[pawn] deals a colour its heads in the order round, square, point', () => {
    expect(
      pawnPieceForArrival({
        asked: null,
        heldByOthers: [...everyColourIn('round'), ...everyColourIn('square')]
      })
    ).toEqual({ colour: 1, head: 'point' })
  })

  it('[pawn] seats an arrival beside two seats a stored room left in one piece', () => {
    expect(
      pawnPieceForArrival({
        asked: { colour: 1, head: 'round' },
        heldByOthers: [...everyColourIn('round'), { colour: 1, head: 'round' }]
      })
    ).toEqual({ colour: 2, head: 'square' })
  })

  it("[pawn] draws a seat in its team's colour with a round head, and in its own piece without one", () => {
    const teams = [{ colour: 9, seatIds: ['anna'] }]

    expect(
      pawnPieceOf({ player: { colour: 2, head: 'point', id: 'anna' }, teams })
    ).toEqual({ colour: 9, head: 'round' })
    expect(
      pawnPieceOf({ player: { colour: 2, head: 'point', id: 'ben' }, teams })
    ).toEqual({ colour: 2, head: 'point' })
  })
})
