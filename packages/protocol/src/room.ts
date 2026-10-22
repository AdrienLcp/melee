import { z } from 'zod'

import { boardSettingsSchema, DEFAULT_BOARD_SETTINGS } from './board'
import { gameSettingsSchema } from './game'
import {
  nicknameSchema,
  playerIdSchema,
  roomCodeSchema,
  roundIdSchema,
  serverTimeSchema
} from './identifiers'
import { innerclockTargetSecondsSchema } from './innerclock'
import {
  matchsticksPuzzleSchema,
  matchsticksSolutionSchema,
  sentMoveSchema,
  stickMoveSchema
} from './matchsticks'
import {
  hostQuestionSchema,
  questionPromptSchema,
  revealedQuestionSchema
} from './question'
import { awardSchema, verdictSchema } from './scoring'
import {
  slateAnswerGroupSchema,
  slateItemCountSchema,
  slateItemIndexSchema,
  slateItemStateSchema,
  slateLineSchema,
  slateProgressSchema
} from './slate'
import {
  DEFAULT_TEAMS_SETTINGS,
  teamIdSchema,
  teamSchema,
  teamsSettingsSchema
} from './team'
import { datedTimelineEventSchema, timelineEventSchema } from './timeline'
import { hostTrackSchema, trackIdentitySchema } from './track'
import { placementSchema, worldmapTargetSchema } from './worldmap'

export const MAX_PLAYERS_PER_ROOM = 24

export const roomPhases = [
  'lobby',
  'countdown',
  'playing',
  'buzzed',
  'revealed',
  'finished'
] as const

export const roomPhaseSchema = z.enum(roomPhases)

export const answerModes = [
  'buzzer',
  'choice',
  'typed',
  'point',
  'order',
  'move'
] as const

/**
 * How a round is answered. One game, not three: the pool, the audio, the
 * countdown, the reveal and the scoreboard are identical, and what differs is
 * who acts, who decides, and what scores.
 *
 * `buzzer` is one player, the first, judged by the host. `choice` and `typed`
 * are everyone at once, decided by the server — exactly, then fuzzily — and
 * scored by speed on top of being right.
 *
 * It is the room's, not a game's: the shell reads it everywhere a round is
 * answered and scored, and what a game does is *narrow* it — see
 * `answerModesFor` in `@melee/core/room/game-capabilities`, and the server refuses a
 * frame that sets one the current game does not offer.
 */
export const answerModeSchema = z.enum(answerModes)

/**
 * How a round is answered, and the settings only that mode has — the room's
 * second axis, and the same shape as `gameSettingsSchema` for the same reason.
 * Which game is being played and how it is answered are independent choices,
 * and each owns settings the other cannot read.
 *
 * The buzzer arm is the only one with anything of its own so far, and that is
 * what the union buys before it has a second: `answerWindowMs` is unreachable
 * from a mode where nobody buzzes, so `registerBuzz`'s guard against a
 * hand-written buzz *is* the narrowing that produces the window.
 */
export const modeSettingsSchema = z.discriminatedUnion('kind', [
  z.object({
    /**
     * How long the floor is held after a buzz before the server takes it back,
     * or `null` when the host decides by hand and the screens count up instead.
     *
     * Buzzing costs nothing on its own, so without this a press that was fast
     * and a mouth that has nothing to say can hold a whole room. Running out is
     * the same outcome as answering wrong — no points, locked out, the round
     * resumes — because taking the floor and saying nothing is what it cost
     * everyone else, and because a pass with no lockout lets the same player
     * take it again immediately.
     */
    answerWindowMs: z.number().int().min(3_000).max(60_000).nullable(),
    kind: z.literal('buzzer')
  }),
  z.object({ kind: z.literal('choice') }),
  z.object({ kind: z.literal('typed') }),
  z.object({ kind: z.literal('point') }),
  z.object({ kind: z.literal('order') }),
  z.object({ kind: z.literal('move') })
])

/**
 * How many entries an evening may tick. Every shelved game once, with room for
 * a few variants on top: past a dozen the line-up stops fitting the strip the
 * console draws it in, and no evening plays that many games anyway.
 */
