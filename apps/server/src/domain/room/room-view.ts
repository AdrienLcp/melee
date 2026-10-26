import type { AtlasTarget } from '@melee/protocol/atlas'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { PetitBacProgress } from '@melee/protocol/petit-bac'
import type {
  HostRoomView,
  HostRoundContent,
  PlayerRoomView,
  PublicPlayer,
  RoundContent,
  RoundView,
  WallRoomView,
  WallRoundContent
} from '@melee/protocol/room'
import type { Verdict } from '@melee/protocol/scoring'
import type { SlateLine } from '@melee/protocol/slate'
import type { HostTrack, TrackIdentity } from '@melee/protocol/track'

import { playedPerEntry } from '@melee/core/room/next-game'
import { isBlankAnswer } from '@melee/core/round/answer-groups'
import { hasJoinedAfterStart } from '@melee/core/round/round-roster'
import { pointsFor } from '@melee/core/scoring/verdict'
import {
  filledCountsPerItem,
  filledLineCount,
  itemVerdictFor,
  lineVerdict,
  slateItemStateOf
} from '@melee/core/slate/sheet-marking'
import { earliestFirst } from '@melee/core/timeline/deal'

import {
  blackSquareContentView,
  blackSquareGrid
} from '@/domain/round/black-square-round'
import {
  canCancelPetitBacStop,
  petitBacLinesFor,
  petitBacRowsFor,
  votingCategoryIndex
} from '@/domain/round/petit-bac-round'
import { elapsedRoundMs, flipsAtOf } from '@/domain/round/round-service'
import { answerGroupsFor, blankPlayerIdsFor } from '@/domain/round/slate-round'

import { isRoundJudgedByConsole, playingSeatIds } from './console-seat'
import type { AtlasRoundTarget, PlayerAttempts, Room, Round } from './room'
import { toSeatBoards, toTeamViews } from './team-service'

/**
 * The single seam between the server's model and the wire. Everything secret —
 * session ids, the pool, the track being played — is dropped here, and the
 * three projections are the reason `HostTrack` cannot reach a player or a wall
 * by accident.
 */
export const toHostView = ({
  isHostConnected,
  isWallConnected,
  now,
  room,
  seatId
}: {
  isHostConnected: boolean
  isWallConnected: boolean
  now: number
  room: Room
  /** The seat this host took, if they took one — they then read what a player reads. */
  seatId: PlayerId | null
}): HostRoomView => {
  const playingSeatId = isRoundJudgedByConsole(room) ? null : seatId

  return {
    ...toBaseView({
      isHostConnected,
      isWallConnected,
      now,
      room,
      youId: seatId
    }),
    challengeHand: (room.challengeHand ?? []).map(({ labels }) => labels),
    currentContent:
      room.round === null
        ? null
        : toHostContent({ room, round: room.round, seatId: playingSeatId }),
    lineUpPlayed: playedPerEntry({
      lineUp: room.settings.lineUp,
      opened: room.openedEntries
    }),
    remainingPoolSize: room.trackPool.length,
    youId: seatId
  }
}

/**
 * What the room's own screen reads: a seatless player's view, plus the clip it
 * plays and the slate pile it shows being marked. Every field is named, from
 * the host's content, so an answer added to that arm later reaches the wall
 * only by somebody writing it here.
 */
export const toWallView = ({
  isHostConnected,
  now,
  room
}: {
  isHostConnected: boolean
  now: number
  room: Room
}): WallRoomView => ({
  ...toBaseView({
    isHostConnected,
    isWallConnected: true,
    now,
    room,
    youId: null
  }),
  currentContent:
    room.round === null
      ? null
      : toWallContent(toHostContent({ room, round: room.round, seatId: null })),
  yourVerdict: null
})

