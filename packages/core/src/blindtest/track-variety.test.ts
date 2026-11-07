import { describe, expect, it } from 'vitest'

import {
  heardOnce,
  isUnheard,
  NOTHING_HEARD,
  type TrackHistory,
  variedPool,
  workOf
} from './track-variety'

const cue = (film: string, artist = 'Gustavo Santaolalla') => ({
  artist,
  film,
  title: 'Cue'
})

const song = (title: string, artist: string) => ({ artist, film: null, title })

describe('workOf', () => {
  it('[variety] reads two releases of one song as one work', () => {
    expect(workOf(song('Africa - Remastered 2011', 'Toto'))).toBe(
      workOf(song('Africa', 'Toto'))
    )
  })

  it('[variety] reads two cues of one film as one work', () => {
    expect(workOf({ ...cue('Interstellar'), title: 'Day One' })).toBe(
      workOf({ ...cue('Interstellar'), title: 'Cornfield Chase' })
    )
  })
})

describe('variedPool', () => {
  it('[variety] keeps one track a work and two an artist', () => {
    const pool = variedPool([
      cue('Babel'),
      cue('Babel'),
      cue('Brokeback Mountain'),
      cue('Motorcycle Diaries'),
      cue('Interstellar', 'Hans Zimmer')
    ])

    expect(pool.map(({ film }) => film)).toEqual([
      'Babel',
      'Brokeback Mountain',
      'Interstellar'
    ])
  })
})

describe('an evening', () => {
  it('[variety] opens no work twice and no artist a third time', () => {
    const catalogue = [
      cue('Babel'),
      cue('Babel'),
      cue('Brokeback Mountain'),
      cue('Motorcycle Diaries'),
      cue('Narcos'),
      cue('Interstellar', 'Hans Zimmer')
    ]

    let history: TrackHistory = NOTHING_HEARD
    const opened: string[] = []

    for (let round = 0; round < 30; round++) {
      const next = catalogue.find((track) => isUnheard({ history, track }))

      if (next === undefined) {
        break
      }

      opened.push(next.film)
      history = heardOnce({ history, track: next })
    }

    expect(opened).toEqual(['Babel', 'Brokeback Mountain', 'Interstellar'])
  })
})
