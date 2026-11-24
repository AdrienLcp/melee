import type { GameKind } from '@melee/protocol/game'
import {
  type RoomPhase,
  type Soundtrack,
  type SoundtrackStyle,
  soundtrackStyles
} from '@melee/protocol/room'

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
  roundKind,
  soundtrack
}: {
  isPaused: boolean
  isTestingSound: boolean
  phase: RoomPhase
  /** The game the round on screen was opened on, `null` with no round. */
  roundKind: GameKind | null
  soundtrack: Soundtrack
}): AmbientMood | null => {
  if (soundtrack === 'off' || isPaused || isTestingSound) {
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

/**
 * The style the next piece is played in: the one the room chose, or under
 * `mix` a draw among the others than `previous`, so the crossfade between two
 * pieces also changes band. `null` when the soundtrack is off.
 */
export const nextSoundtrackStyle = ({
  previous,
  random,
  soundtrack
}: {
  /** The style of the piece now ending, `null` before the first. */
  previous: SoundtrackStyle | null
  /** In `[0, 1)`. */
  random: () => number
  soundtrack: Soundtrack
}): SoundtrackStyle | null => {
  if (soundtrack === 'off') {
    return null
  }

  if (soundtrack !== 'mix') {
    return soundtrack
  }

  const others = soundtrackStyles.filter((style) => style !== previous)

  return others[Math.floor(random() * others.length)] ?? null
}