const toWallContent = (content: HostRoundContent): WallRoundContent => {
  switch (content.kind) {
    case 'blindtest': {
      return { audioUrl: content.audioUrl, kind: 'blindtest' }
    }

    case 'petitbac': {
      return { kind: 'petitbac', progress: content.progress }
    }

    case 'slate': {
      return {
        correction: content.correction,
        filledCounts: content.filledCounts,
        kind: 'slate',
        progress: content.progress
      }
    }

    default: {
      return { kind: content.kind }
    }
  }
}

/**
 * A seated host reads what a player reads. The blind test keeps `audioUrl`
 * because that screen is still the room's speaker; a quiz has no such second
 * copy — the prompt everyone can see is already on the round — so the seat
 * takes the whole question and leaves nothing behind.
 */
const toHostContent = ({
  room,
  round,
  seatId
}: {
  room: Room
  round: Round
  seatId: PlayerId | null
}): HostRoundContent => {
  const content = round.content

  if (content.kind === 'buzzer') {
    return { kind: 'buzzer' }
  }

  if (content.kind === 'quiz') {
    return {
      kind: 'quiz',
      question: seatId === null ? content.question : null
    }
  }

  if (content.kind === 'matchsticks') {
    return {
      kind: 'matchsticks',
      solutions: seatId === null ? content.solutions : null
    }
  }

  if (content.kind === 'blacksquare') {
    return {
      grid: seatId === null ? blackSquareGrid(content.theme) : null,
      kind: 'blacksquare'
    }
  }

  if (content.kind === 'timeline') {
    return {
      datedEvents: seatId === null ? earliestFirst(content.events) : null,
      kind: 'timeline'
    }
  }

  if (content.kind === 'atlas') {
    return {
      answer:
        content.naming !== null && seatId === null
          ? atlasTargetView({ isRevealed: true, target: content.target })
          : null,
      kind: 'atlas'
    }
  }

  if (
    content.kind === 'challenge' ||
    content.kind === 'innerclock' ||
    content.kind === 'reflex'
  ) {
    return { kind: content.kind }
  }

  if (content.kind === 'slate') {
    return toHostSlateContent({ content, room })
  }

  if (content.kind === 'petitbac') {
    return {
      canCancelStop: canCancelPetitBacStop({ content, room }),
      kind: 'petitbac',
      progress: petitBacProgress({ content, room, round })
    }
  }

  return {
    audioUrl: content.track.previewUrl,
    kind: 'blindtest',
    track: seatId === null ? content.track : null
  }
}

/**
 * The wall's half of the slate. Of an item still open it is counts and the
 * host's own memo — not one answer, because everyone is looking at it.
 */
const toHostSlateContent = ({
  content,
  room
}: {
  content: Extract<Round['content'], { kind: 'slate' }>
  room: Room
}): HostRoundContent => {
  const itemIndex = content.currentItemIndex
  const item = itemIndex === null ? undefined : content.items[itemIndex]

  return {
    correction:
      itemIndex === null || item?.state !== 'closed'
        ? null
        : {
            blankPlayerIds: blankPlayerIdsFor({ itemIndex, room }),
            groups: answerGroupsFor({ itemIndex, room }).map((group) => ({
              isCorrect: lineVerdict({
                answer: group.text,
                marking: item.marking
              }),
              key: group.key,
              playerIds: group.playerIds,
              text: group.text
            }))
          },
    filledCounts: filledCountsPerItem({
      itemCount: content.items.length,
      sheets: [...playingSeatIds(room)].map(
        (playerId) => content.sheets.get(playerId) ?? new Map()
      )
    }),
    keys: content.items.map((_, index) => content.keys.get(index) ?? null),
    kind: 'slate',
    progress: [...playingSeatIds(room)].map((playerId) => ({
      filledCount: filledLineCount(content.sheets.get(playerId) ?? new Map()),
      playerId
    }))
  }
}

export const toPlayerView = ({
  isHostConnected,
  isWallConnected,
  now,
  room,
  youId
}: {
  isHostConnected: boolean
  isWallConnected: boolean
  now: number
  room: Room
  youId: PlayerId
}): PlayerRoomView => ({
  ...toBaseView({ isHostConnected, isWallConnected, now, room, youId }),
  youId
})

