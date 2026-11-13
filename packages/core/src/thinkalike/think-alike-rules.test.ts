import { describe, expect, it } from 'vitest'

import { playerIdSchema } from '@melee/protocol/identifiers'
import { MOST_A_ROUND_PAYS } from '@melee/protocol/scoring'

import { crowdGroups, crowdKey } from './crowd-key'
import { isWholeTable, matchesOf, pointsForMatch } from './crowd-pay'

const ana = playerIdSchema.parse('ana')
const ben = playerIdSchema.parse('ben')
const carl = playerIdSchema.parse('carl')
const dan = playerIdSchema.parse('dan')
const eve = playerIdSchema.parse('eve')

describe('the crowd key', () => {
  it('[thinkalike] folds case, accents, a leading article and a plural into one crowd', () => {
    expect(crowdKey('Fraises')).toBe(crowdKey('une fraise'))
    expect(crowdKey('les choux')).toBe(crowdKey('Chou'))
    expect(crowdKey('Pommes de terre')).toBe(crowdKey('pomme de terre'))
    expect(crowdKey('fraises !')).toBe(crowdKey('fraise'))
  })

  it('[thinkalike] leaves a word of three letters its final s', () => {
    expect(crowdKey('jus')).not.toBe(crowdKey('ju'))
    expect(crowdKey('bus')).toBe('bus')
  })

  it('[thinkalike] folds nothing closer than a plural', () => {
    expect(crowdKey('frigo')).not.toBe(crowdKey('réfrigérateur'))
    expect(crowdKey('cerise')).not.toBe(crowdKey('cerises noires'))
  })
})

describe('the crowd groups', () => {
  const answers = [
    { playerId: ana, text: 'Fraise' },
    { playerId: ben, text: 'fraises' },
    { playerId: carl, text: 'cerise' },
    { playerId: dan, text: 'Framboise' },
    { playerId: eve, text: '  ' }
  ]

  it('[thinkalike] turns the smallest over first and leaves a blank out', () => {
    expect(crowdGroups({ answers, merges: [] })).toEqual([
      { authors: [carl], key: 'cerise', mergedKeys: [], text: 'cerise' },
      { authors: [dan], key: 'framboise', mergedKeys: [], text: 'Framboise' },
      { authors: [ana, ben], key: 'fraise', mergedKeys: [], text: 'Fraise' }
    ])
  })

  it('[thinkalike] puts a merged group into its target, spelled as the target', () => {
    const groups = crowdGroups({
      answers,
      merges: [{ from: 'framboise', into: 'cerise' }]
    })

    expect(groups).toEqual([
      {
        authors: [carl, dan],
        key: 'cerise',
        mergedKeys: ['framboise'],
        text: 'cerise'
      },
      { authors: [ana, ben], key: 'fraise', mergedKeys: [], text: 'Fraise' }
    ])
  })

  it('[thinkalike] follows a chain of merges and ignores one leading back', () => {
    const chained = crowdGroups({
      answers,
      merges: [
        { from: 'framboise', into: 'cerise' },
        { from: 'cerise', into: 'fraise' }
      ]
    })

    expect(chained).toEqual([
      {
        authors: [ana, ben, carl, dan],
        key: 'fraise',
        mergedKeys: ['cerise', 'framboise'],
        text: 'Fraise'
      }
    ])

    const looped = crowdGroups({
      answers,
      merges: [
        { from: 'cerise', into: 'framboise' },
        { from: 'framboise', into: 'cerise' }
      ]
    })

    expect(looped.map(({ authors }) => authors.length)).toEqual([2, 2])
  })

  it('[thinkalike] ignores a merge naming a group nobody wrote', () => {
    expect(
      crowdGroups({ answers, merges: [{ from: 'kiwi', into: 'fraise' }] })
    ).toEqual(crowdGroups({ answers, merges: [] }))
  })
})

describe('the crowd pay', () => {
  it('[thinkalike] pays the share of the other seats that wrote the same', () => {
    expect(pointsForMatch({ matched: 4, others: 4 })).toBe(MOST_A_ROUND_PAYS)
    expect(pointsForMatch({ matched: 2, others: 4 })).toBe(
      MOST_A_ROUND_PAYS / 2
    )
    expect(pointsForMatch({ matched: 0, others: 4 })).toBe(0)
    expect(pointsForMatch({ matched: 0, others: 0 })).toBe(0)
  })

  it('[thinkalike] calls only the whole table one answer', () => {
    expect(isWholeTable({ matched: 3, others: 3 })).toBe(true)
    expect(isWholeTable({ matched: 2, others: 3 })).toBe(false)
    expect(isWholeTable({ matched: 0, others: 0 })).toBe(false)
  })

  it('[thinkalike] matches every seat of the round, a blank and a seat gone counted among the others', () => {
    const groups = crowdGroups({
      answers: [
        { playerId: ana, text: 'fraise' },
        { playerId: ben, text: 'fraise' },
        { playerId: carl, text: 'cerise' },
        { playerId: eve, text: 'fraise' }
      ],
      merges: []
    })

    expect(
      matchesOf({ groups, roster: new Set([ana, ben, carl, dan]) })
    ).toEqual(
      new Map([
        [ana, { matched: 1, others: 3 }],
        [ben, { matched: 1, others: 3 }],
        [carl, { matched: 0, others: 3 }],
        [dan, { matched: 0, others: 3 }]
      ])
    )
  })
})
