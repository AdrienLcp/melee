import type { AtlasSettings, GameSettings } from '@melee/protocol/game'
import type { QuestionCategory } from '@melee/protocol/question'
import type { RoomSettings } from '@melee/protocol/room'
import type { TrackSource } from '@melee/protocol/track'

import { useTranslate } from './i18n-provider'
import { LANGUAGE_NAMES } from './language-names'
import { petitBacCategoryName } from './petit-bac-category-name'
import { asGenreId, decadeLabelKey, genreLabelKey } from './track-labels'
import { gameNameKey, questionCategoryKey, type Translate } from './translation'

/**
 * Bound to the setting before it, so a line that wraps breaks after the dot
 * and never opens on one.
 */
const SETTINGS_SEPARATOR = '\u00a0· '

/** A list of picks named in full, one `, ` apart. */
const listed = (names: readonly string[]): string => names.join(', ')

/** What a list of picks says: each one, and what ticking none stands for. */
type Picks = {
  everything: string
  picks: string[]
}

/**
 * The pick an entry is named by: the one thing ticked, what ticking nothing
 * means, or `null` once several are — *Blind test · 70s*, but a blind test on
 * three decades is a blind test.
 */
const onePick = ({ everything, picks }: Picks): string | null => {
  if (picks.length === 0) {
    return everything
  }

  return picks.length === 1 ? (picks[0] ?? null) : null
}

/** Every pick, or what ticking none stands for. */
const allPicks = ({ everything, picks }: Picks): string =>
  picks.length === 0 ? everything : listed(picks)

const genresOf = ({
  genreIds,
  translate
}: {
  genreIds: readonly number[]
  translate: Translate
}): string[] =>
  genreIds.flatMap((value) => {
    const genreId = asGenreId(value)

    return genreId === undefined ? [] : [translate(genreLabelKey(genreId))]
  })

/** Where a blind test's tracks come from: one name, or a list of picks. */
const sourceOf = ({
  source,
  translate
}: {
  source: TrackSource
  translate: Translate
}): Picks | string => {
  switch (source.kind) {
    case 'all':
      return translate('blindtest.source.all')
    case 'chart':
      return {
        everything: translate('blindtest.source.chart'),
        picks: genresOf({ genreIds: source.genreIds, translate })
      }
    case 'decade':
      return {
        everything: translate('host.evening.detail.everyDecade'),
        picks: source.decades.map((decade) => translate(decadeLabelKey(decade)))
      }
    case 'film':
      return translate('blindtest.source.film')
    case 'playlist':
      return translate('host.evening.detail.playlist', {
        id: source.playlistId
      })
    case 'search':
      return translate('host.evening.detail.search', { query: source.query })
  }
}

const subjectsOf = ({
  categories,
  translate
}: {
  categories: readonly QuestionCategory[]
  translate: Translate
}): Picks => ({
  everything: translate('host.evening.detail.allSubjects'),
  picks: categories.map((category) => translate(questionCategoryKey(category)))
})

const atlasAsks = ({
  entry,
  translate
}: {
  entry: AtlasSettings
  translate: Translate
}): string =>
  translate(`atlas.asks.${entry.direction}`, {
    places: listed(
      entry.places.map((places) => translate(`atlas.asks.places.${places}`))
    )
  })

/**
 * What tells one entry of a game from another, most telling first: its one
 * pick, then its level. An entry with several picks says nothing and is the
 * game alone — numbered, when a sibling is too.
 */
const namingOf = ({
  entry,
  translate
}: {
  entry: GameSettings
  translate: Translate
}): string[] => {
  switch (entry.kind) {
    case 'blindtest': {
      if (entry.source.kind === 'film') {
        return [translate('blindtest.source.film')]
      }

      const source = sourceOf({ source: entry.source, translate })
      const pick = typeof source === 'string' ? source : onePick(source)

      return pick === null
        ? []
        : [pick, translate(`blindtest.difficulty.${entry.difficulty}`)]
    }
    case 'buzzer':
      return entry.locksOutOnMiss
        ? [translate('host.evening.detail.oneGo')]
        : []
    case 'matchsticks': {
      const [goal, ...others] = entry.goals

      return goal !== undefined && others.length === 0
        ? [translate(`matchsticks.goals.${goal}`)]
        : []
    }
    case 'quiz': {
      const pick = onePick(
        subjectsOf({ categories: entry.categories, translate })
      )

      if (pick === null) {
        return []
      }

      return entry.wellKnownOnly
        ? [pick, translate('quiz.variant.wellKnown')]
        : [pick]
    }
    case 'slate':
      return [translate('slate.items.summary', { count: entry.itemCount })]
    case 'atlas':
      return entry.places.length === 1 ? [atlasAsks({ entry, translate })] : []
    default:
      return []
  }
}

const secondsOf = ({
  ms,
  translate
}: {
  ms: number
  translate: Translate
}): string => translate('host.seconds', { seconds: ms / 1000 })

/**
 * Everything an entry is set to, every pick named and its round length last:
 * what its row in the running order says, so nobody opens a page to learn
 * which decades a blind test plays.
 */