const toBaseView = ({
  isHostConnected,
  isWallConnected,
  now,
  room,
  youId
}: {
  isHostConnected: boolean
  isWallConnected: boolean
  /** The time the frame carrying this view is stamped with. */
  now: number
  room: Room
  youId: PlayerId | null
}) => ({
  code: room.code,
  isHostConnected,
  isWallConnected,
  phase: room.phase,
  players: toPublicPlayers(room),
  round:
    room.round === null
      ? null
      : toRoundView({ room, round: room.round, youId }),
  roundElapsedMs: room.round === null ? 0 : elapsedRoundMs(room.round, now),
  settings: room.settings,
  teams: toTeamViews(room),
  yourVerdict:
    youId === null || room.round === null
      ? null
      : yourVerdictIn({ round: room.round, youId })
})

/**
 * What the reader has banked, except a matchstick move before the reveal: the
 * move is one shot, so the verdict helps its seat with nothing, and a seat told
 * it was right has an answer worth whispering to the next one.
 */
const yourVerdictIn = ({
  round,
  youId
}: {
  round: Round
  youId: PlayerId
}): Verdict | null =>
  round.content.kind === 'matchsticks' && !round.revealed
    ? null
    : (round.attempts.find((entry) => entry.playerId === youId)?.verdict ??
      null)

const toPublicPlayers = (room: Room): PublicPlayer[] => {
  const seatBoards = toSeatBoards(room)

  return [...room.players.values()].map((participant) => ({
    board: seatBoards.get(participant.id) ?? null,
    id: participant.id,
    isConnected: participant.isConnected,
    isReady: participant.isReady,
    nickname: participant.nickname,
    score: participant.score
  }))
}

/**
 * `correctChoiceIndex` is absent from this object, and that absence is the
 * whole anti-cheat story for choice mode. Spreading the round here instead of
 * naming its fields would ship it — `codec.test.ts` is the net under that, and
 * this is the floor above it.
 */
const toRoundView = ({
  room,
  round,
  youId
}: {
  room: Room
  round: Round
  youId: PlayerId | null
}): RoundView => ({
  activeBuzz:
    round.activeBuzz === null
      ? null
      : {
          atServerTime: round.activeBuzz.atServerTime,
          expiresAt: round.activeBuzz.expiresAt,
          playerId: round.activeBuzz.playerId
        },
  advancesAt: round.advancesAt,
  answerMode: round.mode.kind,
  answers: round.attempts.map(({ firstGuessedAt, playerId }) => ({
    atServerTime: firstGuessedAt,
    playerId
  })),
  awards: round.awards,
  content: toContentView({ room, round, youId }),
  duel: round.duel,
  durationMs: round.durationMs,
  id: round.id,
  index: round.index,
  joinedAfterStart:
    youId !== null &&
    hasJoinedAfterStart({
      openedWithPlayerIds: round.openedWithPlayerIds,
      playerId: youId
    }),
  lineUpAt: round.lineUpAt,
  lockedOutPlayerIds: [...round.lockedOutPlayerIds],
  openedWithPlayerIds:
    round.openedWithPlayerIds === null ? null : [...round.openedWithPlayerIds],
  revealedAnswers: round.revealed
    ? round.attempts.map((attempts) => ({
        atServerTime: attempts.firstGuessedAt,
        isCorrect: pointsFor(attempts.verdict) > 0,
        playerId: attempts.playerId,
        said: saidBy(attempts)
      }))
    : [],
  startsAt: round.startsAt
})

/**
 * What they got, or their last miss when they got nothing — a name on the
 * reveal with nothing beside it reads as a bug rather than as a player who
 * tried.
 */
const saidBy = (attempts: PlayerAttempts): string =>
  attempts.landed.length > 0
    ? attempts.landed.join(' · ')
    : (attempts.lastMiss ?? '')

