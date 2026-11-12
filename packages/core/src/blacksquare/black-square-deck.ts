import type { BlackSquareDeckItem } from '@melee/protocol/deck'

import { normalizeAnswer } from '../round/answer-matching'
import {
  blackWordCollisionsOf,
  blackWordSlipsOf,
  firstWordOf,
  MIN_ANSWERS_PER_TIER,
  type MisgradedName,
  misgradedNamesOf,
  type NameOwner,
  repeatedFirstWordsOf,
  thinTiersOf
} from './theme-checks'

const namesOf = ({
  aliases,
  label
}: {
  aliases: readonly string[]
  label: string
}): string[] => [label, ...aliases]

const namePath = ({
  at,
  nameIndex,
  owner
}: {
  at: string
  nameIndex: number
  owner: NameOwner
}): string => {
  const holder =
    owner.kind === 'answer'
      ? `${at}.answers[${owner.index}]`
      : `${at}.blackWord`

  return nameIndex === 0
    ? `${holder}.label`
    : `${holder}.aliases[${nameIndex - 1}]`
}

const misgradedNameProblem = ({
  at,
  item,
  misgraded
}: {
  at: string
  item: BlackSquareDeckItem
  misgraded: MisgradedName
}): string => {
  const { dealt, expected, graded, line, nameIndex, owner } = misgraded
  const where = namePath({ at, nameIndex, owner })
  const dealtLabel = item.answers[dealt]?.label ?? ''

  if (expected === 'cells') {
    return `${where}: “${line}” does not find its own answer — another name on the board stands too close to it.`
  }

  if (graded === 'cells') {
    return `${where}: “${line}” is taken for answers[${dealt}] (“${dealtLabel}”) — no two names on the board may be one spelling or a slip apart.`
  }

  return graded === 'blackWord'
    ? `${where}: “${line}” is taken for the black word — an answer may not be spelled like it, nor a slip from it.`
    : `${where}: “${line}” does not find the black word — another name on the board stands too close to it.`
}

/**
 * The first word two answers share on purpose: the theme's own word, as
 * _Fruit de la passion_ beside _Fruit du dragon_ under _Fruits_.
 */
const isThemeWord = ({ label, word }: { label: string; word: string }) =>
  normalizeAnswer(label).includes(normalizeAnswer(word))

const themeProblems = ({
  at,
  item
}: {
  at: string
  item: BlackSquareDeckItem
}): string[] => {
  const labels = item.answers.map(({ label }) => label)
  const firstWords = labels.map(firstWordOf)
  const varieties = repeatedFirstWordsOf(labels)
    .filter((word) => !isThemeWord({ label: item.label, word }))
    .map((word) => {
      const holders = firstWords.flatMap((each, index) =>
        each === word ? [index] : []
      )
      const named = holders.map((index) => `“${labels[index]}”`).join(', ')

      return `${at}.answers[${holders.at(-1) ?? 0}].label: ${named} open alike — one answer per thing, never its varieties side by side: keep one, the others its aliases.`
    })
  const thin = thinTiersOf(item.answers).map(
    ({ count, tier }) =>
      `${at}.answers: ${count} ${tier} answer${count === 1 ? '' : 's'} — every tier needs at least ${MIN_ANSWERS_PER_TIER}.`
  )
  const names = {
    answers: item.answers.map(namesOf),
    blackWord: namesOf(item.blackWord)
  }
  const collisions = blackWordCollisionsOf(names).map(({ answer, guess }) =>
    misgradedNameProblem({
      at,
      item,
      misgraded: {
        dealt: answer,
        expected: 'blackWord',
        graded: 'cells',
        line: guess,
        nameIndex: names.blackWord.indexOf(guess),
        owner: { kind: 'blackWord' }
      }
    })
  )
  const slips = blackWordSlipsOf(names).map(
    ({ answer, guess }) =>
      `${namePath({ at, nameIndex: names.blackWord.indexOf(guess), owner: { kind: 'blackWord' } })}: “${guess}” is a slip from answers[${answer}] (“${item.answers[answer]?.label ?? ''}”) — whoever types that answer a letter off loses the round to a spelling.`
  )
  const misread = misgradedNamesOf(names).map((misgraded) =>
    misgradedNameProblem({ at, item, misgraded })
  )

  return [
    ...thin,
    ...varieties,
    ...new Set([...collisions, ...slips, ...misread])
  ]
}

/**
 * Everything wrong with a black square deck, each problem led by its path:
 * a tier holding fewer than three answers, two answers that are varieties of
 * one thing, a black word a slip from an answer — stricter than the bank,
 * whose few such traps were each read and kept — and any name a round would
 * grade otherwise than written, as two answers sharing a name. Empty when the
 * deck holds.
 */
export const blackSquareDeckProblems = ({
  items,
  path
}: {
  items: readonly BlackSquareDeckItem[]
  path: string
}): string[] =>
  items.flatMap((item, index) =>
    themeProblems({ at: `${path}.items[${index}]`, item })
  )