export const LINE_UP_MAX_ENTRIES = 12

const lineUpAtSchema = z
  .number()
  .int()
  .min(0)
  .max(LINE_UP_MAX_ENTRIES - 1)
  .nullable()

export const roomSettingsSchema = z.object({
  /**
   * How long a reveal stays on screen before the next round starts itself, or
   * `null` when the host advances by hand. The wait is served by the server for
   * the same reason the countdown is: a background tab throttles its timers,
   * and the host's screen is exactly the tab most likely to lose focus.
   */
  autoAdvanceMs: z.number().int().min(2_000).max(30_000).nullable(),
  /**
   * Whether the teams race on a track around the round — see `board.ts`.
   * Ignored by a room without teams.
   */
  board: boardSettingsSchema,
  /** Milliseconds between "start" and the first note, so every device lands together. */
  countdownMs: z.number().int().min(0).max(10_000),
  /**
   * Which game the room is playing, and the settings only that game has. The
   * room keeps what every game needs and hands the rest here — see `game.ts`.
   *
   * `null` until somebody chooses, because a room is opened before a game is
   * picked: the code goes up, the players arrive, and the table decides while
   * they do. That is the whole reason this is nullable rather than opening on a
   * default — a default would have the lobby and every player name a game
   * nobody chose, and there would be no way to say "still deciding" at all.
   *
   * It is also what makes the rest type-check: the guard on `host.startRound`
   * *is* the narrowing every downstream call needs, the same way
   * `registerBuzz`'s guard is what produces the answer window.
   */
  game: gameSettingsSchema.nullable(),
  /**
   * Whether somebody runs the room and never plays: the console holds no seat
   * under any game, and an evening plays each game the way its judge last left
   * it — a buzzer quiz read aloud included. Without one an evening has nobody
   * set aside to hear an answer, so each game opens the way it opens alone.
   */
  hasJudge: z.boolean(),
  /**
   * The games ticked for the evening, each with its own settings: what the next
   * round may be drawn from. Two entries may share a game — a blind test on the
   * charts and one on film scores are two ticks — which is why an entry is the
   * game's whole arm rather than its kind. A room with no game yet has ticked
   * none; one entry is a room playing one game, which is every room opened from
   * a game's own front door.
   *
   * Kinds rather than shelved games, so a settings frame may still put a room
   * on a game that is served before it has a front door — the line-up only
   * ever has to hold what `game` may.
   */
  lineUp: z.array(gameSettingsSchema).max(LINE_UP_MAX_ENTRIES),
  /**
   * Which entry `game` was opened from, and `null` exactly when there is no
   * game. `game` is the copy the round is played on and the entry follows it:
   * the server writes every accepted frame's `game` back into this entry, so a
   * setting changed in the fold is the variant's from then on, and an entry
   * drawn again later opens on what it was last left at.
   */
  lineUpAt: lineUpAtSchema,
  /** How a round is answered, and the settings only that mode has. */
  mode: modeSettingsSchema,
  /**
   * How many rounds the game runs for, or `null` for "until the host ends it".
   *
   * A fixed count is the blind test's shape — a playlist runs out — and it is
   * the wrong one for a host running a charade evening, who stops when they
   * stop. The final board already knows how to arrive on a press.
   */
  roundCount: z.number().int().min(1).max(50).nullable(),
  /** Whether the room plays in teams, and how its seats get into them — see `team.ts`. */
  teams: teamsSettingsSchema
})

export type AnswerMode = z.infer<typeof answerModeSchema>
export type ModeSettings = z.infer<typeof modeSettingsSchema>
export type BuzzerModeSettings = Extract<ModeSettings, { kind: 'buzzer' }>
export type RoomSettings = z.infer<typeof roomSettingsSchema>

export const DEFAULT_BUZZER_MODE_SETTINGS: BuzzerModeSettings = {
  answerWindowMs: 10_000,
  kind: 'buzzer'
}