/** A map round's target as a screen may hold it: where it stands, and whose capital it is, only once it is revealed. */
const atlasTargetView = ({
  isRevealed,
  target
}: {
  isRevealed: boolean
  target: AtlasRoundTarget
}): AtlasTarget => {
  switch (target.kind) {
    case 'country':
      return target
    case 'city':
      return {
        kind: 'city',
        name: target.name,
        point: isRevealed ? { ...target.point } : null
      }
    case 'capital':
      return {
        countryCode: isRevealed ? target.countryCode : null,
        kind: 'capital',
        names: { en: target.names.en, fr: target.names.fr },
        point: isRevealed ? { ...target.point } : null
      }
  }
}

const toContentView = ({
  room,
  round,
  youId
}: {
  room: Room
  round: Round
  youId: PlayerId | null
}): RoundContent => {
  const content = round.content

  if (content.kind === 'buzzer') {
    return { kind: 'buzzer' }
  }

  if (content.kind === 'challenge') {
    return { kind: 'challenge', labels: content.labels }
  }

  if (content.kind === 'innerclock') {
    return {
      hasPressed:
        youId !== null &&
        content.presses.some((press) => press.playerId === youId),
      kind: 'innerclock',
      revealedPresses: round.revealed ? [...content.presses] : null,
      targetSeconds: content.targetSeconds
    }
  }

  if (content.kind === 'matchsticks') {
    return {
      kind: 'matchsticks',
      puzzle: content.puzzle,
      revealedMoves: round.revealed
        ? content.moves.map(({ glyphs, move, playerId }) => ({
            glyphs,
            move,
            playerId
          }))
        : null,
      revealedSolution: round.revealed ? (content.solutions[0] ?? null) : null,
      yourMove:
        content.moves.find(({ playerId }) => playerId === youId)?.move ?? null
    }
  }

  if (content.kind === 'quiz') {
    const { answer, category, flag, id, note, prompt, rebus } = content.question

    return {
      choices: content.choices,
      kind: 'quiz',
      prompt: { category, flag, id, prompt, rebus },
      revealedQuestion: round.revealed ? { answer, note } : null
    }
  }

  // Nothing is withheld until the reveal, which is this game alone: the presses
  // are the tension of the round rather than a leak, and the moment the screen
  // flips is public by design.
  if (content.kind === 'reflex') {
    return {
      flipsAt: flipsAtOf(round),
      kind: 'reflex',
      presses: [...content.presses]
    }
  }

  if (content.kind === 'blacksquare') {
    return blackSquareContentView({ content, room, round, youId })
  }

  if (content.kind === 'timeline') {
    return {
      events: content.events.map(({ id, labels }) => ({
        id,
        labels: { ...labels }
      })),
      kind: 'timeline',
      revealedEvents: round.revealed
        ? earliestFirst(content.events).map(({ id, labels, year }) => ({
            id,
            labels: { ...labels },
            year
          }))
        : null
    }
  }

  if (content.kind === 'atlas') {
    const { naming, target } = content

    return {
      choices: (naming?.choices ?? []).map(({ en, fr }) => ({ en, fr })),
      direction: naming === null ? 'place' : 'name',
      kind: 'atlas',
      revealedPlacements: round.revealed
        ? content.placements.map(({ playerId, point }) => ({
            playerId,
            point: { latitude: point.latitude, longitude: point.longitude }
          }))
        : null,
      shown:
        naming === null
          ? null
          : {
              kind: target.kind,
              point: {
                latitude: naming.shown.latitude,
                longitude: naming.shown.longitude
              }
            },
      target:
        naming !== null && !round.revealed
          ? null
          : atlasTargetView({ isRevealed: round.revealed, target })
    }
  }

  if (content.kind === 'petitbac') {
    return petitBacContentView({ content, room, round, youId })
  }

  if (content.kind === 'slate') {
    return {
      currentItemIndex: content.currentItemIndex,
      itemCount: content.items.length,
      itemStates: content.items.map(slateItemStateOf),
      kind: 'slate',
      revealedKeys: content.items.map((_, index) =>
        content.revealedKeyIndexes.has(index)
          ? (content.keys.get(index) ?? null)
          : null
      ),
      yourSheet: youId === null ? null : toSlateSheet({ content, youId })
    }
  }

  return {
    choices: content.choices,
    kind: 'blindtest',
    revealedTrack: round.revealed ? toTrackIdentity(content.track) : null
  }
}

