import { describe, expect, it } from 'vitest'

import { constraintsOf, meetsConstraints } from './decoy-constraints'
import { poolsFor } from './mintaka-source'

/**
 * The rule that keeps a generated decoy of the kind the prompt asks for. Like
 * the era rule in `polyfact-source.test.ts`, it leaves no evidence in the
 * built bank — no citizenship or office is banked — so it is asked here.
 */

const MALE = 'P21:Q6581097'
const FEMALE = 'P21:Q6581072'
const AMERICAN = 'P27:Q30'
const PRESIDENT_OF_THE_US = 'P39:Q11696'
const SENATOR = 'P39:Q4416090'

const OFFICE_LABELS = new Map([
  ['Q11696', 'président des États-Unis'],
  ['Q4416090', 'sénateur des États-Unis']
])

const PEOPLE = {
  Catherine: { facts: [FEMALE, 'P27:Q34266', 'P39:Q12370489'] },
  Clinton: { facts: [FEMALE, AMERICAN, SENATOR] },
  Gore: { facts: [MALE, AMERICAN, SENATOR] },
  Jefferson: { facts: [MALE, AMERICAN, PRESIDENT_OF_THE_US] },
  Lenin: { facts: [MALE, 'P27:Q15180'] },
  Lincoln: { facts: [MALE, AMERICAN, PRESIDENT_OF_THE_US] },
  Marx: { facts: [MALE, 'P27:Q183'] },
  Obama: { facts: [MALE, AMERICAN, PRESIDENT_OF_THE_US, SENATOR] },
  Washington: { facts: [MALE, AMERICAN, PRESIDENT_OF_THE_US] }
} as const

const POLITICIAN = 'occupation:Q82955'

const pools = new Map([
  [
    POLITICIAN,
    Object.keys(PEOPLE).map((name, index) => ({
      entityId: name,
      label: name,
      views: 10_000 + index
    }))
  ]
])
const kinds = new Map(Object.keys(PEOPLE).map((name) => [name, [POLITICIAN]]))
const claims = new Map(
  Object.entries(PEOPLE).map(([name, { facts }]) => [name, [...facts]])
)

describe('decoy constraints', () => {
  it('[mintaka] narrows the tallest-president question to American presidents', () => {
    const constraints = constraintsOf({
      answerFacts: PEOPLE.Lincoln.facts,
      officeLabels: OFFICE_LABELS,
      prompt:
        'Quel président des États-Unis était le plus grand par la taille ?',
      questionEntities: ['Q30']
    })

    const [narrowed] = poolsFor({
      answerId: 'Lincoln',
      category: 'history',
      claims,
      constraints,
      kinds,
      pools
    })

    expect(narrowed?.entries.map(({ label }) => label).toSorted()).toEqual([
      'Jefferson',
      'Lincoln',
      'Obama',
      'Washington'
    ])
  })

  it('[mintaka] reads the office from a word it starts, not only from the word itself', () => {
    expect(
      constraintsOf({
        answerFacts: PEOPLE.Obama.facts,
        officeLabels: OFFICE_LABELS,
        prompt: "Qui a remporté l'élection présidentielle de 2008 ?",
        questionEntities: []
      })
    ).toEqual([[MALE], [PRESIDENT_OF_THE_US]])
  })

  it('[mintaka] asks a person for the same sex even when the prompt names nothing', () => {
    const constraints = constraintsOf({
      answerFacts: PEOPLE.Clinton.facts,
      officeLabels: OFFICE_LABELS,
      prompt: 'Qui a été candidate en 2016 ?',
      questionEntities: []
    })

    expect(
      meetsConstraints({ constraints, facts: PEOPLE.Catherine.facts })
    ).toBe(true)
    expect(meetsConstraints({ constraints, facts: PEOPLE.Gore.facts })).toBe(
      false
    )
  })

  it('[mintaka] lets a decoy share either of two teams the question names', () => {
    const constraints = constraintsOf({
      answerFacts: [MALE, 'P54:Q121783', 'P54:Q162990'],
      officeLabels: OFFICE_LABELS,
      prompt: 'Qui a joué pour les Cavs avant de rejoindre les Lakers ?',
      questionEntities: ['Q121783', 'Q162990']
    })

    expect(
      meetsConstraints({ constraints, facts: [MALE, 'P54:Q121783'] })
    ).toBe(true)
    expect(
      meetsConstraints({ constraints, facts: [MALE, 'P54:Q131364'] })
    ).toBe(false)
  })

  it('[mintaka] refuses the row when fewer than three others meet the constraints', () => {
    const constraints = constraintsOf({
      answerFacts: PEOPLE.Clinton.facts,
      officeLabels: OFFICE_LABELS,
      prompt: 'Quelle sénatrice des États-Unis a été secrétaire d’État ?',
      questionEntities: ['Q30']
    })

    expect(
      poolsFor({
        answerId: 'Clinton',
        category: 'history',
        claims,
        constraints,
        kinds,
        pools
      })
    ).toEqual([])
  })
})
