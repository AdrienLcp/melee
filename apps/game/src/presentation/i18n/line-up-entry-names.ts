import type { AtlasSettings, GameSettings } from '@melee/protocol/game'
import type { QuestionCategory } from '@melee/protocol/question'
import type { RoomSettings, RoundView } from '@melee/protocol/room'
import type { CatalogueSource, TrackSource } from '@melee/protocol/track'

import { trackAnswersOf } from '@melee/core/blindtest/track-answers'

import { useTranslate } from './i18n-provider'
import { LANGUAGE_NAMES } from './language-names'
import { petitBacCategoryName } from './petit-bac-category-name'
import {
  asGenreId,
  type CatalogueStrand,
  decadeLabelKey,
  genreLabelKey,
  strandsOf
} from './track-labels'
import { gameNameKey, questionCategoryKey, type Translate } from './translation'

/**
 * Bound to the setting before it, so a line that wraps breaks after the dot
 * and never opens on one.
 */
const SETTINGS_SEPARATOR = '\u00a0· '

/** Between two strands of a catalogue, whose picks are already `, ` apart. */
const STRAND_SEPARATOR = ' + '

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

/** What one strand of the catalogue draws: a list of picks, or the film scores. */
const strandPicksOf = ({
  source,
  strand,
  translate
}: {
  source: CatalogueSource
  strand: CatalogueStrand
  translate: Translate
}): Picks | string => {
  switch (strand) {
    case 'charts':
      return {
        everything: translate('blindtest.source.chart'),
        picks: genresOf({ genreIds: source.charts ?? [], translate })
      }
    case 'decades':
      return {
        everything: translate('host.evening.detail.everyDecade'),
        picks: (source.decades ?? []).map((decade) =>
          translate(decadeLabelKey(decade))
        )
      }
    case 'filmScores':
      return translate('blindtest.source.film')
  }
}

/** A list the host named, by what names it. */
const namedListOf = ({
  source,
  translate
}: {
  source: Exclude<TrackSource, { kind: 'catalogue' }>
  translate: Translate
}): string =>
  source.kind === 'playlist'
    ? translate('host.evening.detail.playlist', { id: source.playlistId })
    : translate('host.evening.detail.search', { query: source.query })

/**
 * The one thing a blind test is drawn from, or `null` once a catalogue mixes
 * strands: *Blind test · 80s*, but a blind test on the charts and the film
 * scores is a blind test.
 */
const sourcePickOf = ({
  source,
  translate
}: {
  source: TrackSource
  translate: Translate
}): string | null => {
  if (source.kind !== 'catalogue') {
    return namedListOf({ source, translate })
  }

  const [strand, ...others] = strandsOf(source)

  if (strand === undefined || others.length > 0) {
    return null
  }

  const picks = strandPicksOf({ source, strand, translate })

  return typeof picks === 'string' ? picks : onePick(picks)
}

/** Everything a blind test is drawn from, strand by strand. */
const sourceInFullOf = ({
  source,
  translate
}: {
  source: TrackSource
  translate: Translate
}): string =>
  source.kind === 'catalogue'
    ? strandsOf(source)
        .map((strand) => {
          const picks = strandPicksOf({ source, strand, translate })

          return typeof picks === 'string' ? picks : allPicks(picks)
        })
        .join(STRAND_SEPARATOR)
    : namedListOf({ source, translate })

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
      const pick = sourcePickOf({ source: entry.source, translate })

      if (pick === null) {
        return []
      }

      return trackAnswersOf(entry.source) === 'films'
        ? [pick]
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
    case 'blindtest':
      return [
        sourceInFullOf({ source: entry.source, translate }),
        ...(trackAnswersOf(entry.source) === 'films'
          ? []
          : [translate(`blindtest.difficulty.${entry.difficulty}`)]),
        secondsOf({ ms: entry.roundDurationMs, translate })
      ]
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

type EntryNaming = {
  name: string
  /** The settings `name` carries after the game's, which the row's detail leaves out. */
  settingsSaid: string[]
}

type LineUp = {
  lineUp: readonly GameSettings[]
  translate: Translate
}

