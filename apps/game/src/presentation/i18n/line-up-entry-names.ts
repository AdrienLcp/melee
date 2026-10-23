import type { GameSettings } from '@melee/protocol/game'

import { useTranslate } from './i18n-provider'
import {
  gameNameKey,
  gameTaglineKey,
  questionCategoryKey,
  type Translate
} from './translation'

/**
 * What tells one entry of a game from another, most telling first. A blind
 * test is its source before its level, a quiz its one subject before its
 * crowd-pleasers, a map its places; a game with nothing of its own says
 * nothing, and the number does the telling.
 */
const detailsOf = ({
  entry,
  translate
}: {
  entry: GameSettings
  translate: Translate
}): string[] => {
  switch (entry.kind) {
    case 'blindtest':
      return entry.source.kind === 'film'
        ? [translate('blindtest.source.film')]
        : [
            translate(`blindtest.source.${entry.source.kind}`),
            translate(`blindtest.difficulty.${entry.difficulty}`)
          ]
    case 'quiz': {
      const [only] = entry.categories
      const subject =
        entry.categories.length === 1 && only !== undefined
          ? [translate(questionCategoryKey(only))]
          : []

      return entry.wellKnownOnly
        ? [...subject, translate('quiz.variant.wellKnown')]
        : subject
    }
    case 'worldmap':
      return [translate(`worldmap.places.${entry.places}`)]
    default:
      return []
  }
}

/**
 * What each entry of the line-up is called, in its order: the game's name
 * alone while it is ticked once, and with as much of its settings as it takes
 * to tell it from the game's other entries once it is not — *Blind test ·
 * Film scores* beside *Blind test · Charts*. Two entries nothing tells apart
 * are numbered.
 */
export const lineUpEntryNames = ({
  lineUp,
  translate
}: {
  lineUp: readonly GameSettings[]
  translate: Translate
}): string[] => {
  const details = lineUp.map((entry) => detailsOf({ entry, translate }))
  const said = (at: number, depth: number) =>
    (details[at] ?? []).slice(0, depth).join(' · ')

  return lineUp.map((entry, at) => {
    const game = translate(gameNameKey(entry.kind))
    const siblings = lineUp.flatMap((other, index) =>
      index !== at && other.kind === entry.kind ? [index] : []
    )

    if (siblings.length === 0) {
      return game
    }

    const depth = [1, 2].find(
      (deep) =>
        said(at, deep) !== '' &&
        siblings.every((index) => said(index, deep) !== said(at, deep))
    )

    if (depth !== undefined) {
      return `${game} · ${said(at, depth)}`
    }

    const ordinal = lineUp
      .slice(0, at + 1)
      .filter((other) => other.kind === entry.kind).length
    const detail = said(at, 1)

    return translate('round.entryNumbered', {
      name: detail === '' ? game : `${game} · ${detail}`,
      number: ordinal
    })
  })
}

/** `lineUpEntryNames` in the reader's language. */
export const useLineUpEntryNames = (
  lineUp: readonly GameSettings[]
): string[] => lineUpEntryNames({ lineUp, translate: useTranslate() })

/**
 * One line saying what an entry is set to, under its game's name in the list
 * of rounds: the settings that tell it apart, the size of a slate's sheet, or
 * the game's own tagline when it has nothing of its own to say.
 */
export const useLineUpEntryDetail = (): ((entry: GameSettings) => string) => {
  const translate = useTranslate()

  return (entry) => {
    if (entry.kind === 'slate') {
      return translate('slate.items.summary', { count: entry.itemCount })
    }

    const details = detailsOf({ entry, translate })

    return details.length > 0
      ? details.join(' · ')
      : translate(gameTaglineKey(entry.kind))
  }
}
