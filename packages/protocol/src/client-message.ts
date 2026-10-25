import { z } from 'zod'

import {
  challengeFinisherSchema,
  challengeHandSlotSchema,
  challengeTextSchema
} from './challenge'
import { guessNineCellSchema } from './guess-nine'
import {
  hostTokenSchema,
  nicknameSchema,
  playerIdSchema,
  roundIdSchema,
  sessionIdSchema
} from './identifiers'
import { innerclockTargetSecondsSchema } from './innerclock'
import { stickMoveSchema } from './matchsticks'
import { petitBacAnswerSchema, petitBacCategoryIndexSchema } from './petit-bac'
import { MAX_PLAYERS_PER_ROOM, roomSettingsSchema } from './room'
import { POINT, singleVerdictSchema, verdictSchema } from './scoring'
import {
  MAX_SLATE_ITEMS,
  slateAnswerSchema,
  slateItemIndexSchema,
  slateKeySchema
} from './slate'
import {
  MAX_TEAMS,
  MIN_TEAMS,
  scoreTargetSchema,
  teamIdSchema,
  teamNameSchema,
  teamVerdictSchema
} from './team'
import { timelineOrderSchema } from './timeline'
import { geoPointSchema } from './worldmap'

/**
 * `wall` is the room's own screen: it shows the game to everyone and holds no
 * secret, no control and no seat. A role of its own rather than a flag on the
 * host, so every check written for *the* host — who is present, who may send a
 * `host.*` frame, who a token claim displaces — already leaves it out.
 */
export const connectionRoles = ['host', 'player', 'wall'] as const
export const connectionRoleSchema = z.enum(connectionRoles)

/**
 * The first frame on every socket. `sessionId` is replayed from storage so a
 * reconnect reclaims the same seat and score; its absence means a new arrival.
 * A player must name themselves, a host must not.
 *
 * `hostToken` is the room's own secret, replayed the same way and read by the
 * server on a host claim — it is what takes the room back from a screen that
 * took it over — and on a wall, which is refused without it because it carries
 * the clip. A player frame carrying one is answering a question nobody asked.
 */
export const helloMessageSchema = z.object({
  hostToken: hostTokenSchema.optional(),
  nickname: nicknameSchema.optional(),
  protocolVersion: z.number().int().positive(),
  role: connectionRoleSchema,
  sessionId: sessionIdSchema.optional(),
  type: z.literal('hello')
})

/**
 * Half of the clock handshake. The client echoes its own send time back so it
 * can measure the round trip without the server having to remember anything —
 * see `@melee/core/time/clock-sync` for the estimator that consumes it.
 */
export const timePingMessageSchema = z.object({
  clientSentAt: z.number().int().nonnegative(),
  type: z.literal('time.ping')
})

/**
 * Carries no timestamp on purpose. Ordering is decided by when the frame
 * reaches the server, because anything the client says about "when" is both
 * clock-skewed and trivially forged.
 */
export const buzzMessageSchema = z.object({
  roundId: roundIdSchema,
  type: z.literal('player.buzz')
})

/**
 * Giving the seat up on purpose, which a closed socket cannot say on its own: a
 * device that locks its screen closes one too, and that seat has to survive.
 * Leaving is therefore something a player *says*, and it is what makes the
 * roster on the console true rather than eventually true.
 */
export const leaveMessageSchema = z.object({
  type: z.literal('player.leave')
})

/**
 * Changing the name a seat is already held under. The `hello` renames a
 * returning session on its own, but reaching it means reopening the socket —
 * so a screen would drop the round it is in the middle of to edit a label.
 *
 * Named for the seat rather than the role, like `player.leave`: the console
 * that took one renames itself with the same frame.
 */
export const renameMessageSchema = z.object({
  nickname: nicknameSchema,
  type: z.literal('player.rename')
})

/**
 * The other two modes' answer, and it carries no timestamp for the same reason
 * `player.buzz` does not: the server stamps arrival, because the speed bonus is
 * decided by exactly that field and a client-supplied "when" is both
 * clock-skewed and trivially edited in a console.
 */
