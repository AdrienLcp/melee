import type { RoomPhase } from '@melee/protocol/room'
import type { ClipSpan } from '@melee/protocol/track'

/**
 * Where in a Deezer preview a flash opens. A preview is already cut from the
 * middle of the song — 88% of 120 famous ones are at full level from their
 * first second — but the rest are slow intros (_Hotel California_, _Creep_,
 * _Skyfall_), and one second of an intro is not the song. Ten seconds in, 97%
 * are at full level and none is quiet, measured on their decoded energy
 * 24 November 2026; a fixed second rather than one per track, because energy
 * is the only measure there is and it cannot tell a chorus from a bridge.
 */
export const FLASH_START_MS = 10_000

/**
 * What of the clip a round plays, stamped as it opens: the whole preview from
 * its start, or a window of it from `FLASH_START_MS`. A preview is thirty
 * seconds and so is the longest round, so only a window can afford to start
 * late.
 */
export const clipSpanFor = (clipWindowMs: number | null): ClipSpan =>
  clipWindowMs === null
    ? { startMs: 0, windowMs: null }
    : { startMs: FLASH_START_MS, windowMs: clipWindowMs }

/**
 * Whether the clip still sounds `elapsedMs` into the round. Past its window a
 * flash stays silent through every way back into the round — a reload, a
 * resumed pause, a buzz judged wrong — because the game is one hearing.
 */
export const isClipWindowOpen = ({
  elapsedMs,
  span
}: {
  /** How far into the round the server says the room is. */
  elapsedMs: number
  span: ClipSpan
}): boolean => span.windowMs === null || elapsedMs < span.windowMs

/**
 * Whether a speaker has played the whole of the window, read off its own
 * position in the preview rather than a timer, so a clip that started late or
 * stalled on its first bytes still sounds for the whole window it was owed.
 */
export const hasPlayedClipWindow = ({
  playedMs,
  span
}: {
  /** How far into the preview this screen has actually played. */
  playedMs: number
  span: ClipSpan
}): boolean =>
  span.windowMs !== null && playedMs >= span.startMs + span.windowMs

/**
 * Below this a reload landed close enough to the start that seeking would be
 * noise — the clip is already where the room is.
 */
const SEEK_THRESHOLD_MS = 750

/**
 * Where to move the clip to, or `null` to leave it alone. It answers two cases
 * with one rule: a clip paused by a buzz is already at the right second, and a
 * console that reloaded into a running round is at nought while the room is
 * twenty seconds in.
 *
 * Only ever forward. A clip *ahead* of the round is a rounding error or a
 * device whose decoder ran on, and yanking it back is audible where letting it
 * run is not.
 */
export const seekTargetMs = ({
  elapsedMs,
  playedMs,
  startMs
}: {
  /** How far into the round the server says the room is. */
  elapsedMs: number
  /** How far into the preview this screen has actually played. */
  playedMs: number
  /** Where in the preview the round's clip opened. */
  startMs: number
}): number | null => {
  const targetMs = startMs + elapsedMs

  return playedMs < targetMs - SEEK_THRESHOLD_MS ? targetMs : null
}

/**
 * Whether this screen is silent through a round that should be sounding — the
 * one fault in the product a green build and a screenshot both miss, because a
 * silent round is *visually identical* to one that plays: the clip's progress
 * comes from the server, buzzes work, and the reveal lands.
 *
 * It is not an autoplay refusal. An autoplay policy grants permission to the
 * **element**, and this screen has none: the element is minted inside the press
 * that opens a round, so a console that reloaded mid-round, restored a tab or
 * had the address pasted into it never asked the browser anything at all. That
 * is why the answer is a gesture rather than a volume.
 */
export const isClipUnheard = ({
  canPlay,
  hasClip,
  phase
}: {
  /** Whether a press has blessed an audio element on this screen. */
  canPlay: boolean
  /** Whether the round this screen is on serves audio at all. */
  hasClip: boolean
  phase: RoomPhase | null
}): boolean =>
  !canPlay && hasClip && (phase === 'countdown' || phase === 'playing')

/**
 * Why a screen could not play, in the three answers the room needs rather than
 * the browser's own list: press again, host from something else, or we broke it.
 */
export type ClipRefusal = 'blocked' | 'broken' | 'unsupported'

/**
 * What a rejected `play()` means for the screen. `null` is the one rejection
 * that is not a refusal at all: an `AbortError` is the next `load()` cutting
 * this one short, the round is driven by the server either way, and saying
 * anything about it would put a message on a screen that is working.
 *
 * It takes the name rather than the exception so this stays free of the DOM —
 * `null` for a rejection that was not a `DOMException`, which tells the room as
 * little as an unrecognised name does.
 */
export const clipRefusalFor = (name: string | null): ClipRefusal | null => {
  switch (name) {
    case 'AbortError':
      return null
    case 'NotAllowedError':
      return 'blocked'
    case 'NotSupportedError':
      return 'unsupported'
    default:
      return 'broken'
  }
}

/**
 * How long a clip told to play may sit on the same second before its speaker
 * calls it silent. Long enough for a slow connection to buffer the start of a
 * thirty-second preview, short enough to be said while the round still runs.
 */
export const CLIP_STALL_MS = 3_000

/**
 * Whether a clip that should be sounding has not moved for too long. A clip
 * that ran to its end has not stalled: it has nothing left to play.
 */
export const isClipStalled = ({
  hasEnded,
  stillSinceMs,
  nowMs
}: {
  hasEnded: boolean
  /** When the clip's position last moved, or when it was told to play. */
  stillSinceMs: number
  nowMs: number
}): boolean => !hasEnded && nowMs - stillSinceMs >= CLIP_STALL_MS

/**
 * What a speaker does with a clip that would not sound: load it again, once,
 * because a dropped connection or a slow first byte is the common cause and a
 * second fetch usually lands. The same clip failing twice is said to the room,
 * whose server can still swap it while the round has not started.
 */
export const clipRecoveryFor = ({
  clip,
  retriedClip
}: {
  /** The round and preview URL that failed, as one key. */
  clip: string
  /** The last clip this screen loaded again, or `null` when it has not yet. */
  retriedClip: string | null
}): 'reload' | 'report' => (clip === retriedClip ? 'report' : 'reload')
