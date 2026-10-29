import type { ClockEstimate } from '@melee/core/time/clock-sync'

import {
  currentDeadline,
  type DeadlineKind,
  type TimedView,
  useLastSeconds
} from '@/presentation/timing/last-seconds'

import { audibleCueContext, SILENT_GAIN } from './cue-audio'
import { useVolume } from './volume-provider'

/** Five is what a room counts aloud along with; ten would talk over the round. */
const TICKING_FROM_SECOND = 5

/**
 * A clock tick, not a note: short and high enough to sit above the clip, and a
 * fifth higher on the last second so the ear hears the end arriving.
 */
const TICK_HZ = 1_320
const LAST_TICK_HZ = 1_980
const TICK_PEAK_GAIN = 0.12
const TICK_LENGTH_S = 0.06

/** Falling, where the buzz cue's fifth is held: the room hears *over*, not *someone*. */
const TIME_UP_TONES_HZ = [660, 440] as const
const TIME_UP_PEAK_GAIN = 0.25
const TIME_UP_STEP_S = 0.18

const blip = ({
  at,
  context,
  hertz,
  lengthS,
  peakGain,
  wave
}: {
  at: number
  context: AudioContext
  hertz: number
  lengthS: number
  peakGain: number
  wave: OscillatorType
}): void => {
  const envelope = context.createGain()
  const tone = context.createOscillator()

  envelope.connect(context.destination)
  envelope.gain.setValueAtTime(0, at)
  envelope.gain.linearRampToValueAtTime(peakGain, at + 0.004)
  envelope.gain.exponentialRampToValueAtTime(SILENT_GAIN, at + lengthS)

  tone.type = wave
  tone.frequency.value = hertz
  tone.connect(envelope)
  tone.start(at)
  tone.stop(at + lengthS)
}

const playTick = ({ second, volume }: { second: number; volume: number }) => {
  const context = audibleCueContext(volume)

  if (context !== null) {
    blip({
      at: context.currentTime,
      context,
      hertz: second === 1 ? LAST_TICK_HZ : TICK_HZ,
      lengthS: TICK_LENGTH_S,
      peakGain: TICK_PEAK_GAIN * volume,
      wave: 'sine'
    })
  }
}

const playTimeUp = (volume: number): void => {
  const context = audibleCueContext(volume)

  if (context === null) {
    return
  }

  for (const [step, hertz] of TIME_UP_TONES_HZ.entries()) {
    blip({
      at: context.currentTime + step * TIME_UP_STEP_S,
      context,
      hertz,
      lengthS: TIME_UP_STEP_S * 2,
      peakGain: TIME_UP_PEAK_GAIN * volume,
      wave: 'triangle'
    })
  }
}

/**
 * The last seconds of whatever is counting down, ticked aloud on the screen the
 * room is listening to — `null` on every other, for the reason the buzz cue is
 * the speaker's alone. The count into a round ticks and stops: the clip that
 * follows is its end. A round or a floor that runs out says so.
 */
export const useTimerCue = ({
  clock,
  view
}: {
  clock: ClockEstimate | null
  view: TimedView | null
}): void => {
  const { volume } = useVolume()

  useLastSeconds({
    deadline: view === null ? null : currentDeadline({ clock, view }),
    fromSecond: TICKING_FROM_SECOND,
    onEnd: (kind: DeadlineKind) => {
      if (kind !== 'countdown') {
        playTimeUp(volume)
      }
    },
    onSecond: (second) => {
      playTick({ second, volume })
    }
  })
}