/** A record rather than a switch, so a new mode without a default cannot compile. */
export const DEFAULT_MODE_SETTINGS: Record<AnswerMode, ModeSettings> = {
  buzzer: DEFAULT_BUZZER_MODE_SETTINGS,
  choice: { kind: 'choice' },
  move: { kind: 'move' },
  order: { kind: 'order' },
  point: { kind: 'point' },
  typed: { kind: 'typed' }
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  autoAdvanceMs: null,
  board: DEFAULT_BOARD_SETTINGS,
  countdownMs: 3_000,
  /** A freshly opened room is a code on a screen; the game is the table's first decision. */
  game: null,
  hasJudge: false,
  lineUp: [],
  lineUpAt: null,
  /**
   * Everyone plays every round, which is what a party wants: the buzzer gives
   * the floor to whoever is quickest and leaves the rest of the room watching.
   */
  mode: DEFAULT_MODE_SETTINGS.typed,
  roundCount: 10,
  teams: DEFAULT_TEAMS_SETTINGS
}

export const publicPlayerSchema = z.object({
  id: playerIdSchema,
  isConnected: z.boolean(),
  /**
   * Back at the table between two rounds — said by the seat itself, shown on
   * the wall, and cleared when the next round opens. Never a gate: the host
   * starts whenever they like, ready or not.
   */
  isReady: z.boolean(),
  nickname: nicknameSchema,
  score: z.number().int().nonnegative()
})

export const activeBuzzSchema = z.object({
  /** Stamped by the server on frame arrival — the only ordering anyone can trust. */
  atServerTime: serverTimeSchema,
  /**
   * When the server takes the floor back, or `null` when the host decides by
   * hand — and the screens then count up from `atServerTime` instead of down.
   *
   * A server time rather than a duration, because the window is paused and
   * restarted along with the round: a host who drops off Wi-Fi must not spend
   * somebody's five seconds while nobody can hear them answer.
   */
  expiresAt: serverTimeSchema.nullable(),
  playerId: playerIdSchema
})

/**
 * Who is in, and when they got there — never what they said. The room watching
 * a screen fill up with names is the tension of a simultaneous round, and it
 * costs nothing that could be worked backwards into the answer.
 */
export const roundAnswerSchema = z.object({
  atServerTime: serverTimeSchema,
  playerId: playerIdSchema
})

/**
 * What each player actually answered, published at the reveal and not a moment
 * before. `isCorrect` is the server's grade, which is only a leak once the
 * answer is already public.
 */
export const revealedAnswerSchema = roundAnswerSchema.extend({
  isCorrect: z.boolean(),
  /** The choice they picked, or the two fields they typed. */
  said: z.string()
})

/**
 * What the round is asking, in the vocabulary of the game asking it. Everything
 * around it — who buzzed, who is locked out, what was awarded — is the shell's
 * and is the same in every game.
 *
 * Every arm is safe for a player to hold: one of the choices is the answer,
 * which is the game rather than a leak. **Which** one lives only in the
 * server's `Round` and reaches no frame — see `codec.test.ts`.
 */
