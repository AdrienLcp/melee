import type { GeoPoint, LocalizedName, Placement } from '@melee/protocol/atlas'
import type {
  BlackSquareSentLine,
  BlackSquareTheme
} from '@melee/protocol/black-square'
import type { ChallengeLabels } from '@melee/protocol/challenge'
import type { CountryCode } from '@melee/protocol/country-code'
import type { GameSettings } from '@melee/protocol/game'
import type {
  HostToken,
  Nickname,
  PlayerId,
  RoomCode,
  RoundId,
  SessionId
} from '@melee/protocol/identifiers'
import type {
  MatchsticksPuzzle,
  MatchsticksSolution,
  SentMove
} from '@melee/protocol/matchsticks'
import type { MostLikelyLabels } from '@melee/protocol/most-likely'
import type {
  PetitBacCategory,
  PetitBacCategoryState,
  PetitBacLetter
} from '@melee/protocol/petit-bac'
import type { HostQuestion } from '@melee/protocol/question'
import type {
  ModeSettings,
  RoomPhase,
  RoomSettings,
  RoundDuel
} from '@melee/protocol/room'
import type { Award, CellsVerdict, Verdict } from '@melee/protocol/scoring'
import type { ColourHex, SentColour } from '@melee/protocol/swatch'
import type { TeamId, TeamName } from '@melee/protocol/team'
import type { DatedTimelineEvent } from '@melee/protocol/timeline'
import type { HostTrack, TrackIdentity } from '@melee/protocol/track'

import type { RoundRoster } from '@melee/core/round/round-roster'
import type { SheetItem } from '@melee/core/slate/sheet-marking'

/**
 * The server's own model, deliberately richer than either wire view: it holds
 * the session ids that let a reloaded player reclaim their seat, and the track
 * identity nobody may see yet. `room-view.ts` is the only place it is projected
 * onto the wire.
 */

/**
 * What a map round asks for, the city's point included, and the capital's
 * country: the view withholds both until the reveal.
 */
export type AtlasRoundTarget =
  | { countryCode: CountryCode; kind: 'country' }
  | { kind: 'city'; name: string; point: GeoPoint }
  | {
      countryCode: CountryCode
      kind: 'capital'
      names: { en: string; fr: string }
      point: GeoPoint
    }

/**
 * What a `name` round needs beside its target: the point it shows, and how the
 * answer is told from a wrong one, typed or picked.
 */
export type AtlasNaming = {
  /** Every spelling that counts, in both languages: a room names a place in either. */
  accepted: string[]
  answer: LocalizedName
  /** Four in a `choice` round, shuffled, and empty in a `typed` one. */
  choices: LocalizedName[]
  correctChoiceIndex: number | null
  /** Its neighbours, which a typo is never forgiven far enough to reach. */
  decoys: LocalizedName[]
  shown: GeoPoint
}

export type TeamAward = {
  points: number
  teamId: TeamId
}

export type Room = {
  /**
   * The ready-made lines the next challenge round is picked from, dealt ahead
   * so the console can read them first. None is in `playedContentIds` until a
   * round opens on it; short or empty once the bank runs out.
   */
  challengeHand: DealtChallengeLine[]
  code: RoomCode
  createdAt: number
  /** Duels each seat has played this evening, which is who is drawn next — see `drawDuel`. */
  duelsBySeat: Map<PlayerId, number>
  /** Spoken black-square rounds each team has guessed this evening — see `drawSpokenTurn`. */
  guessesByTeam: Map<TeamId, number>
  /**
   * When the last console's socket went, and `null` while one is attached. The
   * grace window a second screen has to wait out is measured from here.
   */
  hostLeftAt: number | null
  /** `null` between the host closing their tab and reclaiming the room. */
  hostSessionId: SessionId | null
  /**
   * The room's own secret, minted with it and handed to whoever created it. It
   * never reaches a room view: `room-view.ts` projects neither this nor
   * `hostSessionId`, and the only frame carrying it travels the other way.
   */
  hostToken: HostToken
  /**
   * Whether the host asked for the next round to be a duel, spent as that
   * round opens — see `takeDuel`.
   */
  isDuelAsked: boolean
  /** Spoken black-square lists each seat has kept this evening — see `drawSpokenTurn`. */
  keepsBySeat: Map<PlayerId, number>
  lastActivityAt: number
  /**
   * The line-up entry each round of this game opened on, as it stood then —
   * kept by value because an edit to the line-up shifts its indices. Emptied
   * by a restart, so *play again* deals the evening afresh.
   */
  openedEntries: GameSettings[]
  phase: RoomPhase
  /**
   * Every track and every question already used, so a pool refilled mid-game
   * cannot repeat one. It is the room's rather than the source's: two rooms
   * playing at once must be free to draw the same question, and a bank that
   * remembered would leak one party into another.
   */
  playedContentIds: Set<string>
  /**
   * Every Petit Bac letter this room has played, oldest first. Not in
   * `playedContentIds`: a set cannot hold a letter twice, and the draw cycles
   * through them again once every one has gone.
   */
  playedLetters: PetitBacLetter[]
  players: Map<PlayerId, Participant>
  round: Round | null
  settings: RoomSettings
  /**
   * As many as `settings.teams` counts, in team order, and empty when the room
   * plays seat by seat. Who sits in each is the seats' to say — see
   * `Participant.teamId` — so a seat that goes leaves its team with nothing to
   * tidy up.
   */
  teams: RoomTeam[]
  /**
   * Candidates without their audio: preview URLs are signed with an expiry, so
   * the playable `HostTrack` is resolved when a round starts, not here.
   */
  trackPool: TrackIdentity[]
}

