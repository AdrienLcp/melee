import type { PlayerId } from '@melee/protocol/identifiers'
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

import { elapsedRoundMs, flipsAtOf } from '@/domain/round/round-service'
import { answerGroupsFor, blankPlayerIdsFor } from '@/domain/round/slate-round'

import type { Participant, PlayerAttempts, Room, Round } from './room'
import { toTeamViews } from './team-service'

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
}): HostRoomView => ({
  ...toBaseView({ isHostConnected, now, room, youId: seatId }),
  currentContent:
    room.round === null
      ? null
      : toHostContent({ room, round: room.round, seatId }),
  isWallConnected,
  remainingPoolSize: room.trackPool.length,
  youId: seatId
})

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
  ...toBaseView({ isHostConnected, now, room, youId: null }),
  currentContent:
    room.round === null
      ? null
      : toWallContent(toHostContent({ room, round: room.round, seatId: null })),
  yourVerdict: verdictOfTeamOnTurn(room)
})

/**
 * What the team on turn has banked, which is the wall's own answer when it
 * answers for them: every seat of that team holds the same attempt. A verdict
 * says how much was right and never what the answer is.
 */
const verdictOfTeamOnTurn = (room: Room): Verdict | null => {
  const round = room.round

  // A duel is two teams on turn, and no one answer is the wall's to show.
  if (round === null || round.turn === null || round.turn.style === 'duel') {
    return null
  }

  return (
    round.attempts.find(
      (entry) => round.openedWithPlayerIds?.has(entry.playerId) === true
    )?.verdict ?? null
  )
}

const toWallContent = (content: HostRoundContent): WallRoundContent => {
  switch (content.kind) {
    case 'blindtest': {
      return { audioUrl: content.audioUrl, kind: 'blindtest' }
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

  if (content.kind === 'timeline') {
    return {
      datedEvents: seatId === null ? earliestFirst(content.events) : null,
      kind: 'timeline'
    }
  }

  if (
    content.kind === 'challenge' ||
    content.kind === 'innerclock' ||
    content.kind === 'reflex' ||
    content.kind === 'worldmap'
  ) {
    return { kind: content.kind }
  }

  if (content.kind === 'slate') {
    return toHostSlateContent({ content, room })
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
      sheets: [...room.players.keys()].map(
        (playerId) => content.sheets.get(playerId) ?? new Map()
      )
    }),
    keys: content.items.map((_, index) => content.keys.get(index) ?? null),
    kind: 'slate',
    progress: [...room.players.keys()].map((playerId) => ({
      filledCount: filledLineCount(content.sheets.get(playerId) ?? new Map()),
      playerId
    }))
  }
}

export const toPlayerView = ({
  isHostConnected,
  now,
  room,
  youId
}: {
  isHostConnected: boolean
  now: number
  room: Room
  youId: PlayerId
}): PlayerRoomView => ({
  ...toBaseView({ isHostConnected, now, room, youId }),
  youId
})

const toBaseView = ({
  isHostConnected,
  now,
  room,
  youId
}: {
  isHostConnected: boolean
  /** The time the frame carrying this view is stamped with. */
  now: number
  room: Room
  youId: PlayerId | null
}) => ({
  code: room.code,
  isHostConnected,
  phase: room.phase,
  players: [...room.players.values()].map(toPublicPlayer),
  round: room.round === null ? null : toRoundView({ round: room.round, youId }),
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

const toPublicPlayer = (participant: Participant): PublicPlayer => ({
  id: participant.id,
  isConnected: participant.isConnected,
  isReady: participant.isReady,
  nickname: participant.nickname,
  score: participant.score
})

/**
 * `correctChoiceIndex` is absent from this object, and that absence is the
 * whole anti-cheat story for choice mode. Spreading the round here instead of
 * naming its fields would ship it — `codec.test.ts` is the net under that, and
 * this is the floor above it.
 */
const toRoundView = ({
  round,
  youId
}: {
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
  content: toContentView({ round, youId }),
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
  startsAt: round.startsAt,
  turn: round.turn
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

const toContentView = ({
  round,
  youId
}: {
  round: Round
  youId: PlayerId | null
}): RoundContent => {
  const content = round.content

  if (content.kind === 'buzzer') {
    return { kind: 'buzzer' }
  }

  if (content.kind === 'challenge') {
    return { kind: 'challenge', text: content.text }
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

  if (content.kind === 'worldmap') {
    return {
      kind: 'worldmap',
      revealedPlacements: round.revealed
        ? content.placements.map(({ playerId, point }) => ({
            playerId,
            point: { latitude: point.latitude, longitude: point.longitude }
          }))
        : null,
      target:
        content.target.kind === 'country'
          ? content.target
          : {
              kind: 'city',
              name: content.target.name,
              point: round.revealed ? { ...content.target.point } : null
            }
    }
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
