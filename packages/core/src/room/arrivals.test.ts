import { describe, expect, it } from 'vitest'

import type { PublicPlayer } from '@melee/protocol/room'

import { arrivedPlayers } from './arrivals'

const seat = (id: string, nickname: string): PublicPlayer => ({
  id,
  isConnected: true,
  nickname,
  score: 0
})

const cyril = seat('p-cyril', 'Cyril')
const lea = seat('p-lea', 'Léa')

describe('arrivedPlayers', () => {
  it('[arrivals] names the seat that was not there before', () => {
    expect(arrivedPlayers({ after: [cyril, lea], before: [cyril.id] })).toEqual(
      [lea]
    )
  })

  it('[arrivals] names nobody on the first snapshot a screen receives', () => {
    expect(arrivedPlayers({ after: [cyril, lea], before: null })).toEqual([])
  })

  it('[arrivals] names nobody when a seat leaves', () => {
    expect(
      arrivedPlayers({ after: [cyril], before: [cyril.id, lea.id] })
    ).toEqual([])
  })
})