export const roundContentSchema = z.discriminatedUnion('kind', [
  z.object({
    /** Choice mode only, and shuffled per round. */
    choices: z.array(trackIdentitySchema),
    kind: z.literal('blindtest'),
    revealedTrack: trackIdentitySchema.nullable()
  }),
  /**
   * Nothing but its kind, because the room owns the question and the server
   * never learns it. The arm still exists rather than the field going `null`:
   * absent content and a round that has none are different facts, and only one
   * of them means there is no round.
   */
  z.object({ kind: z.literal('buzzer') }),
  z.object({
    kind: z.literal('challenge'),
    /**
     * What the table is asked to do, public from the first frame: it is the
     * question, and the answer happens at the table where no screen sees it.
     * `null` for a round nobody typed one for — one the reveal hold opened —
     * which the host says aloud.
     */
    text: z.string().nullable()
  }),
  z.object({
    /**
     * Whether the reader's own press has landed, and `false` for a reader
     * with no seat. Not when: a player who knew they stopped at 74 s could say
     * so aloud to the ones still counting.
     */
    hasPressed: z.boolean(),
    kind: z.literal('innerclock'),
    /**
     * Every press, and `null` until the reveal — another seat's press seen
     * mid-count is a cue. A count is `atServerTime` minus `round.startsAt`,
     * worked out where it is shown, as a reflex reaction is.
     */
    revealedPresses: z.array(roundAnswerSchema).nullable(),
    targetSeconds: innerclockTargetSecondsSchema
  }),
  z.object({
    kind: z.literal('matchsticks'),
    puzzle: matchsticksPuzzleSchema,
    /**
     * Every move a seat sent in a `move` round, in the order they landed, and
     * `null` until the reveal: a move seen mid-round is the answer handed over.
     * Empty in a round played on the buzzer, where nobody sends one.
     */
    revealedMoves: z.array(sentMoveSchema).nullable(),
    /**
     * The move, shown on every screen once the round is revealed. One of
     * possibly several: the host judges against all of them, and the room is
     * shown the first.
     */
    revealedSolution: matchsticksSolutionSchema.nullable(),
    /**
     * The move the reader sent this round, and `null` before they have, for a
     * reader holding no seat, or in a round answered aloud. Their own and no
     * one else's, so a screen that reloaded mid-round still shows it — and
     * never whether it was right, which waits for the reveal.
     */
    yourMove: stickMoveSchema.nullable()
  }),
  z.object({
    /** Choice mode only, and shuffled per round. */
    choices: z.array(z.string()),
    kind: z.literal('quiz'),
    prompt: questionPromptSchema,
    revealedQuestion: revealedQuestionSchema.nullable()
  }),
  z.object({
    /**
     * When the screen flips, and `null` until the round's clock has a start.
     * Every device flips against its own estimated offset rather than on a
     * frame landing, so what the race measures is reaction and not the room's
     * Wi-Fi — which is the whole reason this is handed out in advance. What
     * makes that safe is `FALSE_START_FLOOR_MS`, not hiding the number.
     */
    flipsAt: serverTimeSchema.nullable(),
    kind: z.literal('reflex'),
    /**
     * Every press that landed, in arrival order — the first one takes the
     * round. A reaction is `atServerTime` minus `flipsAt`, worked out where it
     * is shown rather than carried: both halves of the subtraction are already
     * here, and a third field could disagree with them.
     *
     * A false start is not one of these. It is refused, and puts the player in
     * `lockedOutPlayerIds` — which in this game has no other cause.
     */
    presses: z.array(roundAnswerSchema)
  }),
  z.object({
    /**
     * The item on the wall — always a closed one — and `null` until the host
     * closes the first. 0-based, like every index this game sends; what a
     * screen draws for it is `settings.game.labels`, or its number.
     */
    currentItemIndex: slateItemIndexSchema.nullable(),
    /** The round's own count, which `host.addItem` grows until the reveal. */
    itemCount: slateItemCountSchema,
    /** One per item: whether it can still be written, and how far its marking has gone. */
    itemStates: z.array(slateItemStateSchema),
    kind: z.literal('slate'),
    /**
     * One per item: the host's key once they revealed it on a closed item, and
     * `null` everywhere else — an open item, or a key still held back. Every
     * other game hands its answer to the players at the reveal, and a closed
     * item is revealed for the same reason: nobody can still write to it.
     */
    revealedKeys: z.array(z.string().nullable()),
    /**
     * The reader's own sheet, one line per item, and nobody else's — not even
     * the host screen holds another player's answer to an item still open,
     * because the host screen is the wall. `null` for a reader with no seat.
     *
     * It is what a reload comes back to: a locked screen loses nothing, since
     * every line was saved on its own as it was written.
     */
    yourSheet: z.array(slateLineSchema).nullable()
  }),
  z.object({
    /**
     * The round's events in the order they were dealt, which is shuffled and
     * says nothing about the answer. No year rides here: a date is the answer.
     */
    events: z.array(timelineEventSchema),
    kind: z.literal('timeline'),
    /** The same events earliest first, each with its year, and `null` until the reveal. */
    revealedEvents: z.array(datedTimelineEventSchema).nullable()
  }),
  z.object({
    kind: z.literal('worldmap'),
    /**
     * Every marker that landed, and `null` until the reveal: one seen on
     * another screen is an answer to copy. A reader's own marker is the
     * screen's to remember until then.
     */
    revealedPlacements: z.array(placementSchema).nullable(),
    target: worldmapTargetSchema
  })
])