const entryNamings = ({ lineUp, translate }: LineUp): EntryNaming[] => {
  const details = lineUp.map((entry) => namingOf({ entry, translate }))
  const told = (at: number, depth: number): string[] =>
    (details[at] ?? []).slice(0, depth)
  const said = (at: number, depth: number): string =>
    told(at, depth).join(' · ')

  const named = lineUp.map((entry, at) => {
    const game = translate(gameNameKey(entry.kind))
    const gameAlone = { isNumbered: false, name: game, settingsSaid: [] }
    const siblings = lineUp.flatMap((other, index) =>
      index !== at && other.kind === entry.kind ? [index] : []
    )

    if (siblings.length === 0) {
      return gameAlone
    }

    const depth = [1, 2].find(
      (deep) =>
        said(at, deep) !== '' &&
        siblings.every((index) => said(index, deep) !== said(at, deep))
    )

    if (depth !== undefined) {
      return {
        isNumbered: false,
        name: `${game} · ${said(at, depth)}`,
        settingsSaid: told(at, depth)
      }
    }

    if (
      said(at, 1) === '' &&
      siblings.every((index) => said(index, 1) !== '')
    ) {
      return gameAlone
    }

    const detail = said(at, 1)

    return {
      isNumbered: true,
      name: detail === '' ? game : `${game} · ${detail}`,
      settingsSaid: told(at, 1)
    }
  })

  return named.map(({ isNumbered, name, settingsSaid }, at) => ({
    name: isNumbered
      ? translate('round.entryNumbered', {
          name,
          number: named
            .slice(0, at + 1)
            .filter((other) => other.isNumbered && other.name === name).length
        })
      : name,
    settingsSaid
  }))
}

/**
 * What each entry of the line-up is called, in its order: the game's name
 * alone while it is ticked once, and with as much of its settings as it takes
 * to tell it from the game's other entries once it is not — *Blind test ·
 * Film scores* beside *Blind test · Charts*. Two entries nothing tells apart
 * are numbered.
 */
export const lineUpEntryNames = (lineUp: LineUp): string[] =>
  entryNamings(lineUp).map(({ name }) => name)

/** `lineUpEntryNames` in the reader's language. */
export const useLineUpEntryNames = (
  lineUp: readonly GameSettings[]
): string[] => lineUpEntryNames({ lineUp, translate: useTranslate() })

/** An entry as the setup lists it. */
export type LineUpEntrySummary = {
  /** What the line-up calls the entry: `lineUpEntryNames`, the game alone while it is ticked once. */
  name: string
  /**
   * Every setting of the entry its name does not already say, round length
   * last, in one line; `null` when nothing is left to say.
   */
  settings: string | null
}

/** Each entry of the line-up as the setup lists it, in its order. */
export const lineUpEntrySummaries = ({
  lineUp,
  translate
}: LineUp): LineUpEntrySummary[] => {
  const namings = entryNamings({ lineUp, translate })

  return lineUp.map((entry, at) => {
    const settingsSaid = namings[at]?.settingsSaid ?? []
    const settings = settingsOf({ entry, translate }).filter(
      (setting) => !settingsSaid.includes(setting)
    )

    return {
      name: namings[at]?.name ?? translate(gameNameKey(entry.kind)),
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

const tellingNameAt = ({
  at,
  lineUp,
  translate
}: LineUp & { at: number }): string | null => {
  const entry = lineUp[at]

  if (entry === undefined) {
    return null
  }

  const game = translate(gameNameKey(entry.kind))
  const name = lineUpEntryNames({ lineUp, translate })[at] ?? game
  const [detail] = namingOf({ entry, translate })

  return name === game && detail !== undefined ? `${game} · ${detail}` : name
}

type NextRoundSettings = Pick<RoomSettings, 'lineUp' | 'lineUpAt'>

/**
 * The entry the next round plays, as the reveal announces it: its line-up
 * name, and its most telling setting even where no sibling asks for one —
 * *Blind test · 70s* where the running order says *Blind test* — so the host
 * reads what the press opens. `null` while the line-up points at nothing.
 */
export const nextRoundName = ({
  settings,
  translate
}: {
  settings: NextRoundSettings
  translate: Translate
}): string | null =>
  settings.lineUpAt === null
    ? null
    : tellingNameAt({
        at: settings.lineUpAt,
        lineUp: settings.lineUp,
        translate
      })

/** `nextRoundName` in the reader's language. */
export const useNextRoundName = (settings: NextRoundSettings): string | null =>
  nextRoundName({ settings, translate: useTranslate() })

/** The round a reveal is about: which game it was, and which entry it came from. */
export type PlayedRound = Pick<RoundView, 'lineUpAt'> & {
  content: Pick<RoundView['content'], 'kind'>
}

/**
 * The round on screen, as its reveal heads it: the entry it was opened from,
 * named the way `nextRoundName` announced it. The game alone when the line-up
 * no longer holds that entry where the round stamped it, and `null` in a room
 * of one entry, which knows what it is playing.
 */
export const playedRoundName = ({
  lineUp,
  round,
  translate
}: LineUp & { round: PlayedRound }): string | null => {
  if (lineUp.length < 2) {
    return null
  }

  const { kind } = round.content
  const entry = round.lineUpAt === null ? undefined : lineUp[round.lineUpAt]

  if (round.lineUpAt === null || entry?.kind !== kind) {
    return translate(gameNameKey(kind))
  }

  return tellingNameAt({ at: round.lineUpAt, lineUp, translate })
}

/** `playedRoundName` in the reader's language. */
export const usePlayedRoundName = ({
  lineUp,
  round
}: {
  lineUp: readonly GameSettings[]
  round: PlayedRound
}): string | null =>
  playedRoundName({ lineUp, round, translate: useTranslate() })