export const answerMessageSchema = z.object({
  answer: z.discriminatedUnion('kind', [
    z.object({
      /** An index into `round.choices`, which the server shuffled. */
      choiceIndex: z.number().int().nonnegative(),
      kind: z.literal('choice')
    }),
    z.object({
      /**
       * One claim, graded against the title and the artist independently —
       * whichever it matches is banked. Two fields asked a player to know which
       * half they were holding before they could say it, and a typed round is
       * won by firing the moment something surfaces.
       */
      guess: z.string().min(1).max(120),
      kind: z.literal('typed')
    }),
    z.object({
      kind: z.literal('point'),
      /** Where the marker was confirmed. One shot, like a pick. */
      point: geoPointSchema
    }),
    z.object({
      /** Every event of the round, earliest first. One shot, like a pick. */
      eventIds: timelineOrderSchema,
      kind: z.literal('order')
    }),
    z.object({
      kind: z.literal('move'),
      /**
       * One stick of the puzzle picked up and put down. One shot, like a pick;
       * a move the sticks cannot make is refused and spends nothing.
       */
      move: stickMoveSchema
    })
  ]),
  roundId: roundIdSchema,
  type: z.literal('player.answer')
})

/**
 * A seat joining a team, or switching to another — in the lobby of a room whose
 * teams are `chosen`, which is the one place a seat decides its own team. A
 * seat that arrived after the start and holds none yet may pick once.
 */
export const chooseTeamMessageSchema = z.object({
  teamId: teamIdSchema,
  type: z.literal('player.chooseTeam')
})

/**
 * A seat saying it is back at the table, or taking that back, between two
 * rounds. A press on its own screen rather than anything the server infers,
 * because a phone that is connected is not a guest who has sat down again.
 */
export const readyMessageSchema = z.object({
  isReady: z.boolean(),
  type: z.literal('player.ready')
})

/**
 * One line of the slate, saved on its own as it is written — an upsert, and an
 * empty `answer` takes the line back. One line per frame rather than the whole
 * sheet, so two screens of one player cannot overwrite each other's other
 * lines, and a frame lost to a blink costs one answer rather than all of them.
 *
 * In the game's namespace rather than `player.*`, because nothing else on the
 * shelf writes a sheet: every `player.*` frame names something the shell does.
 */
export const writeSlateLineMessageSchema = z.object({
  answer: slateAnswerSchema,
  itemIndex: slateItemIndexSchema,
  roundId: roundIdSchema,
  type: z.literal('slate.write')
})

/**
 * The keeper of a spoken guess-nine round ticking what the guessing team said,
 * or taking back a mistaken tick. The black word is ticked once and for good:
 * it cuts the round and voids it, so the screen asks twice before sending it.
 *
 * In the game's namespace, like `slate.write`: nothing else on the shelf has a
 * seat keeping somebody else's list.
 */
export const tickGuessNineMessageSchema = z.object({
  cell: z.union([guessNineCellSchema, z.literal('blackWord')]),
  isTicked: z.boolean(),
  roundId: roundIdSchema,
  type: z.literal('guessnine.tick')
})

/**
 * One line of a Petit Bac sheet, saved as it is written — the slate's upsert,
 * an empty `answer` taking the line back.
 */
export const writePetitBacLineMessageSchema = z.object({
  answer: petitBacAnswerSchema,
  categoryIndex: petitBacCategoryIndexSchema,
  roundId: roundIdSchema,
  type: z.literal('petitbac.write')
})

/** A full sheet closing everyone's, `PETIT_BAC_STOP_GRACE_MS` later. */
export const stopPetitBacMessageSchema = z.object({
  roundId: roundIdSchema,
  type: z.literal('petitbac.stop')
})

/**
 * A seat refusing a row of the category in play, or taking a refusal back.
 * `categoryIndex` guards against a tap landing after the room moved on.
 */
export const votePetitBacMessageSchema = z.object({
  categoryIndex: petitBacCategoryIndexSchema,
  refuses: z.boolean(),
  roundId: roundIdSchema,
  rowKey: z.string().min(1),
  type: z.literal('petitbac.vote')
})

