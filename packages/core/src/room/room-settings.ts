import {
  DEFAULT_GAME_SETTINGS,
  type GameKind,
  type GameSettings
} from '@melee/protocol/game'
import type { Locale } from '@melee/protocol/locale'
import {
  type AnswerMode,
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  type ModeSettings,
  type RoomSettings
} from '@melee/protocol/room'

import { randomUnit } from '../helpers/random'
import { questionLanguageFor } from '../quiz/question-language'
import { modeOfferedBy } from './game-modes'
import { dealtOrder } from './running-order'

/**
 * How many rounds a game opens on, and `null` where the honest answer is "until
 * you stop". A blind test runs a playlist to its end; a charade evening runs
 * until the room has had enough, and a ten the host has to notice and clear is
 * the blind test's shape wearing the room's name.
 */
const DEFAULT_ROUND_COUNT: Record<GameKind, number | null> = {
  blindtest: 10,
  buzzer: null,
  /** Challenges are the evening's interludes, played until the host moves on. */
  challenge: null,
  /** A count is a minute or so of silence, and five of them are an interlude rather than an evening. */
  innerclock: 5,
  matchsticks: 10,
  quiz: 10,
  /** A heat is a wait and a press, so ten of them is under two minutes. */
  reflex: 10,
  /** One sheet is the evening's tasting; a second is a second tasting, and the host can say so. */
  slate: 1,
  /** Five events a round, so eight rounds deal forty and leave the bank plenty. */
  timeline: 8,
  worldmap: 10
}

/**
 * How a game expects to be answered before anybody has said otherwise. It is
 * the game's preference and not the room's rule: `modeOfferedBy` still narrows
 * it, so an entry naming a mode its own game does not offer is corrected rather
 * than served.
 *
 * Both games that serve their own content open on four candidates. A quiz
 * question is a sentence with one fact missing, and a table reads it faster
 * than it types it — the shape most of the bank was written in. A blind test
 * was opened on typing until a table played it over lunch: a clip leaves no
 * time to type an artist on a phone, and the room it was played in asked for
 * the four.
 */
const DEFAULT_ANSWER_MODE: Record<GameKind, AnswerMode> = {
  blindtest: 'choice',
  buzzer: 'buzzer',
  challenge: 'buzzer',
  innerclock: 'buzzer',
  matchsticks: 'move',
  quiz: 'choice',
  reflex: 'buzzer',
  slate: 'typed',
  timeline: 'order',
  worldmap: 'point'
}

/**
 * The four fields a game gets a say in, as one value: which game, how it is
 * answered, how long the evening runs, and how long its reveal is held. It is
 * the seam `movedToGame` has always turned on, and naming it is what lets a
 * *remembered* answer come through the same door the game's own defaults do.
 *
 * The hold is remembered per game because twenty-five seconds chosen for a
 * quiz whose questions carry a note is not what a reflex race wants, whose
 * reveal is a reaction time and a name.
 */
export type GameSetup = {
  autoAdvanceMs: RoomSettings['autoAdvanceMs']
  game: GameSettings
  mode: ModeSettings
  roundCount: RoomSettings['roundCount']
}

/**
 * How many rounds of each game a table of several plays: the company raclette
 * the line-up was built for ticked five games for twenty rounds, and two games
 * ticked for an evening are eight rounds, not forty.
 */
const ROUNDS_PER_TICKED_GAME = 4

/**
 * What a freshly opened room is set to. The shell's defaults, with the four
 * fields the game gets a say in.
 *
 * No game is a room opened from the front door, where the code goes up before
 * anybody has decided what to play. It is the shell's defaults and nothing
 * else: the four fields below are the game's to answer, and there is no game
 * yet to answer them.
 *
 * Several games open on the first, with a length of their own and the reveal
 * held for the host: the first game's count would end the table on its own
 * game, and the blind test's eight seconds would cut a quiz note off.
 */
export const roomSettingsFor = ({
  games,
  locale
}: {
  games: readonly GameKind[]
  /** The host's, and the only evidence available for what a room has not been asked. */
  locale: Locale
}): RoomSettings => {
  const [first] = games

  if (first === undefined) {
    return DEFAULT_ROOM_SETTINGS
  }

  const setup = openedSetup({ game: first, locale })

  if (games.length === 1) {
    return {
      ...DEFAULT_ROOM_SETTINGS,
      ...setup,
      lineUp: [setup.game],
      lineUpAt: 0
    }
  }

  const lineUp = games.map((ticked) =>
    openedGameSettings({ game: ticked, locale })
  )
  const roundCount = games.length * ROUNDS_PER_TICKED_GAME

  return {
    ...DEFAULT_ROOM_SETTINGS,
    ...setup,
    autoAdvanceMs: null,
    lineUp,
    lineUpAt: 0,
    roundCount,
    runningOrder: dealtOrder({
      drawnAt: 0,
      lineUp,
      order: [],
      played: lineUp.map(() => 0),
      random: randomUnit,
      roundCount,
      upcoming: 0
    })
  }
}

/**
 * How long a reveal is held before the next round, as each game opens. `null`
 * waits for the host, which cannot be too short. The blind test runs on its
 * own: its reveal is a cover and a title, read in the eight seconds the clip
 * goes on playing under it, and the countdown to the next one is inside them.
 */