/**
 * A round two seats of two teams play head to head while the rest of the room
 * watches, asked for by the host one round at a time.
 */
export const roundDuelSchema = z.object({
  /** The two seats drawn, in `teamIds` order. */
  seatIds: z.tuple([playerIdSchema, playerIdSchema]),
  teamIds: z.tuple([teamIdSchema, teamIdSchema])
})

export const roundViewSchema = z.object({
  activeBuzz: activeBuzzSchema.nullable(),
  /**
   * Server time the reveal gives way to the next round, or `null` when nothing
   * is counting — the host advances by hand, or their screen is away and the
   * server has the room frozen. A server time rather than what is left of the
   * hold, for the reason `activeBuzz.expiresAt` is one: the wait is cancelled
   * and restarted along with the round, and a duration would have to be
   * re-sent on every snapshot to stay true.
   */
  advancesAt: serverTimeSchema.nullable(),
  /**
   * The answer mode this round was opened on. The room's setting can move while
   * the round runs and land on the next one, so a screen drawing *this* round
   * reads it here and never from `settings.mode`.
   */
  answerMode: answerModeSchema,
  /** Buzzer mode leaves this empty; the other two fill it as frames arrive. */
  answers: z.array(roundAnswerSchema),
  /** Points already granted this round, in the order the host granted them. */
  awards: z.array(awardSchema),
  content: roundContentSchema,
  /**
   * The two seats this round is a duel between, and `null` when everyone plays
   * it. Only those seats are stamped on the round.
   */
  duel: roundDuelSchema.nullable(),
  /**
   * How long the open phase runs, as it stood when the round opened, and `null`
   * for a game with no round clock. Read here for the reason `answerMode` is.
   */
  durationMs: z.number().int().positive().nullable(),
  id: roundIdSchema,
  /** 1-based, so it reads as "round 3 of 10" without arithmetic at the call site. */
  index: z.number().int().positive(),
  /**
   * Whether the reader took their seat after this round was under way. They are
   * in from the next one, and until then the screen owes them a wait rather
   * than an answer form: the server refuses everything they could send.
   *
   * Scoped to the reader, the way `yourVerdict` is — `false` for a host holding
   * no seat, because a console is never a latecomer to its own room.
   */
  joinedAfterStart: z.boolean(),
  /**
   * The line-up entry this round was opened from, stamped as it opens. Two
   * variants of one game share `content.kind`, so this is the only way a
   * screen arriving at a reveal can tell the next round was already drawn
   * (`settings.lineUpAt` moved off it) from a draw still owed.
   */
  lineUpAt: lineUpAtSchema,
  /**
   * Answered wrong this round — cannot buzz again until the next one, or until
   * the host reopens the field with `host.clearLockouts`.
   */
  lockedOutPlayerIds: z.array(playerIdSchema),
  /**
   * The seats this round opened on, stamped when its clip starts: the only
   * players it owes an answer to and waits for. `null` until then — the
   * countdown — when nobody who sits down is late yet.
   */
  openedWithPlayerIds: z.array(playerIdSchema).nullable(),
  /** Empty until the reveal, then what everyone said and whether it was right. */
  revealedAnswers: z.array(revealedAnswerSchema),
  /**
   * Server time the round opens on — the first note, or the question appearing.
   * Every client schedules against its own clock offset, which is what lands the
   * countdown on every device together.
   */
  startsAt: serverTimeSchema.nullable()
})

