import type { Difficulty } from '@melee/protocol/difficulty'
import type { AtlasSettings, GameSettings } from '@melee/protocol/game'
import type { QuestionCategory } from '@melee/protocol/question'
import type { RoomSettings, RoundView } from '@melee/protocol/room'
import type { CatalogueSource, TrackSource } from '@melee/protocol/track'

import { trackAnswersOf } from '@melee/core/blindtest/track-answers'
import {
  difficultyOf,
  eveningDifficultyOf
} from '@melee/core/room/evening-difficulty'

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

const levelOf = ({
  difficulty,
  translate
}: {
  difficulty: Difficulty
  translate: Translate
}): string => translate(`host.difficulty.${difficulty}`)

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
        : [pick, levelOf({ difficulty: entry.difficulty, translate })]
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

      return pick === null
        ? []
        : [pick, levelOf({ difficulty: entry.difficulty, translate })]
    }
    case 'slate':
      return [translate('slate.items.summary', { count: entry.itemCount })]
    case 'blacksquare':
      return [
        translate('blacksquare.answerCount.summary', {
          count: entry.answerCount
        })
      ]
    case 'petitbac':
      return entry.categories === null
        ? [
            translate('host.evening.detail.drawnCategories', {
              count: entry.categoryCount
            })
          ]
        : []
    case 'swatch':
      return [secondsOf({ ms: entry.showMs, translate })]
    case 'atlas':
      return entry.places.length === 1
        ? [
            atlasAsks({ entry, translate }),
            levelOf({ difficulty: entry.difficulty, translate })
          ]
        : []
    case 'mysteryword':
      return [translate('mysteryword.length', { count: entry.wordLength })]
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
          : [levelOf({ difficulty: entry.difficulty, translate })]),
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
        levelOf({ difficulty: entry.difficulty, translate }),
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
        levelOf({ difficulty: entry.difficulty, translate }),
        LANGUAGE_NAMES[entry.language],
        secondsOf({ ms: entry.roundDurationMs, translate })
      ]
    case 'slate':
      return [translate('slate.items.summary', { count: entry.itemCount })]
    case 'atlas':
      return [
        atlasAsks({ entry, translate }),
        levelOf({ difficulty: entry.difficulty, translate }),
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
    case 'timeline':
      return [
        levelOf({ difficulty: entry.difficulty, translate }),
        secondsOf({ ms: entry.roundDurationMs, translate })
      ]
    case 'mostlikely':
      return [secondsOf({ ms: entry.roundDurationMs, translate })]
    case 'mysteryword':
      return [
        translate('mysteryword.length', { count: entry.wordLength }),
        levelOf({ difficulty: entry.difficulty, translate }),
        secondsOf({ ms: entry.roundDurationMs, translate })
      ]
    case 'longestword':
      return [
        LANGUAGE_NAMES[entry.language],
        secondsOf({ ms: entry.roundDurationMs, translate })
      ]
    case 'makenumber':
      return [secondsOf({ ms: entry.roundDurationMs, translate })]
    case 'thinkalike':
      return [
        LANGUAGE_NAMES[entry.language],
        secondsOf({ ms: entry.roundDurationMs, translate })
      ]
  }
}

type LineUp = {
  lineUp: readonly GameSettings[]
  translate: Translate
}

/**
 * The level alone, for siblings nothing else tells apart: two timelines, or two
 * quizzes on several subjects each. `null` for a game dealt at no level, and
 * for film scores, which pin their own.
 */
const levelNamingOf = ({
  entry,
  translate
}: {
  entry: GameSettings
  translate: Translate
}): string | null => {
  const difficulty = difficultyOf(entry)

  if (
    difficulty === null ||
    (entry.kind === 'blindtest' && trackAnswersOf(entry.source) === 'films')
  ) {
    return null
  }

  return levelOf({ difficulty, translate })
}

/**
 * What each entry of the line-up is called where it is named on its own — a
 * stage, a seat's screen, the press opening it — in its order: the game's name
 * alone while it is ticked once, and with as much of its settings as it takes
 * to tell it from the game's other entries once it is not — *Blind test · Film
 * scores* beside *Blind test · Charts*. Never numbered: on its own, a number
 * says no setting and reads as the round count.
 */
export const lineUpEntryNames = ({ lineUp, translate }: LineUp): string[] => {
  const details = lineUp.map((entry) => namingOf({ entry, translate }))
  const levels = lineUp.map((entry) => levelNamingOf({ entry, translate }))
  const said = (at: number, depth: number): string =>
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

    if (
      said(at, 1) === '' &&
      siblings.every((index) => said(index, 1) !== '')
    ) {
      return game
    }

    const level = levels[at] ?? null

    if (
      level !== null &&
      siblings.every((index) => (levels[index] ?? null) !== level)
    ) {
      return `${game} · ${level}`
    }

    const detail = said(at, 1)

    return detail === '' ? game : `${game} · ${detail}`
  })
}

const entryNameAt = ({
  at,
  lineUp,
  translate
}: LineUp & { at: number }): string | undefined =>
  lineUpEntryNames({ lineUp, translate })[at]

/** An entry as the setup lists it. */
export type LineUpEntrySummary = {
  /**
   * The game's name, numbered only beside a row of the same game whose
   * settings read the same — *Shades 1*, *Shades 2* — since nothing else
   * tells the two apart.
   */
  name: string
  /**
   * The entry where no settings follow its name — a control's label, the
   * notice undoing its removal: its line-up name, told from its siblings by a
   * setting, and numbered like `name` beside a twin.
   */
  nameAlone: string
  /**
   * Every setting of the entry, round length last, in one line; `null` when
   * the entry has none to say.
   */
  settings: string | null
}

/**
 * Each entry of the line-up as the setup lists it, in its order: every row
 * titled by its game alone and told from its siblings by its settings, the
 * way a game ticked once already is.
 */
export const lineUpEntrySummaries = ({
  lineUp,
  translate
}: LineUp): LineUpEntrySummary[] => {
  const names = lineUpEntryNames({ lineUp, translate })
  const eveningLevel = eveningDifficultyOf(lineUp)
  // The evening's strip already says a level every game agrees on.
  const levelSaidAbove =
    eveningLevel === null || eveningLevel === 'custom'
      ? null
      : levelOf({ difficulty: eveningLevel, translate })
  const lines = lineUp.map((entry) => {
    const settings = settingsOf({ entry, translate }).filter(
      (setting) => difficultyOf(entry) === null || setting !== levelSaidAbove
    )

    return settings.length > 0 ? settings.join(SETTINGS_SEPARATOR) : null
  })

  return lineUp.map((entry, at) => {
    const game = translate(gameNameKey(entry.kind))
    const named = names[at] ?? game
    const settings = lines[at] ?? null
    const twins = lineUp.flatMap((other, index) =>
      other.kind === entry.kind && lines[index] === settings ? [index] : []
    )
    const numbered = (name: string): string =>
      twins.length < 2
        ? name
        : translate('round.entryNumbered', {
            name,
            number: twins.indexOf(at) + 1
          })

    return { name: numbered(game), nameAlone: numbered(named), settings }
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
 * a variant says which, never by its list's number — and `null` while there
 * is no game.
 */
export const useEntryName = (settings: EntrySettings): string | null => {
  const translate = useTranslate()

  if (settings.game === null) {
    return null
  }

  return (
    (settings.lineUpAt === null
      ? undefined
      : entryNameAt({
          at: settings.lineUpAt,
          lineUp: settings.lineUp,
          translate
        })) ?? translate(gameNameKey(settings.game.kind))
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
  const name = entryNameAt({ at, lineUp, translate }) ?? game
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