const settingsOf = ({
  entry,
  translate
}: {
  entry: GameSettings
  translate: Translate
}): string[] => {
  switch (entry.kind) {
    case 'blindtest': {
      const source = sourceOf({ source: entry.source, translate })

      return [
        typeof source === 'string' ? source : allPicks(source),
        ...(entry.source.kind === 'film'
          ? []
          : [translate(`blindtest.difficulty.${entry.difficulty}`)]),
        secondsOf({ ms: entry.roundDurationMs, translate })
      ]
    }
    case 'buzzer':
      return [
        translate(
          entry.locksOutOnMiss
            ? 'host.evening.detail.oneGo'
            : 'host.evening.detail.openField'
        )
      ]
    case 'blacksquare':
      return [
        translate('blacksquare.answerCount.summary', {
          count: entry.answerCount
        }),
        ...(entry.doublesLoneFinds
          ? [translate('host.evening.detail.loneFinds')]
          : []),
        secondsOf({ ms: entry.roundDurationMs, translate })
      ]
    case 'matchsticks':
      return [
        listed(
          entry.goals.map((goal) => translate(`matchsticks.goals.${goal}`))
        ),
        secondsOf({ ms: entry.roundDurationMs, translate })
      ]
    case 'petitbac':
      return [
        entry.categories === null
          ? translate('host.evening.detail.drawnCategories', {
              count: entry.categoryCount
            })
          : listed(
              entry.categories.map((category) =>
                petitBacCategoryName({ category, translate })
              )
            ),
        ...(entry.excludedLetters.length > 0
          ? [
              translate('host.evening.detail.without', {
                letters: listed(entry.excludedLetters)
              })
            ]
          : []),
        ...(entry.stopsWhenFull ? [translate('petitbac.setup.stop')] : []),
        secondsOf({ ms: entry.roundDurationMs, translate })
      ]
    case 'quiz':
      return [
        allPicks(subjectsOf({ categories: entry.categories, translate })),
        ...(entry.wellKnownOnly ? [translate('quiz.variant.wellKnown')] : []),
        ...(entry.allowsAdultContent
          ? [translate('host.evening.detail.adult')]
          : []),
        LANGUAGE_NAMES[entry.language],
        secondsOf({ ms: entry.roundDurationMs, translate })
      ]
    case 'slate':
      return [translate('slate.items.summary', { count: entry.itemCount })]
    case 'atlas':
      return [
        atlasAsks({ entry, translate }),
        secondsOf({ ms: entry.roundDurationMs, translate })
      ]
    case 'swatch':
      return [
        translate('host.evening.detail.swatch', {
          rebuild: entry.roundDurationMs / 1000,
          shown: entry.showMs / 1000
        })
      ]
    case 'challenge':
    case 'innerclock':
    case 'reflex':
      return []
    case 'estimate':
    case 'higherlower':
    case 'mostlikely':
    case 'timeline':
      return [secondsOf({ ms: entry.roundDurationMs, translate })]
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
  const details = lineUp.map((entry) => namingOf({ entry, translate }))
  const said = (at: number, depth: number) =>
    (details[at] ?? []).slice(0, depth).join(' · ')

  const named = lineUp.map((entry, at) => {
    const game = translate(gameNameKey(entry.kind))
    const siblings = lineUp.flatMap((other, index) =>
      index !== at && other.kind === entry.kind ? [index] : []
    )

    if (siblings.length === 0) {
      return { isNumbered: false, name: game }
    }

    const depth = [1, 2].find(
      (deep) =>
        said(at, deep) !== '' &&
        siblings.every((index) => said(index, deep) !== said(at, deep))
    )

    if (depth !== undefined) {
      return { isNumbered: false, name: `${game} · ${said(at, depth)}` }
    }

    if (
      said(at, 1) === '' &&
      siblings.every((index) => said(index, 1) !== '')
    ) {
      return { isNumbered: false, name: game }
    }

    const detail = said(at, 1)

    return {
      isNumbered: true,
      name: detail === '' ? game : `${game} · ${detail}`
    }
  })

  return named.map(({ isNumbered, name }, at) =>
    isNumbered
      ? translate('round.entryNumbered', {
          name,
          number: named
            .slice(0, at + 1)
            .filter((other) => other.isNumbered && other.name === name).length
        })
      : name
  )
}

/** `lineUpEntryNames` in the reader's language. */
export const useLineUpEntryNames = (
  lineUp: readonly GameSettings[]
): string[] => lineUpEntryNames({ lineUp, translate: useTranslate() })

/** An entry as the setup lists it. */
export type LineUpEntrySummary = {
  /** What the line-up calls the entry: `lineUpEntryNames`, as the next-round card says it. */
  name: string
  /**
   * Every setting of the entry, round length last, in one line; `null` for a
   * game with nothing to set.
   */
  settings: string | null
}

/** Each entry of the line-up as the setup lists it, in its order. */
export const lineUpEntrySummaries = ({
  lineUp,
  translate
}: {
  lineUp: readonly GameSettings[]
  translate: Translate
}): LineUpEntrySummary[] => {
  const names = lineUpEntryNames({ lineUp, translate })

  return lineUp.map((entry, at) => {
    const settings = settingsOf({ entry, translate })

    return {
      name: names[at] ?? translate(gameNameKey(entry.kind)),
      settings: settings.length > 0 ? settings.join(SETTINGS_SEPARATOR) : null
    }
  })
}

/** `lineUpEntrySummaries` in the reader's language. */
export const useLineUpEntrySummaries = (
  lineUp: readonly GameSettings[]
): LineUpEntrySummary[] =>
  lineUpEntrySummaries({ lineUp, translate: useTranslate() })

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