const DEFAULT_HOLD_MS: Record<GameKind, RoomSettings['autoAdvanceMs']> = {
  blindtest: 8_000,
  buzzer: null,
  challenge: null,
  innerclock: null,
  matchsticks: null,
  quiz: null,
  reflex: null,
  slate: null,
  timeline: null,
  worldmap: null
}

/** What a game answers before anybody has told it otherwise. */
export const openedSetup = ({
  game,
  locale
}: {
  game: GameKind
  locale: Locale
}): GameSetup => ({
  autoAdvanceMs: DEFAULT_HOLD_MS[game],
  game: openedGameSettings({ game, locale }),
  mode: modeOfferedBy({
    game,
    preferred: DEFAULT_MODE_SETTINGS[DEFAULT_ANSWER_MODE[game]]
  }),
  roundCount: DEFAULT_ROUND_COUNT[game]
})

/**
 * The game's own defaults, with the one field that cannot have a fixed one. A
 * question drawn in a language the host does not read is the wrong game, and the
 * protocol's default has no way of knowing which that is — so a game that draws
 * from the bank takes the host's.
 */
const openedGameSettings = ({
  game,
  locale
}: {
  game: GameKind
  locale: Locale
}): GameSettings => {
  const opened = DEFAULT_GAME_SETTINGS[game]

  return opened.kind === 'quiz'
    ? { ...opened, language: questionLanguageFor(locale) }
    : opened
}

/**
 * The same room, playing something else. The four fields a game gets a say in
 * take that game's answer, and the rest is the host's and survives: a countdown
 * they lengthened is not undone by changing their mind about the game.
 *
 * The four never carry over from the outgoing game, because carrying them is
 * what put a room on a blind test with no round limit that nobody could type an
 * answer into — the bare buzzer's settings, worn by a game that has its own.
 * What they may carry from is this host's *last evening on the incoming game*,
 * which is a different thing entirely and the only reason `remembered` exists.
 *
 * A room playing one game moves its line-up along with it — that is today's
 * picker — while an evening of several goes to the first entry of that game,
 * or ticks it when none is.
 */
export const movedToGame = ({
  game,
  locale,
  remembered,
  settings
}: {
  game: GameKind
  locale: Locale
  /** What this host last left this game set to, or `null` if they never have. */
  remembered: GameSetup | null
  settings: RoomSettings
}): RoomSettings => {
  const isEvening = settings.lineUp.length > 1
  const ticked = settings.lineUp.findIndex((entry) => entry.kind === game)

  if (isEvening && ticked !== -1) {
    return movedToEntry({ at: ticked, locale, remembered, settings })
  }

  const setup = remembered ?? openedSetup({ game, locale })
  const lineUp = isEvening ? [...settings.lineUp, setup.game] : [setup.game]

  return movedToEntry({
    at: lineUp.length - 1,
    locale,
    remembered: setup,
    settings: { ...settings, lineUp }
  })
}

/**
 * The room set to play the line-up's entry `at`, on that entry's own settings.
 * How it is answered is still this host's last word on the game, because an
 * entry carries the game's settings and the mode is the room's — in an evening,
 * only when it has a judge.
 *
 * An evening keeps its own length and its own hold. The count is the
 * evening's: a quiz's ten rounds landing on round twelve would end it on the
 * spot. So is the hold: the switch lands while the last game's reveal is still
 * up, and the blind test's eight seconds would cut a quiz note off mid-sentence.
 */
export const movedToEntry = ({
  at,
  locale,
  remembered,
  settings
}: {
  at: number
  locale: Locale
  /** What this host last left the entry's game set to, or `null` if they never have. */
  remembered: GameSetup | null
  settings: RoomSettings
}): RoomSettings => {
  const entry = settings.lineUp[at]

  if (entry === undefined) {
    return settings
  }

  const opened = openedSetup({ game: entry.kind, locale })
  const setup = remembered ?? opened
  const isEvening = settings.lineUp.length > 1

  return {
    ...settings,
    ...setup,
    autoAdvanceMs: isEvening ? settings.autoAdvanceMs : setup.autoAdvanceMs,
    game: entry,
    lineUpAt: at,
    // An evening with no judge has nobody set aside to hear an answer, so each
    // game is answered the way it opens — four candidates for the quiz —
    // whatever this host left it on when they ran it alone with a judge.
    mode: isEvening && !settings.hasJudge ? opened.mode : setup.mode,
    roundCount: isEvening ? settings.roundCount : setup.roundCount
  }
}

/**
 * Whether the change would alter what a round already under way is *built on*.
 * Everything else is read at the moment it is next needed, or was stamped on the
 * round as it opened — the answer mode and the round duration both are — which
 * is what lets a host switch to four choices or lengthen the clock mid-evening
 * and have it land on the next round.
 *
 * The game cannot wait: a new `game.kind` leaves the screens rendering one game's
 * round under another game's settings, and moves the answer mode with it.
 */
export const reshapesRound = ({
  from,
  to
}: {
  from: RoomSettings
  to: RoomSettings
}): boolean => from.game?.kind !== to.game?.kind
