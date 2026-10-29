/**
 * One per tab, shared by every cue, and **only ever built inside a gesture**: a
 * context created from an effect is born `suspended` and a later `resume()` is
 * refused, which is the same policy `round-audio.ts` blesses its element under.
 */
let context: AudioContext | null = null

/**
 * MUST be called synchronously inside a user gesture, beside the press that
 * arms the clip. Called from anywhere else the context never starts and no cue
 * ever sounds.
 */
export const unlockCues = (): void => {
  context ??= new AudioContext()

  void context.resume()
}

/**
 * The context a cue may sound through, or `null` wherever it must stay silent:
 * a muted screen, and a screen that never pressed — the console already says
 * out loud when it cannot play, and a cue is not worth a second message.
 */
export const audibleCueContext = (volume: number): AudioContext | null =>
  volume > 0 && context !== null && context.state === 'running' ? context : null

/**
 * `exponentialRampToValueAtTime` refuses zero, and a linear tail to silence
 * would undo the decay that makes a cue land. Inaudible, and the oscillators
 * stop on the same instant.
 */
export const SILENT_GAIN = 0.0001