const baseRoomViewSchema = z.object({
  code: roomCodeSchema,
  /**
   * The host's browser is the room's speaker and its only judge, so its absence
   * is a fact the whole room needs rather than a detail of the connection. The
   * server freezes the round while this is `false`.
   */
  isHostConnected: z.boolean(),
  phase: roomPhaseSchema,
  players: z.array(publicPlayerSchema),
  round: roundViewSchema.nullable(),
  /**
   * Round time already consumed, buzz pauses excluded. It is what lets a host
   * who reloaded mid-round seek back to where the room actually is, rather than
   * restarting the track under everyone — and what every screen arms the round
   * clock from, so a device that locked itself comes back to the bar where the
   * room is rather than to a full one.
   */
  roundElapsedMs: z.number().int().nonnegative(),
  settings: roomSettingsSchema,
  /** Empty unless the room is drawn or chosen into teams. */
  teams: z.array(teamSchema),
  /**
   * What the reader has banked this round, and `null` before their first guess
   * or when they hold no seat. Typed mode takes as many guesses as the round
   * allows, so a player has to be told what they already hold — otherwise
   * "guess again" means guessing at what to guess at.
   *
   * Scoped to the reader on purpose. Everyone else's progress stays secret
   * until the reveal, the same way `revealedAnswers` does.
   *
   * The whole union rather than the blind test's halves, which is where the
   * second game corrected the first: a claim judged by the server in silence
   * needs this exactly as much as a pair of halves does. A player who has
   * already answered the question right and is not told so keeps typing, and
   * the refusal they eventually get says "you have had your go" — which reads
   * as a lockout rather than as a win.
   */
  yourVerdict: verdictSchema.nullable()
})

/**
 * The round as the one screen judging it sees it — the half no player may hold.
 * The answer goes `null` while the host holds a seat: that screen is a player's
 * then, and a payload it could read in a console is not a guarantee.
 *
 * The bare buzzer is the arm with nothing to withhold, which is the whole point
 * of it: no catalogue, no network call, and no licence to answer for.
 */
export const hostRoundContentSchema = z.discriminatedUnion('kind', [
  z.object({
    /**
     * What the speaker needs, which is not what the judge needs. A seated host
     * keeps this and loses `track`, so their own screen cannot hand them the
     * answer while it still plays the clip.
     *
     * The URL carries the catalogue's track id, which a console could resolve —
     * the same residual trade a remote mode would make, and the reason the seat
     * is offered rather than assumed.
     */
    audioUrl: z.url().nullable(),
    kind: z.literal('blindtest'),
    track: hostTrackSchema.nullable()
  }),
  z.object({ kind: z.literal('buzzer') }),
  /** Nothing to withhold: the server never learns who won until the host says. */
  z.object({ kind: z.literal('challenge') }),
  /**
   * Nothing at all, and on purpose: the console is a screen the room reads, so
   * who has pressed stays off it until the reveal like everywhere else.
   */
  z.object({ kind: z.literal('innerclock') }),
  z.object({
    kind: z.literal('matchsticks'),
    /**
     * Every move that answers the puzzle — a second one is not a wrong answer
     * — and `null` while the console holds a seat.
     */
    solutions: z.array(matchsticksSolutionSchema).nullable()
  }),
  z.object({
    kind: z.literal('quiz'),
    question: hostQuestionSchema.nullable()
  }),
  /**
   * The second arm with nothing, and the only one where nothing is not a
   * withholding: there is no answer anywhere in this game. The console reads
   * `flipsAt` off the round like every player does, because it is flipping the
   * same screen at the same moment.
   */
  z.object({ kind: z.literal('reflex') }),
  z.object({
    /**
     * The item on the wall, grouped, and `null` until the host closes one. It
     * only ever holds a closed item, which is the whole of the wall's privacy:
     * of an item still open this arm holds counts and the host's memo and not
     * one answer.
     *
     * One item rather than the whole pile because the wall shows one, and the
     * cursor is what moves: the next snapshot carries the next item.
     */
    correction: z
      .object({
        /** Who left this item empty. Shown, and never a group — a blank cannot be validated. */
        blankPlayerIds: z.array(playerIdSchema),
        groups: z.array(slateAnswerGroupSchema)
      })
      .nullable(),
    /**
     * Per item, how many sheets have something on it. A count, like
     * `progress`: it says an item is ready to close, never what it holds.
     */
    filledCounts: z.array(z.number().int().nonnegative()),
    /**
     * The host's memo per item, `null` where none was noted. Host-only until
     * the host reveals it on a closed item, which is when it joins
     * `round.content.revealedKeys` for every screen.
     */
    keys: z.array(z.string().nullable()),
    kind: z.literal('slate'),
    /** Every seated player's count of filled lines — *Julie 12/26*. */
    progress: z.array(slateProgressSchema)
  }),
  z.object({
    /** The events earliest first with their years, and `null` while the console holds a seat. */
    datedEvents: z.array(datedTimelineEventSchema).nullable(),
    kind: z.literal('timeline')
  }),
  /**
   * Nothing to withhold: the country is the question, and the markers stay off
   * every screen alike until the reveal.
   */
  z.object({ kind: z.literal('worldmap') })
])