type PetitBacContent = Extract<Round['content'], { kind: 'petitbac' }>

/** How many lines each seat has filled, and never what: the wall and the console read the same. */
const petitBacProgress = ({
  content,
  room,
  round
}: {
  content: PetitBacContent
  room: Room
  round: Round
}): PetitBacProgress[] =>
  [...room.players.keys()]
    .filter(
      (playerId) =>
        !hasJoinedAfterStart({
          openedWithPlayerIds: round.openedWithPlayerIds,
          playerId
        })
    )
    .map((playerId) => ({
      filled: content.categories.filter(
        (_, index) =>
          !isBlankAnswer(content.sheets.get(playerId)?.get(index) ?? null)
      ).length,
      playerId
    }))

/**
 * A seat's own sheet and nothing of anybody else's until the vote: a
 * category's rows reach every screen once it is voted, and its lines once it
 * has settled.
 */
const petitBacContentView = ({
  content,
  room,
  round,
  youId
}: {
  content: PetitBacContent
  room: Room
  round: Round
  youId: PlayerId | null
}): RoundContent => {
  const votingAt = votingCategoryIndex(content)
  const sheet = youId === null ? undefined : content.sheets.get(youId)
  const isSeated =
    youId !== null &&
    !hasJoinedAfterStart({
      openedWithPlayerIds: round.openedWithPlayerIds,
      playerId: youId
    })
  const yourRefusals =
    votingAt === null || youId === null
      ? []
      : [...(content.refusals.get(votingAt) ?? new Map())]
          .filter(([, refusedBy]) => refusedBy.has(youId))
          .map(([rowKey]) => rowKey)

  return {
    barredStopperIds: [...content.barredStoppers],
    categories: [...content.categories],
    categoryStates: [...content.categoryStates],
    kind: 'petitbac',
    letter: content.letter,
    lines: content.categoryStates.map((state, categoryIndex) =>
      state === 'settled' ? petitBacLinesFor({ categoryIndex, room }) : null
    ),
    rows:
      votingAt === null
        ? null
        : petitBacRowsFor({ categoryIndex: votingAt, room }),
    sheetsClosed: content.sheetsClosed,
    stopClosesAtElapsedMs: content.stopClosesAtElapsedMs,
    stoppedBy: content.stoppedBy,
    stopsWhenFull: content.stopsWhenFull,
    votesDone: [...content.votesDone],
    yourRefusals,
    yourSheet: isSeated
      ? content.categories.map((_, index) => sheet?.get(index) ?? '')
      : null
  }
}

/**
 * The reader's lines and nobody else's. An item that closed before the reader
 * held a seat was never asked of them, so it owes no verdict rather than a
 * wrong one.
 */
const toSlateSheet = ({
  content,
  youId
}: {
  content: Extract<Round['content'], { kind: 'slate' }>
  youId: PlayerId
}): SlateLine[] => {
  const sheet = content.sheets.get(youId)

  return content.items.map((item, index) => {
    const answer = sheet?.get(index) ?? null

    return {
      answer,
      closedBeforeYou: item.state === 'closed' && !item.roster.has(youId),
      verdict: itemVerdictFor({ answer, item, playerId: youId })
    }
  })
}

const toTrackIdentity = (track: HostTrack): TrackIdentity => ({
  artist: track.artist,
  coverUrl: track.coverUrl,
  film: track.film,
  id: track.id,
  title: track.title
})
