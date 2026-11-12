import type { EstimateDeckItem } from '@melee/protocol/deck'

import { normalizeAnswer } from '../round/answer-matching'
import { SPOT_ON_RATIO, ZERO_PAY_RATIO } from './estimate-pay'

const DIACRITICS = /\p{Diacritic}/gu
const NOT_A_UNIT_CHARACTER = /[^\p{L}\p{N}%]+/gu

/**
 * Units of a figure that sits near a value everyone knows — a year, an age,
 * a share of a hundred, a place in a ranking — where a ratio to the truth
 * pays nearly everyone: 1990 for 1995 is inside `SPOT_ON_RATIO`, and an age
 * of 29 still scores against 87. Read on the unit's first word, so _litres
 * par an_ stays a quantity.
 */
const FIGURES_NEAR_A_KNOWN_VALUE = [
  '%',
  'âge',
  'âges',
  'an',
  'année',
  'années',
  'ans',
  'centuries',
  'century',
  'classement',
  'pct',
  'percent',
  'percentage',
  'pourcent',
  'pourcentage',
  'place',
  'position',
  'rang',
  'rank',
  'ranking',
  'siècle',
  'siècles',
  'year',
  'years',
  'yr',
  'yrs'
]

const PERCENT_SPELLINGS = ['pourcent', 'percent']

const foldedUnit = (text: string): string =>
  text.normalize('NFD').replace(DIACRITICS, '').toLowerCase()

const FOLDED_FIGURES_NEAR_A_KNOWN_VALUE = new Set(
  FIGURES_NEAR_A_KNOWN_VALUE.map(foldedUnit)
)

const unitWordsOf = (unit: string): string[] =>
  foldedUnit(unit)
    .replaceAll('%', ' % ')
    .split(NOT_A_UNIT_CHARACTER)
    .filter(Boolean)

/** Whether a unit counts a figure a ratio cannot pay fairly: a year, an age, a percentage or a rank. */
export const isUnitNearAKnownValue = (unit: string): boolean => {
  const words = unitWordsOf(unit)
  const first = words[0] ?? ''

  return (
    FOLDED_FIGURES_NEAR_A_KNOWN_VALUE.has(first) ||
    PERCENT_SPELLINGS.some((spelling) => words.join('').startsWith(spelling))
  )
}

/** The span a whole number with no unit reads as a calendar year in. */
const YEAR_LIKE = { first: 1000, last: 2100 }

const readsAsAYear = ({ unit, value }: EstimateDeckItem): boolean =>
  unit === null &&
  Number.isInteger(value) &&
  value >= YEAR_LIKE.first &&
  value <= YEAR_LIKE.last

const WHY_A_RATIO = `an estimate pays by its ratio to the truth — spot on within ×${SPOT_ON_RATIO}, nothing past ×${ZERO_PAY_RATIO} — so ask a count, a length, a weight, a duration or a sum of money instead`

/**
 * Everything wrong with an estimate deck, each problem led by its path: a unit
 * naming a year, an age, a percentage or a rank, a bare whole number that
 * reads as a year, and a question asked twice. Empty when the deck holds.
 */
export const estimateDeckProblems = ({
  items,
  path
}: {
  items: readonly EstimateDeckItem[]
  path: string
}): string[] => {
  const prompts = items.map(({ prompt }) => normalizeAnswer(prompt))

  return items.flatMap((item, index) => {
    const at = `${path}.items[${index}]`

    return [
      ...(item.unit !== null && isUnitNearAKnownValue(item.unit)
        ? [
            `${at}.unit: “${item.unit}” counts a figure near a value everyone knows — ${WHY_A_RATIO}.`
          ]
        : []),
      ...(readsAsAYear(item)
        ? [
            `${at}.value: ${item.value} with no unit reads as a year — ${WHY_A_RATIO}; if it is a count, give it its unit.`
          ]
        : []),
      ...(prompts.indexOf(prompts[index] ?? '') < index
        ? [`${at}.prompt: “${item.prompt}” is asked again.`]
        : [])
    ]
  })
}