/** A ready-made line as the bank deals it, its letter already filled in. */
export type DealtChallengeLine = {
  id: string
  labels: ChallengeLabels
}

export type Participant = {
  /**
   * The seat's pawn before the round on screen, in a room on a track that
   * plays without teams; nought everywhere else. See `RoomTeam.bankedCase`.
   */
  bankedCase: number
  /**
   * When the socket closed, and `null` while it is open. It is what tells a
   * player who locked their screen apart from one who has gone: see
   * `@melee/core/room/seat-presence` for the two windows it feeds.
   */
  disconnectedAt: number | null
  id: PlayerId
  isConnected: boolean
  /** Said by the seat between two rounds, and cleared as the next one opens. */
  isReady: boolean
  nickname: Nickname
  /** Survives a disconnect: the seat is held, the score with it. */
  sessionId: SessionId
  score: number
  /** `null` in a room without teams, and for a seat still waiting to be dealt or to choose. */
  teamId: TeamId | null
}

export type RoomTeam = {
  colour: number
  id: TeamId
  name: TeamName | null
  /**
   * Every round already left behind plus the host's adjustments. The round on
   * screen is added on the way out rather than here, because a slate verdict
   * can still be taken back while its reveal is up — see `team-scores.ts`.
   */
  bankedScore: number
  /**
   * The pawn's case before the round on screen, adjustments included; the
   * round's move is added on the way out, for the reason the score's is.
   */
  bankedCase: number
}

/**
 * Everything one player did in a simultaneous round, graded as it arrived. It
 * is projected twice: as a name and a time while the round runs, and with what
 * they said once the answer is public.
 *
 * Typed mode takes as many guesses as the clip allows, so this accumulates.
 * Choice mode fills it once and refuses a second pick.
 *
 * The verdict is the union rather than the blind test's halves, because a game
 * judged on one claim is answered simultaneously too — and the shape it is
 * judged in belongs to the game, not to the mode.
 */
export type PlayerAttempts = {
  /** Their first guess of any kind — the name appearing on the room's screen. */
  firstGuessedAt: number
  /**
   * How far **into the round** their first guess that banked a half landed, and
   * `null` while they have none. The speed bonus is paid from this rather than
   * from arrival: being quickly wrong wins nothing, and with several guesses
   * allowed it must not win a queue place either.
   *
   * The round's own clock, never a wall clock — it stops while the host is away,
   * and a room whose console blinked would otherwise be charged for the pause.
   * On the blind test, where a pair is two claims and one score, it is the
   * **first** half that stamps it: the race the bonus prices was already won by
   * whoever recognised the track, and the other half is usually typed in the
   * same breath.
   */
  scoredAfterMs: number | null
  /** The guesses that banked a half, in the order they landed. */
  landed: string[]
  /** Their latest guess that banked nothing — what the reveal shows when nothing landed. */
  lastMiss: string | null
  playerId: PlayerId
  verdict: Verdict
}