/** A seat saying it has read the category in play; once every seat has, the room moves on. */
export const finishPetitBacVoteMessageSchema = z.object({
  categoryIndex: petitBacCategoryIndexSchema,
  roundId: roundIdSchema,
  type: z.literal('petitbac.doneVoting')
})

export const updateSettingsMessageSchema = z.object({
  settings: roomSettingsSchema,
  type: z.literal('host.updateSettings')
})

/**
 * `slateKeys` is the answer key a host typed before the evening, kept on their
 * own machine because the settings reach every player. It rides the press that
 * opens the sheet, so the round never exists without it and a console that
 * reloads mid-game has nothing to send again. Ignored by every other game.
 *
 * `challengeText` is what a challenge round asks the table to do, typed on the
 * console as it is launched; absent or empty, the round opens on the line of
 * the hand at `challengeAt` (`challengeHand`, the first by default), or on
 * none at all when `isChallengeSaidAloud` — the host announces it and the
 * wall shows the game alone. Ignored by every other game.
 *
 * `innerclockTargetSeconds` is how long an inner clock round asks the table to
 * count; absent, the server draws one. Ignored by every other game.
 */
export const startRoundMessageSchema = z.object({
  challengeAt: challengeHandSlotSchema.optional(),
  challengeText: challengeTextSchema.optional(),
  innerclockTargetSeconds: innerclockTargetSecondsSchema.optional(),
  isChallengeSaidAloud: z.boolean().optional(),
  slateKeys: z.array(slateKeySchema.nullable()).max(MAX_SLATE_ITEMS).optional(),
  type: z.literal('host.startRound')
})

/** Settles the Petit Bac category in play and puts up the next, or the reveal after the last. */
export const nextCategoryMessageSchema = z.object({
  categoryIndex: petitBacCategoryIndexSchema,
  roundId: roundIdSchema,
  type: z.literal('host.nextCategory')
})

/** The judge's own refusal of a row, in a room with one — where the seats only watch. */
export const refuseRowMessageSchema = z.object({
  categoryIndex: petitBacCategoryIndexSchema,
  refuses: z.boolean(),
  roundId: roundIdSchema,
  rowKey: z.string().min(1),
  type: z.literal('host.refuseRow')
})

/** Judging is the host's call; `roundId` guards against a late click on a round that already moved on. */
export const judgeMessageSchema = z.object({
  playerId: playerIdSchema,
  roundId: roundIdSchema,
  type: z.literal('host.judge'),
  verdict: verdictSchema
})

export const revealMessageSchema = z.object({
  roundId: roundIdSchema,
  type: z.literal('host.reveal')
})

/**
 * Everyone who was sat out is back in, mid-round. A blind test round is a clip
 * that runs out, so a lockout there expires on its own; a host running a charade
 * has no such clock, and a table where the three quickest players have already
 * missed is a round nobody can win.
 */
export const clearLockoutsMessageSchema = z.object({
  roundId: roundIdSchema,
  type: z.literal('host.clearLockouts')
})

/**
 * One more thing to guess on the slate, while the sheets are open. A host who
 * brings the cups one at a time opens on one item and adds as they go.
 */
export const addItemMessageSchema = z.object({
  roundId: roundIdSchema,
  type: z.literal('host.addItem')
})

/** The host's memo for one item; empty clears it. It reaches no player frame, ever. */
export const setItemKeyMessageSchema = z.object({
  itemIndex: slateItemIndexSchema,
  key: slateKeySchema,
  roundId: roundIdSchema,
  type: z.literal('host.setItemKey')
})

/**
 * The host's key for one closed item goes up big on the wall and onto every
 * sheet. Only a closed item: nobody can still write an answer it would give
 * away.
 */
export const revealItemKeyMessageSchema = z.object({
  itemIndex: slateItemIndexSchema,
  roundId: roundIdSchema,
  type: z.literal('host.revealItemKey')
})

