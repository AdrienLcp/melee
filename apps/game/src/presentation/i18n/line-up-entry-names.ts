import type { GameSettings } from '@melee/protocol/game'
import type { RoomSettings } from '@melee/protocol/room'

import { useTranslate } from './i18n-provider'
import { gameNameKey, questionCategoryKey, type Translate } from './translation'

/** A quiz names its subjects while the line can still hold them. */
const SUBJECTS_NAMED_AT_MOST = 3

/**
 * What tells one entry of a game from another, most telling first. A blind
 * test is its source before its level, a quiz its subjects before its
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
    case 'blindtest': {
      const { source } = entry

      if (source.kind === 'film') {
        return [translate('blindtest.source.film')]
      }

      const from =
        source.kind === 'decade' && source.decades.length > 0
          ? source.decades
              .map((decade) => translate(`blindtest.decade.${decade}`))
              .join(', ')
          : translate(`blindtest.source.${source.kind}`)

      return [from, translate(`blindtest.difficulty.${entry.difficulty}`)]
    }
    case 'buzzer':
      return entry.locksOutOnMiss
        ? [translate('host.evening.detail.oneGo')]
        : []
    case 'matchsticks':
      return [
        entry.goals
          .map((goal) => translate(`matchsticks.goals.${goal}`))
          .join(', ')
      ]
    case 'quiz': {
      const { categories } = entry
      const subjects =
        categories.length === 0
          ? translate('host.evening.detail.allSubjects')
          : categories.length <= SUBJECTS_NAMED_AT_MOST
            ? categories
                .map((category) => translate(questionCategoryKey(category)))
                .join(', ')
            : translate('host.evening.detail.subjects', {
                count: categories.length
              })

      return entry.wellKnownOnly
        ? [subjects, translate('quiz.variant.wellKnown')]
        : [subjects]
    }
    case 'slate':
      return [translate('slate.items.summary', { count: entry.itemCount })]
    case 'atlas':
      return [
        translate(`atlas.asks.${entry.direction}`, {
          places: entry.places
            .map((places) => translate(`atlas.asks.places.${places}`))
            .join(', ')
        })
      ]
    default:
      return []
  }
}

/** What an entry is set to that never tells it apart: how long a round runs. */
const timingOf = ({
  entry,
  translate
}: {
  entry: GameSettings
  translate: Translate
}): string[] =>
  'roundDurationMs' in entry
    ? [translate('host.seconds', { seconds: entry.roundDurationMs / 1000 })]
    : []

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

/** An entry as the setup lists it. */
export type LineUpEntrySummary = {
  /**
   * The game's name, numbered among its own entries once it has several —
   * *Atlas 2* — because the line under it already says what tells them apart.
   */
  name: string
  /**
   * Every setting of the entry, round length last, in one line; `null` for a
   * game with nothing to set.
   */
  settings: string | null
}

/** Each entry of the line-up as the setup lists it, in its order. */
export const useLineUpEntrySummaries = (
  lineUp: readonly GameSettings[]
): LineUpEntrySummary[] => {
  const translate = useTranslate()

  return lineUp.map((entry, at) => {
    const game = translate(gameNameKey(entry.kind))
    const sameGame = lineUp.filter((other) => other.kind === entry.kind)
    const settings = [
      ...detailsOf({ entry, translate }),
      ...timingOf({ entry, translate })
    ]

    return {
      name:
        sameGame.length > 1
          ? translate('round.entryNumbered', {
              name: game,
              number: lineUp
                .slice(0, at + 1)
                .filter((other) => other.kind === entry.kind).length
            })
          : game,
      settings: settings.length > 0 ? settings.join(' · ') : null
    }
  })
}

type EntrySettings = Pick<
  RoomSettings,
  'game' | 'lineUp' | 'lineUpAt' | 'runningOrder'
>

/**
 * The entry the room's next round plays, by the name the line-up gives it —
 * a variant says which — and `null` while there is no game.
 */
export const useEntryName = (settings: EntrySettings): string | null => {
  const translate = useTranslate()
  const entryNames = useLineUpEntryNames(settings.lineUp)

  if (settings.game === null) {
    return null
  }

  return (
    (settings.lineUpAt === null ? undefined : entryNames[settings.lineUpAt]) ??
    translate(gameNameKey(settings.game.kind))
  )
}