/**
 * One press, and when the server heard it. There is nothing else to record: the
 * whole of a reflex answer or an inner clock count is that it happened, and
 * what it is worth is the gap to the flip or to the target.
 */
export type StampedPress = {
  atServerTime: number
  playerId: PlayerId
}

export type Round = {
  activeBuzz: {
    atServerTime: number
    /** `null` when the window is unlimited, or while the round is frozen. */
    expiresAt: number | null
    /**
     * What the window had left when the host walked away, so it resumes with
     * that rather than with a fresh go or an expiry nobody could answer into.
     */
    frozenWithMsLeft: number | null
    playerId: PlayerId
  } | null
  /**
   * When the reveal on screen gives way to the next round, and `null` whenever
   * nothing is counting it down. The hold is stamped where it *starts* rather
   * than where its timer is armed, because every path to a reveal broadcasts
   * before arming: a deadline computed beside the `setTimeout` would reach the
   * room one snapshot after the reveal it belongs to. `armAutoAdvance` reads
   * this instead of the setting, which is also what stops a second call
   * extending a hold already running.
   */
  advancesAt: number | null
  /** Buzzer mode leaves this empty; the other two fill it as frames arrive. */
  attempts: PlayerAttempts[]
  awards: Award[]
  /**
   * What the host paid each team straight, in a room whose teams answer aloud
   * and so hold no seat for `awards` to pay. Added to the sum of the seats'
   * awards in the team's round result, which is nought there.
   */
  teamAwards: TeamAward[]
  /**
   * What the round is asking, in the vocabulary of the game asking it — and the
   * answer, which lives here and reaches the wire only through `room-view.ts`.
   * The bare buzzer's arm carries neither: the room owns the question, and the
   * server is only there to say who was first.
   *
   * Choice mode's candidates are shuffled once when the round opens, so their
   * order carries nothing. `correctChoiceIndex` is the one field in the whole
   * model that must never be projected.
   */
  content:
    | {
        choices: TrackIdentity[]
        correctChoiceIndex: number | null
        kind: 'blindtest'
        track: HostTrack
      }
    | { kind: 'buzzer' }
    | {
        kind: 'challenge'
        /**
         * The line in every locale — a typed one is the same text under each —
         * and `null` once the bank is spent and nothing was typed.
         */
        labels: ChallengeLabels | null
      }
    | {
        /**
         * Whether a cell one seat alone found pays double, read off the
         * settings as the round opens so a switch flipped mid-round pays the
         * next one. Never in a spoken round.
         */
        doublesLoneFinds: boolean
        kind: 'blacksquare'
        /**
         * Each seat's lines that found something, and its latest that found
         * nothing — a miss replaces the one before, so a seat sending a
         * hundred lines holds eleven at most.
         */
        lines: (BlackSquareSentLine & { playerId: PlayerId })[]
        /**
         * Who says the answers and who ticks them, in a spoken round; `null`
         * in a typed one. `guessers` is the guessing team as the round opened,
         * so the reveal names who found the cells the keeper ticked.
         */
        spoken: {
          guessers: PlayerId[]
          guessingTeamId: TeamId
          keeperId: PlayerId
          sheet: CellsVerdict
        } | null
        /** The nine and the black word; what each seat found is on its attempts. */
        theme: BlackSquareTheme
      }
    | {
        kind: 'innerclock'
        /** In arrival order; a count is measured from the round's `startsAt`. */
        presses: StampedPress[]
        targetSeconds: number
      }
    | {
        kind: 'matchsticks'
        /** Every seat's move in a `move` round, in the order they landed; none on the buzzer. */
        moves: SentMove[]
        puzzle: MatchsticksPuzzle
        /** Every move that answers it; never empty, and it reaches the host arm alone. */
        solutions: MatchsticksSolution[]
      }
    | {
        categories: PetitBacCategory[]
        /** One per category, in order: every one `open` until the sheets close, then voted one at a time. */
        categoryStates: PetitBacCategoryState[]
        /** The seats whose stop the console took back this round, barred from calling another. */
        barredStoppers: Set<PlayerId>
        kind: 'petitbac'
        letter: PetitBacLetter
        /** Who refused which row, by category index then row key. */
        refusals: Map<number, Map<string, Set<PlayerId>>>
        /** Every seat's lines by category index; a cleared line is deleted, never stored empty. */
        sheets: Map<PlayerId, Map<number, string>>
        sheetsClosed: boolean
        /** Round time the sheets close at after a stop — elapsed, so a paused room freezes the grace too. */
        stopClosesAtElapsedMs: number | null
        stoppedBy: PlayerId | null
        /** Read off the settings as the round opens, so a switch flipped mid-round decides the next one. */
        stopsWhenFull: boolean
        /** The row keys the console struck out, by category index: refused whatever the votes say. */
        struckKeys: Map<number, Set<string>>
        /** Who said they are done with the category being voted; emptied as the next one goes up. */
        votesDone: Set<PlayerId>
      }
    | {
        choices: string[]
        correctChoiceIndex: number | null
        kind: 'quiz'
        question: HostQuestion
      }
    | {
        /**
         * How long after the round starts the screen flips, drawn once as it
         * opens. The delay rather than the moment, because when a round starts
         * is the round's own fact and holding both would be holding two
         * answers to it — `room-view.ts` adds them on the way out.
         */
        flipDelayMs: number
        kind: 'reflex'
        /** In arrival order, which is the only ordering anyone can trust. */
        presses: StampedPress[]
      }
    | {
        /** The item on the wall — always a closed one — and `null` until the first closes. */
        currentItemIndex: number | null
        /** One per item, in order; the sheet's length is theirs. */
        items: SheetItem[]
        /** The host's memo by item index. It reaches the host arm and no other. */
        keys: Map<number, string>
        kind: 'slate'
        /** The items whose key the host put up; only ever closed ones. */
        revealedKeyIndexes: Set<number>
        /** Every player's lines by item index; a cleared line is deleted, never stored empty. */
        sheets: Map<PlayerId, Map<number, string>>
      }
    | {
        /** In the order they were dealt, which is shuffled; the years are the answer. */
        events: DatedTimelineEvent[]
        kind: 'timeline'
      }
    | {
        kind: 'atlas'
        /** A `name` round's, and `null` in a `place` round. */
        naming: AtlasNaming | null
        /** Every seat's marker, in the order they landed; a team's answer is one per seat. */
        placements: Placement[]
        target: AtlasRoundTarget
      }
    | {
        /** Drawn by the server; on every screen until it hides, and the answer. */
        colour: ColourHex
        kind: 'swatch'
        /** Every seat's colour, in the order they landed. */
        sent: SentColour[]
        /** How long the colour stays up, stamped as the round opens. */
        showMs: number
      }
    | {
        /** Every ballot, in the order they landed; who voted for whom never leaves the server. */
        ballots: { playerId: PlayerId; seatId: PlayerId }[]
        kind: 'mostlikely'
        labels: MostLikelyLabels
      }
  /**
   * How long the open phase runs, stamped as the round opens so a host moving
   * the setting mid-round decides the next round rather than cutting this one
   * short. `null` for a game with no round clock.
   */
  /** The two seats this round is a duel between, `null` when everyone plays it. */
  duel: RoundDuel | null
  durationMs: number | null
  /**
   * The round's own clock, and the pair that makes a miss resumable: a buzz
   * stops it, and the round has to know how much is left rather than handing
   * the next player a fresh thirty seconds. A game with no clock — the bare
   * buzzer — still winds it, and nothing ever reads the total.
   */
  elapsedMs: number
  id: RoundId
  index: number
  /** The line-up entry the round was opened from — see `RoundView['lineUpAt']`. */
  lineUpAt: number | null
  lockedOutPlayerIds: Set<PlayerId>
  /**
   * The answer mode the round was opened on. A simultaneous round is scored on
   * the way out from it, so the room's setting moving mid-round must not reach
   * it: a typed round switched to `choice` would pay a typed answer at a pick's
   * rate. The floor's window is the exception — see `floorWindowMs`.
   */
  mode: ModeSettings
  /**
   * Who the round is played by, and `null` until its clip starts — see
   * `@melee/core/round/round-roster`. One stamp covers the whole round.
   *
   * The slate stamps each item as it closes instead, and this only once none
   * is left open: its sheet has no clock and no race, so a friend arriving
   * mid-sheet is owed every item still open rather than a wait.
   */
  openedWithPlayerIds: RoundRoster
  revealed: boolean
  /** Server time the round last started or resumed running; `null` while paused. */
  runningSince: number | null
  startsAt: number | null
}