/**
 * Adds everything a player must not see: the answer to the round in play, and
 * how much of the catalogue is left.
 */
export const hostRoomViewSchema = baseRoomViewSchema.extend({
  currentContent: hostRoundContentSchema.nullable(),
  /**
   * Whether a wall is showing the room. It is the speaker whenever it is
   * there, so this is what tells the console to keep the clip to itself.
   */
  isWallConnected: z.boolean(),
  remainingPoolSize: z.number().int().nonnegative(),
  /**
   * The seat this console took, and `null` while it is only running the room.
   * A player always has one, which is why theirs is not nullable — this is the
   * same fact for the screen that may or may not be playing too, and without it
   * a seated host cannot recognise itself in `answers` or `awards`.
   */
  youId: playerIdSchema.nullable()
})

export const playerRoomViewSchema = baseRoomViewSchema.extend({
  youId: playerIdSchema
})

/**
 * The room's own screen, and what it adds to a seatless player's view is only
 * what a wall has to show or play: the clip, and the slate's pile as it is
 * marked in front of everyone. Its own arm per game rather than the host's with
 * fields nulled, so an answer reaching it is a schema the encoder strips rather
 * than a projection somebody has to remember — `track`, `question` and the
 * slate's `keys` have no field here to land in.
 */
export const wallRoundContentSchema = z.discriminatedUnion('kind', [
  z.object({
    audioUrl: z.url().nullable(),
    kind: z.literal('blindtest')
  }),
  z.object({ kind: z.literal('buzzer') }),
  z.object({ kind: z.literal('challenge') }),
  z.object({ kind: z.literal('innerclock') }),
  z.object({ kind: z.literal('matchsticks') }),
  z.object({ kind: z.literal('quiz') }),
  z.object({ kind: z.literal('reflex') }),
  z.object({
    correction: z
      .object({
        blankPlayerIds: z.array(playerIdSchema),
        groups: z.array(slateAnswerGroupSchema)
      })
      .nullable(),
    filledCounts: z.array(z.number().int().nonnegative()),
    kind: z.literal('slate'),
    progress: z.array(slateProgressSchema)
  }),
  z.object({ kind: z.literal('timeline') }),
  z.object({ kind: z.literal('worldmap') })
])

export const wallRoomViewSchema = baseRoomViewSchema.extend({
  currentContent: wallRoundContentSchema.nullable()
})

export type RoomPhase = z.infer<typeof roomPhaseSchema>
export type PublicPlayer = z.infer<typeof publicPlayerSchema>
export type ActiveBuzz = z.infer<typeof activeBuzzSchema>
export type RoundContent = z.infer<typeof roundContentSchema>
export type HostRoundContent = z.infer<typeof hostRoundContentSchema>
export type RoundDuel = z.infer<typeof roundDuelSchema>
export type RoundView = z.infer<typeof roundViewSchema>
export type HostRoomView = z.infer<typeof hostRoomViewSchema>
export type PlayerRoomView = z.infer<typeof playerRoomViewSchema>
export type WallRoundContent = z.infer<typeof wallRoundContentSchema>
export type WallRoomView = z.infer<typeof wallRoomViewSchema>
