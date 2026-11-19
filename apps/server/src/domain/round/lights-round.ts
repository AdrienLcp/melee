import { Result } from '@adrienlcp/result'

import type { ProtocolErrorCode } from '@melee/protocol/error-code'
import type { LightsSettings } from '@melee/protocol/game'
import type { PlayerId, RoundId } from '@melee/protocol/identifiers'
import type { LightsCell, LightsRoundContent } from '@melee/protocol/lights'
import { MAX_LIGHTS_SEED } from '@melee/protocol/lights'

import { randomIntBetween } from '@melee/core/helpers/random'
import {
  LATE_TAP_GRACE_MS,
  LIGHTS_PUBLISH_TICK_MS,
  type LightsWindow,
  lightsRunLengthOf,
  type TapOutcome,
  tapOutcomeOf
} from '@melee/core/lights/counted-tap'
import { bestHitsOf } from '@melee/core/lights/hits-pay'
import { lightsRunOf } from '@melee/core/lights/lights-run'
import { isRoundInPlay } from '@melee/core/room/room-phase'
import { hasJoinedAfterStart } from '@melee/core/round/round-roster'
import { pointsFor } from '@melee/core/scoring/verdict'

import type { Room, Round } from '@/domain/room/room'
import { touch } from '@/domain/room/room-service'

type LightsContent = Extract<Round['content'], { kind: 'lights' }>

export type LightsTapRejection = Extract<
  ProtocolErrorCode,
  'joined_mid_round' | 'stale_round' | 'wrong_phase'
>

export const lightsContent = (settings: LightsSettings): LightsContent => {
  const seed = randomIntBetween(0, MAX_LIGHTS_SEED)

  return {
    hasTraps: settings.hasTraps,
    kind: 'lights',
    publishDueAt: null,
    run: lightsRunOf({
      hasTraps: settings.hasTraps,
      length: lightsRunLengthOf(settings.windowMs),
      seed
    }),
    seats: new Map(),
    seed,
    windowMs: settings.windowMs
  }
}

/**
 * The window in server time, read off the round's own clock so a pause or the
 * console away stops it and it resumes with what it had left: `opensAt` moves
 * on by however long the clock stood still. Before the clock starts it is the
 * countdown's end, which is what every screen lights its board on.
 */
export const lightsWindowOf = ({
  content,
  now,
  round
}: {
  content: LightsContent
  now: number
  round: Round
}): LightsWindow => {
  const opensAt =
    round.runningSince !== null
      ? round.runningSince - round.elapsedMs
      : round.elapsedMs === 0 && round.startsAt !== null
        ? round.startsAt
        : now - round.elapsedMs

  return { closesAt: opensAt + content.windowMs, opensAt }
}

/** How long the round's clock runs: the window, then the last taps still in the air. */
export const lightsOpenPhaseMs = (content: LightsContent): number =>
  content.windowMs + LATE_TAP_GRACE_MS

/**
 * A tap arriving, stamped by the server. A tap that counts nothing — late,
 * early, under the floor, a step already passed — is an outcome rather than a
 * refusal: an honest thumb sends those at every window's edge. Only a tap that
 * could never have been the seat's is refused.
 *
 * A count that moved arms the next publish instead of publishing: `true` when
 * this tap is the one that armed it, so the caller commits the wake.
 */
export const registerLightsTap = ({
  cell,
  now,
  playerId,
  room,
  roundId,
  step
}: {
  cell: LightsCell
  now: number
  playerId: PlayerId
  room: Room
  roundId: RoundId
  step: number
}): Result<
  { armsPublish: boolean; outcome: TapOutcome },
  LightsTapRejection
> => {
  const round = room.round

  if (round === null || round.content.kind !== 'lights') {
    return Result.failure('wrong_phase')
  }

  if (round.id !== roundId) {
    return Result.failure('stale_round')
  }

  // The roster is stamped as the countdown lands; before then it is the last
  // round's, and the window refuses a tap that early anyway.
  if (
    room.phase !== 'countdown' &&
    hasJoinedAfterStart({
      openedWithPlayerIds: round.openedWithPlayerIds,
      playerId
    })
  ) {
    return Result.failure('joined_mid_round')
  }

  // A closed round's clock stands still, so its window, read off `now`, would
  // slide along with every tap after the reveal.
  if (!isRoundInPlay(room.phase)) {
    return Result.success({ armsPublish: false, outcome: 'uncounted' })
  }

  const content = round.content
  const tally = content.seats.get(playerId) ?? { hits: 0, traps: 0 }
  const outcome = tapOutcomeOf({
    hits: tally.hits,
    run: content.run,
    tap: { arrivedAt: now, cell, step },
    window: lightsWindowOf({ content, now, round })
  })

  if (outcome === 'uncounted') {
    return Result.success({ armsPublish: false, outcome })
  }

  content.seats.set(playerId, {
    hits: tally.hits + (outcome === 'hit' ? 1 : 0),
    traps: tally.traps + (outcome === 'trap' ? 1 : 0)
  })
  touch(room, now)

  const armsPublish = content.publishDueAt === null

  if (armsPublish) {
    content.publishDueAt = now + LIGHTS_PUBLISH_TICK_MS
  }

  return Result.success({ armsPublish, outcome })
}

/** When the counts that moved since the last tick are due on every screen, or `null` with nothing new. */
export const lightsPublishDueAt = (room: Room): number | null =>
  room.round?.content.kind === 'lights' ? room.round.content.publishDueAt : null

export const settleLightsPublish = (room: Room): void => {
  if (room.round?.content.kind === 'lights') {
    room.round.content.publishDueAt = null
  }
}

/** The seats the round opened on, the ones still in the room, in the order they sat. */
const racingSeatIds = (room: Room, round: Round): PlayerId[] =>
  [...room.players.keys()].filter(
    (playerId) => round.openedWithPlayerIds?.has(playerId) === true
  )

/**
 * Pays every seat the round opened on its hits over the round's best, a seat
 * that hit nothing included, so the reveal lists the whole race. The clock pays
 * nothing: two seats on thirty hits did the same thing.
 */
export const payLights = (room: Room): void => {
  const round = room.round

  if (round?.content.kind !== 'lights') {
    return
  }

  const { seats } = round.content
  const seatIds = racingSeatIds(room, round)
  const bestHits = bestHitsOf(
    seatIds.map((playerId) => seats.get(playerId)?.hits ?? 0)
  )

  round.content.publishDueAt = null
  round.awards = seatIds.map((playerId) => {
    const verdict = {
      bestHits,
      hits: seats.get(playerId)?.hits ?? 0,
      kind: 'count' as const
    }
    const points = pointsFor(verdict)
    const participant = room.players.get(playerId)

    if (participant !== undefined) {
      participant.score += points
    }

    return {
      isUnsent: false,
      playerId,
      points,
      speedBonus: 0,
      verdict
    }
  })
}

/** The same on every view, the wall, the console and every seat: nothing in a race of lights is withheld. */
export const lightsContentView = ({
  content,
  now,
  room,
  round
}: {
  content: LightsContent
  now: number
  room: Room
  round: Round
}): LightsRoundContent => {
  const { closesAt, opensAt } = lightsWindowOf({ content, now, round })

  return {
    closesAt,
    hasTraps: content.hasTraps,
    kind: 'lights',
    opensAt,
    seats: racingSeatIds(room, round).map((playerId) => ({
      hits: content.seats.get(playerId)?.hits ?? 0,
      playerId,
      traps: content.seats.get(playerId)?.traps ?? 0
    })),
    seed: content.seed
  }
}