/**
 * One item of the slate goes read-only on every sheet and onto the wall, while
 * every other item stays open for writing — the host marks what the room has
 * finished with, not the whole sheet at once.
 */
export const closeItemMessageSchema = z.object({
  itemIndex: slateItemIndexSchema,
  roundId: roundIdSchema,
  type: z.literal('host.closeItem')
})

/** Every item still open closes at once, and the wall moves to the first of them. */
export const collectSheetsMessageSchema = z.object({
  roundId: roundIdSchema,
  type: z.literal('host.collectSheets')
})

/** Moves the wall to one closed item — forward, or back to change a verdict already given. */
export const showItemMessageSchema = z.object({
  itemIndex: slateItemIndexSchema,
  roundId: roundIdSchema,
  type: z.literal('host.showItem')
})

/**
 * A verdict over every player who wrote the same thing on the item on the wall.
 * Its own frame rather than `host.judge`, which names one player on the floor
 * and ends in a lockout or a reveal: this names a group, pays or unpays it on
 * the spot, and can be taken back. `itemIndex` guards a late tap the way
 * `roundId` does — it must be the item on the wall.
 */
export const judgeGroupMessageSchema = z.object({
  groupKey: z.string().min(1),
  itemIndex: slateItemIndexSchema,
  roundId: roundIdSchema,
  type: z.literal('host.judgeGroup'),
  verdict: singleVerdictSchema
})

/**
 * The whole deal, one list of seats per team in team order. The console
 * shuffles and the server checks — a partition of the seats into teams whose
 * sizes differ by one at most — so re-drawing is sending another. Lobby only.
 */
export const drawTeamsMessageSchema = z.object({
  assignment: z.array(z.array(playerIdSchema)).min(MIN_TEAMS).max(MAX_TEAMS),
  type: z.literal('host.drawTeams')
})

export const renameTeamMessageSchema = z.object({
  name: teamNameSchema,
  teamId: teamIdSchema,
  type: z.literal('host.renameTeam')
})

/** One seat to another team, in any phase: once the game is under way, it is the only way a team changes. */
export const moveSeatMessageSchema = z.object({
  playerId: playerIdSchema,
  teamId: teamIdSchema,
  type: z.literal('host.moveSeat')
})

/**
 * Points granted or taken by hand, for an answer given aloud or a call the
 * rules got wrong. A seat's adjustment stays on the seat: a team is paid by
 * its rounds and by its own adjustments, never by a seat's.
 */
export const adjustScoreMessageSchema = z.object({
  /** In the board's units, a thousand to the point; negative takes back, never below zero. */
  points: z
    .number()
    .int()
    .min(-100 * POINT)
    .max(100 * POINT),
  target: scoreTargetSchema,
  type: z.literal('host.adjustScore')
})

/**
 * Who finished a challenge where, from the host's word — the server never sees
 * the table. The whole placement each time rather than one finisher per frame,
 * so a placement changed before the reveal replaces the last one instead of
 * adding to it. Ends the round on its reveal.
 */
export const awardPlacesMessageSchema = z.object({
  places: z.array(challengeFinisherSchema).max(MAX_PLAYERS_PER_ROOM),
  roundId: roundIdSchema,
  type: z.literal('host.awardPlaces')
})

/**
 * Which teams had it, from the host's word in a room played aloud — the server
 * hears none of the table. The whole round each time, like `host.awardPlaces`,
 * so a frame sent on the reveal corrects the one before it rather than adding
 * to it. A team left out had nothing. Ends the round on its reveal.
 */
export const awardTeamsMessageSchema = z.object({
  roundId: roundIdSchema,
  type: z.literal('host.awardTeams'),
  verdicts: z.array(teamVerdictSchema).max(MAX_TEAMS)
})

