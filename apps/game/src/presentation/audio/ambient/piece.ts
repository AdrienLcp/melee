import type { AmbientMood } from '@melee/core/room/ambient-music'

import {
  chordOf,
  type Key,
  type MotifNote,
  motifOf,
  nearestIn,
  pentatonicOf,
  pickWeighted,
  progressionOf,
  type Random,
  type ScaleName,
  type Section
} from './theory'

/** How much of a piece plays at once, by the room's moment. */
export const MOOD_ENERGY: Readonly<Record<AmbientMood, number>> = {
  calm: 0.6,
  final: 1,
  lively: 0.85
}

export type Bar = {
  at: number
  bar: number
  /** 0 to 1: the mood's energy times the section's, which voices join in. */
  energy: number
  section: Section
}

/**
 * A few minutes of one key, one tempo and one draw. The player asks it bar by
 * bar, so a mood changed mid-piece is heard from the next bar.
 */
export type Piece = {
  bars: number
  playBar: (bar: Bar) => void
  sections: readonly Section[]
  secondsPerBar: number
}

export type Style = {
  createPiece: (args: {
    context: BaseAudioContext
    destination: AudioNode
    random: Random
    /** When its first bar sounds, for a voice held under the whole piece. */
    startAt: number
  }) => Piece
  name: string
}

/** Where a beat of the bar falls, its off-beat eighths pushed late by `swing`. */
export const beatTime = ({
  at,
  beat,
  secondsPerBeat,
  swing
}: {
  at: number
  beat: number
  secondsPerBeat: number
  swing: number
}): number => {
  const isOffBeat = Math.abs((beat % 1) - 0.5) < 0.01

  return at + (beat + (isOffBeat ? swing : 0)) * secondsPerBeat
}

/** Enough bars for `seconds`, in whole phrases of eight. */
export const barsFor = ({
  seconds,
  secondsPerBar
}: {
  seconds: number
  secondsPerBar: number
}): number => Math.max(16, Math.round(seconds / secondsPerBar / 8) * 8)

export type Chord = { degree: number; pitches: number[] }

export type Harmony = {
  chordAt: (bar: number) => Chord
  key: Key
  nextChordAt: (bar: number) => Chord
}

/**
 * A key, and a four-chord progression per phrase of eight bars — the last
 * phrase's kept half the time, because a loop heard twice is a song and one
 * heard once is a scale exercise.
 */
export const harmonyOf = ({
  bars,
  barsPerChord,
  lowestRoot,
  random,
  scales
}: {
  bars: number
  barsPerChord: 1 | 2
  lowestRoot: number
  random: Random
  scales: readonly (readonly [ScaleName, number])[]
}): Harmony => {
  const key: Key = {
    root: lowestRoot + Math.floor(random() * 7),
    scale: pickWeighted(random, scales)
  }
  const phrases: number[][] = []

  for (let phrase = 0; phrase * 8 < bars; phrase++) {
    const kept = phrases.at(-1)

    phrases.push(
      kept !== undefined && random() < 0.5 ? kept : progressionOf(random, 4)
    )
  }

  const chordAt = (bar: number): Chord => {
    const degrees = phrases[Math.floor(bar / 8)] ?? phrases[0] ?? [0]
    const degree =
      degrees[Math.floor((bar % 8) / barsPerChord) % degrees.length] ?? 0

    return { degree, pitches: chordOf({ degree, key, size: 4 }) }
  }

  return { chordAt, key, nextChordAt: (bar) => chordAt(bar + 1) }
}

/**
 * A line for a section: one motif, played over and bent onto each bar's
 * chord — its strong beats land on chord tones, the rest walk the
 * pentatonic.
 */
export type MelodyNote = { beat: number; length: number; midi: number }

export type Melody = {
  notesOf: (args: { bar: number; chord: Chord }) => MelodyNote[]
}

export const melodyOf = ({
  harmony,
  octave,
  random
}: {
  harmony: Harmony
  octave: number
  random: Random
}): Melody => {
  const scale = pentatonicOf(harmony.key)
  const motifs = new Map<number, MotifNote[]>()

  const motifAt = (phrase: number): MotifNote[] => {
    const held = motifs.get(phrase)

    if (held !== undefined) {
      return held
    }

    const drawn = motifOf(random)

    motifs.set(phrase, drawn)

    return drawn
  }

  return {
    notesOf: ({ bar, chord }) => {
      const half = bar % 2

      return motifAt(Math.floor(bar / 8))
        .filter((note) => Math.floor(note.beat / 4) === half)
        .map((note) => {
          const octaveUp = Math.floor(note.step / scale.length)
          const fromScale =
            (scale[note.step - octaveUp * scale.length] ?? harmony.key.root) +
            12 * (octave + octaveUp)
          const isStrong = note.beat % 2 === 0
          const midi = isStrong
            ? nearestIn(chord.pitches, fromScale)
            : fromScale

          return { beat: note.beat - half * 4, length: note.length, midi }
        })
    }
  }
}
