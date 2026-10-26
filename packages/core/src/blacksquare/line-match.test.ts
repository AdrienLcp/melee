import { describe, expect, it } from 'vitest'

import { gradeLine } from './line-match'

const ANSWERS = [
  ['Pulp Fiction'],
  ['Django Unchained', 'Django'],
  ['Kill Bill: Volume 1', 'Kill Bill'],
  ['Kill Bill: Volume 2', 'Kill Bill'],
  ['Reservoir Dogs'],
  ['Jackie Brown'],
  ['Once Upon a Time in Hollywood'],
  ['Death Proof', 'Boulevard de la mort'],
  ['The Hateful Eight']
]

const BLACK_WORD = ['True Romance']

const graded = (line: string) =>
  gradeLine({ answers: ANSWERS, blackWord: BLACK_WORD, line })

describe('a black-square line', () => {
  it('[blacksquare] finds the cell it names, in either language', () => {
    expect(graded('pulp fiction')).toEqual({ cells: [0], kind: 'cells' })
    expect(graded('Boulevard de la mort')).toEqual({
      cells: [7],
      kind: 'cells'
    })
  })

  it('[blacksquare] forgives a slipped finger', () => {
    expect(graded('Pulp Fictions')).toEqual({ cells: [0], kind: 'cells' })
  })

  it('[blacksquare] never forgives one answer into its neighbour', () => {
    expect(graded('Kill Bill Volume 3')).toEqual({ kind: 'nothing' })
  })

  it('[blacksquare] finds every cell a shared name names', () => {
    expect(graded('kill bill')).toEqual({ cells: [2, 3], kind: 'cells' })
  })

  it('[blacksquare] lands on the black word', () => {
    expect(graded('true romance')).toEqual({ kind: 'blackWord' })
  })

  it('[blacksquare] matches a line whole, never searching inside it', () => {
    expect(graded('pulp fiction ou django')).toEqual({ kind: 'nothing' })
  })

  it('[blacksquare] says nothing of a line that names nothing', () => {
    expect(graded('Four Rooms')).toEqual({ kind: 'nothing' })
  })
})