export const nextRoundMessageSchema = z.object({
  /** The next round's line of the hand, when it is a challenge — as on `host.startRound`. */
  challengeAt: challengeHandSlotSchema.optional(),
  /** The next round's challenge, when it is one — as on `host.startRound`. */
  challengeText: challengeTextSchema.optional(),
  /** The next round's count, when it is one — as on `host.startRound`. */
  innerclockTargetSeconds: innerclockTargetSecondsSchema.optional(),
  /** The next round's challenge is announced aloud — as on `host.startRound`. */
  isChallengeSaidAloud: z.boolean().optional(),
  /**
   * Asks for the next round to be a duel: one seat from each of two teams,
   * drawn so every seat duels before any duels twice. Absent, everyone plays
   * it — a duel is asked for one round at a time, so the reveal hold never
   * opens one.
   */
  isDuel: z.boolean().optional(),
  type: z.literal('host.nextRound')
})

/**
 * Asks for another ready-made line in place of the hand's line at `at` (the
 * first by default) — the die beside it. The line it drops is not played.
 * Refused outside a challenge game.
 */
export const redealChallengeMessageSchema = z.object({
  at: challengeHandSlotSchema.optional(),
  type: z.literal('host.redealChallenge')
})

export const endGameMessageSchema = z.object({
  type: z.literal('host.endGame')
})

/**
 * Back to the lobby with the same players in the same seats and the scores at
 * zero. Distinct from `host.endGame` because keeping the room is the entire
 * point: making everyone re-scan is what ends an evening after one game.
 */
export const playAgainMessageSchema = z.object({
  type: z.literal('host.playAgain')
})

export const removePlayerMessageSchema = z.object({
  playerId: playerIdSchema,
  type: z.literal('host.removePlayer')
})

/**
 * The room is gone and everyone is out, which is the one exit `host.endGame`
 * deliberately is not. Irreversible: the code stops resolving, so the players
 * who scanned it cannot come back to it even by reloading.
 */
export const closeRoomMessageSchema = z.object({
  type: z.literal('host.closeRoom')
})

/**
 * The room's screen let go: every wall is sent a fatal `wall_dismissed` and the
 * console is the speaker again. The token is not rotated — the wall is the
 * host's own screen, and a fatal frame is what stops it reconnecting.
 */
export const dismissWallMessageSchema = z.object({
  type: z.literal('host.dismissWall')
})

/**
 * What a host socket may send. Splitting the union by role means a player
 * screen cannot even construct `host.judge` — the server still enforces it,
 * because a socket is whatever its owner makes it, but the client code gets the
 * rule for free.
 */
export const hostClientMessageSchema = z.discriminatedUnion('type', [
  helloMessageSchema,
  timePingMessageSchema,
  updateSettingsMessageSchema,
  startRoundMessageSchema,
  judgeMessageSchema,
  revealMessageSchema,
  clearLockoutsMessageSchema,
  addItemMessageSchema,
  setItemKeyMessageSchema,
  revealItemKeyMessageSchema,
  closeItemMessageSchema,
  collectSheetsMessageSchema,
  showItemMessageSchema,
  judgeGroupMessageSchema,
  nextCategoryMessageSchema,
  refuseRowMessageSchema,
  drawTeamsMessageSchema,
  renameTeamMessageSchema,
  moveSeatMessageSchema,
  adjustScoreMessageSchema,
  awardPlacesMessageSchema,
  awardTeamsMessageSchema,
  redealChallengeMessageSchema,
  nextRoundMessageSchema,
  endGameMessageSchema,
  playAgainMessageSchema,
  removePlayerMessageSchema,
  closeRoomMessageSchema,
  dismissWallMessageSchema
])

export const playerClientMessageSchema = z.discriminatedUnion('type', [
  helloMessageSchema,
  timePingMessageSchema,
  leaveMessageSchema,
  renameMessageSchema,
  chooseTeamMessageSchema,
  readyMessageSchema,
  buzzMessageSchema,
  answerMessageSchema,
  writeSlateLineMessageSchema,
  tickGuessNineMessageSchema,
  writePetitBacLineMessageSchema,
  stopPetitBacMessageSchema,
  votePetitBacMessageSchema,
  finishPetitBacVoteMessageSchema
])

/** A wall says who it is and keeps its clock. It never controls the room, nor answers. */
export const wallClientMessageSchema = z.discriminatedUnion('type', [
  helloMessageSchema,
  timePingMessageSchema
])

