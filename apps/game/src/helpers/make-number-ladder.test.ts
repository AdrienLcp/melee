import { describe, expect, it } from 'vitest'

import {
  chipFit,
  initialsOf,
  ladderOf,
  nameWithin,
  wordsOf
} from './make-number-ladder'

const seat = (name: string, value: number | null) => ({ name, value })

describe('ladderOf', () => {
  it('[ladder] puts each seat on its distance and side, the far ones at the end', () => {
    const ladder = ladderOf({
      seats: [
        seat('Ana', 627),
        seat('Bea', 624),
        seat('Cyr', 630),
        seat('Dan', 610),
        seat('Eve', null),
        seat('Flo', 627)
      ],
      target: 627
    })

    expect(ladder.exact.under.map(({ name }) => name)).toEqual(['Ana'])
    expect(ladder.exact.over.map(({ name }) => name)).toEqual(['Flo'])
    expect(ladder.rungs[2]?.under.map(({ name }) => name)).toEqual(['Bea'])
    expect(ladder.rungs[2]?.over.map(({ name }) => name)).toEqual(['Cyr'])
    expect(ladder.rungs.at(-1)?.under.map(({ name }) => name)).toEqual(['Dan'])
    expect(ladder.waiting.map(({ name }) => name)).toEqual(['Eve'])
  })
})

describe('chipFit', () => {
  const named = { figureLength: 3, wordLengths: [9, 7] }

  it('[ladder] shows every name and value when the row has the width', () => {
    const fit = chipFit({
      capPx: 22,
      chips: [named, named],
      floorPx: 14,
      height: 44,
      width: 600
    })

    expect(fit.looks).toEqual(['named', 'named'])
    expect(fit.wordCounts).toEqual([2, 2])
    expect(fit.lines).toBe(1)
  })

  it('[ladder] stacks a crowded row on two lines before it drops the names', () => {
    const fit = chipFit({
      capPx: 22,
      chips: Array.from({ length: 8 }, () => named),
      floorPx: 14,
      height: 90,
      width: 600
    })

    expect(fit.lines).toBeGreaterThan(1)
    expect(fit.looks.every((look) => look === 'named' || look === 'name')).toBe(
      true
    )
  })

  it("[ladder] drops a name's last words before its value", () => {
    const fit = chipFit({
      capPx: 14,
      chips: [named, named, named],
      floorPx: 14,
      height: 30,
      width: 480
    })

    expect(fit.looks).toEqual(['named', 'named', 'named'])
    expect(fit.wordCounts).toEqual([1, 1, 1])
  })

  it('[ladder] falls to initials, then pawns, when a short row is crowded', () => {
    const crowded = chipFit({
      capPx: 22,
      chips: Array.from({ length: 10 }, () => named),
      floorPx: 14,
      height: 30,
      width: 600
    })
    const packed = chipFit({
      capPx: 22,
      chips: Array.from({ length: 24 }, () => named),
      floorPx: 14,
      height: 30,
      width: 600
    })

    expect(crowded.looks[0]).toBe('initials')
    expect(packed.looks[0]).toBe('pawn')
  })
})

describe('initialsOf and wordsOf', () => {
  it('[ladder] cuts a name at whole words, and to two initials', () => {
    expect(wordsOf('Jean-Baptiste  de la Tour')).toEqual([
      'Jean-Baptiste',
      'de',
      'la',
      'Tour'
    ])
    expect(initialsOf('Jean-Baptiste de la Tour')).toBe('JB')
    expect(initialsOf('anna')).toBe('A')
    expect(nameWithin({ name: 'Marie-Charlotte Dupont', roomEm: 12 })).toBe(
      'Marie-Charlotte'
    )
    expect(nameWithin({ name: 'Marie-Charlotte Dupont', roomEm: 4 })).toBe('MC')
  })
})
