import type { GameKind } from '@melee/protocol/game'
import type { RoomPhase } from '@melee/protocol/room'

/**
 * How much of the soundtrack plays: `calm` under a lobby filling up and a
 * round being thought about, `lively` around a reveal and the count into the
 * next round, `final` under the board that ends the game.
 */
export type AmbientMood = 'calm' | 'lively' | 'final'

const MOOD_OF_PHASE: Readonly<Record<RoomPhase, AmbientMood>> = {
  buzzed: 'calm',
  countdown: 'lively',
  finished: 'final',
  lobby: 'calm',
  playing: 'calm',
  revealed: 'lively'
}

/** Games whose round sounds a clip, which the soundtrack never plays over. */
const PLAYS_A_CLIP: ReadonlySet<GameKind> = new Set(['blindtest'])

/**
 * Games whose players count in their heads while the round runs: a beat under
 * them is a metronome. The reflex race and Lights keep the music — their flip
 * and their lights fall at random, so a beat tells a press nothing.
 */
const COUNTED_IN_SILENCE: ReadonlySet<GameKind> = new Set(['innerclock'])

const isCountingPhase = (phase: RoomPhase): boolean =>
  phase === 'countdown' || phase === 'playing' || phase === 'buzzed'

/**
 * The mood the room's speaker plays the soundtrack at, or `null` while it must
 * give way: switched off, a paused room, a sound check, every phase of a round
 * whose game sounds a clip — from the count in, so the clip never starts over
 * music, to the reveal its track plays under — and Inner clock's count.
 */
export const ambientMoodOf = ({
  isPaused,
  isTestingSound,
  phase,
  playsMusic,
  roundKind
}: {
  isPaused: boolean
  isTestingSound: boolean
  phase: RoomPhase
  playsMusic: boolean
  /** The game the round on screen was opened on, `null` with no round. */
  roundKind: GameKind | null
}): AmbientMood | null => {
  if (!playsMusic || isPaused || isTestingSound) {
    return null
  }

  const isInRound = phase !== 'lobby' && phase !== 'finished'

  if (isInRound && roundKind !== null) {
    if (PLAYS_A_CLIP.has(roundKind)) {
      return null
    }

    if (COUNTED_IN_SILENCE.has(roundKind) && isCountingPhase(phase)) {
      return null
    }
  }

  return MOOD_OF_PHASE[phase]
}