/** Everything the server's decoder accepts, before it knows which role sent it. */
export const clientMessageSchema = z.discriminatedUnion('type', [
  helloMessageSchema,
  timePingMessageSchema,
  leaveMessageSchema,
  renameMessageSchema,
  chooseTeamMessageSchema,
  readyMessageSchema,
  buzzMessageSchema,
  answerMessageSchema,
  writeSlateLineMessageSchema,
  tickGuessNineMessageSchema,
  writePetitBacLineMessageSchema,
  stopPetitBacMessageSchema,
  votePetitBacMessageSchema,
  finishPetitBacVoteMessageSchema,
  updateSettingsMessageSchema,
  startRoundMessageSchema,
  judgeMessageSchema,
  revealMessageSchema,
  clearLockoutsMessageSchema,
  addItemMessageSchema,
  setItemKeyMessageSchema,
  revealItemKeyMessageSchema,
  closeItemMessageSchema,
  collectSheetsMessageSchema,
  showItemMessageSchema,
  judgeGroupMessageSchema,
  nextCategoryMessageSchema,
  refuseRowMessageSchema,
  drawTeamsMessageSchema,
  renameTeamMessageSchema,
  moveSeatMessageSchema,
  adjustScoreMessageSchema,
  awardPlacesMessageSchema,
  awardTeamsMessageSchema,
  redealChallengeMessageSchema,
  nextRoundMessageSchema,
  endGameMessageSchema,
  playAgainMessageSchema,
  removePlayerMessageSchema,
  closeRoomMessageSchema,
  dismissWallMessageSchema
])

export type ConnectionRole = z.infer<typeof connectionRoleSchema>
export type HelloMessage = z.infer<typeof helloMessageSchema>
export type HostClientMessage = z.infer<typeof hostClientMessageSchema>
export type PlayerClientMessage = z.infer<typeof playerClientMessageSchema>
export type WallClientMessage = z.infer<typeof wallClientMessageSchema>
export type ClientMessage = z.infer<typeof clientMessageSchema>
export type ClientMessageType = ClientMessage['type']
export type ScoreTarget = z.infer<typeof adjustScoreMessageSchema>['target']

/**
 * Kept next to the union it partitions: the server checks this before acting,
 * since nothing stops a player's socket from sending a host frame by hand.
 */
export const HOST_ONLY_MESSAGE_TYPES = new Set<ClientMessageType>([
  'host.updateSettings',
  'host.startRound',
  'host.judge',
  'host.reveal',
  'host.clearLockouts',
  'host.addItem',
  'host.setItemKey',
  'host.revealItemKey',
  'host.closeItem',
  'host.collectSheets',
  'host.showItem',
  'host.judgeGroup',
  'host.nextCategory',
  'host.refuseRow',
  'host.drawTeams',
  'host.renameTeam',
  'host.moveSeat',
  'host.adjustScore',
  'host.awardPlaces',
  'host.awardTeams',
  'host.redealChallenge',
  'host.nextRound',
  'host.endGame',
  'host.playAgain',
  'host.removePlayer',
  'host.closeRoom',
  'host.dismissWall'
])

/**
 * The frames that move a round along from the floor, partitioned out for the
 * one gate that has to refuse both at once: a room whose console is gone is
 * frozen, and a freeze the floor can still fill in is not one. The seat frames
 * — `player.leave`, `player.rename` — are deliberately not here, because
 * leaving a room nobody is running is exactly what a player should still be
 * allowed to do.
 *
 * `slate.write` is not here either: a line on a sheet moves nothing along —
 * only the host closes an item — and refusing a save over a console's Wi-Fi blink
 * would lose an answer the player believes is kept. `petitbac.write` is not
 * here for the same reason: its clock is frozen with the room, and a word
 * kept is worth more than the seconds it was written in.
 */
export const FLOOR_MESSAGE_TYPES = new Set<ClientMessageType>([
  'player.buzz',
  'player.answer',
  'guessnine.tick',
  'petitbac.stop',
  'petitbac.vote',
  'petitbac.doneVoting'
])
