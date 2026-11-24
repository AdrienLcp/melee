import {
  brush,
  electricPiano,
  hat,
  kick,
  marimba,
  mixInto,
  softBass
} from '../instruments'
import { barsFor, beatTime, harmonyOf, melodyOf, type Style } from '../piece'
import { arrangementOf, chance, meanOf, pickFrom, voicedNear } from '../theory'

/** Where the piano's hand lands in a bar: a beat and how long it holds. */
const COMPS: readonly (readonly (readonly [number, number])[])[] = [
  [
    [0, 1.4],
    [1.5, 1.8]
  ],
  [
    [0.5, 1],
    [2.5, 1.3]
  ],
  [
    [0, 0.9],
    [2, 0.5],
    [3.5, 0.5]
  ],
  [[0, 3.6]],
  [
    [1.5, 0.4],
    [2, 1.8]
  ]
]

/** A jazz trio in a hotel bar: tine piano, brushes, a bass that walks. */
export const loungeStyle: Style = {
  createPiece: ({ context, destination, random }) => {
    const secondsPerBeat = 60 / (90 + random() * 16)
    const secondsPerBar = secondsPerBeat * 4
    const swing = 0.14
    const bars = barsFor({ seconds: 150 + random() * 60, secondsPerBar })
    const sections = arrangementOf(random, bars)
    const harmony = harmonyOf({
      bars,
      barsPerChord: 1,
      lowestRoot: 48,
      random,
      scales: [
        ['ionian', 3],
        ['dorian', 3],
        ['lydian', 1],
        ['mixolydian', 1]
      ]
    })
    const melody = melodyOf({ harmony, octave: 2, random })
    const mix = mixInto(context, destination)
    const piano = mix.channel({ level: 0.9, pan: -0.15, reverb: 0.3 })
    const bass = mix.channel({ level: 0.9, reverb: 0.05 })
    const kit = mix.channel({ level: 0.7, pan: 0.2, reverb: 0.15 })
    const vibes = mix.channel({ level: 0.55, pan: 0.3, reverb: 0.5 })
    let centre = 62
    let comp = pickFrom(random, COMPS)

    return {
      bars,
      playBar: ({ at, bar, energy }) => {
        const time = (beat: number) =>
          beatTime({ at, beat, secondsPerBeat, swing })
        const chord = harmony.chordAt(bar)
        const next = harmony.nextChordAt(bar)
        const ninth = (chord.pitches[0] ?? harmony.key.root) + 14
        const tones = energy > 0.7 ? [...chord.pitches, ninth] : chord.pitches
        const voicing = voicedNear(tones.slice(1), centre)

        centre = Math.round(meanOf(voicing) * 0.3 + 62 * 0.7)

        if (bar % 4 === 0) {
          comp = pickFrom(random, COMPS)
        }

        for (const [beat, length] of comp) {
          for (const midi of voicing) {
            electricPiano({
              at: time(beat),
              context,
              length: length * secondsPerBeat,
              midi,
              out: piano,
              velocity: 0.55 + random() * 0.25
            })
          }
        }

        const root = (chord.pitches[0] ?? harmony.key.root) - 12
        const nextRoot = (next.pitches[0] ?? harmony.key.root) - 12

        if (energy > 0.3) {
          const walk =
            energy > 0.7
              ? [
                  root,
                  chord.pitches[2] ?? root,
                  chord.pitches[1] ?? root,
                  nextRoot + (chance(random, 0.5) ? 1 : -1)
                ]
              : [root, null, root + 7, null]

          for (const [beat, midi] of walk.entries()) {
            if (midi !== null) {
              softBass({
                at: time(beat),
                context,
                length: secondsPerBeat * (energy > 0.7 ? 0.9 : 1.8),
                midi: midi - (midi > root + 9 ? 12 : 0),
                out: bass,
                velocity: beat === 0 ? 0.9 : 0.7
              })
            }
          }
        }

        if (energy > 0.45) {
          for (const beat of [1, 3]) {
            brush({ at: time(beat), context, out: kit, velocity: 0.8 })
          }

          for (const beat of [0, 1, 1.5, 2, 3, 3.5]) {
            hat({
              at: time(beat),
              context,
              out: kit,
              velocity: (beat % 1 === 0 ? 0.35 : 0.22) * energy
            })
          }
        }

        if (energy > 0.75) {
          kick({ at: time(0), context, out: kit, velocity: 0.35 })
        }

        if (energy > 0.6 && bar % 8 >= 4) {
          for (const note of melody.notesOf({ bar, chord })) {
            marimba({
              at: time(note.beat),
              context,
              length: note.length * secondsPerBeat,
              midi: note.midi,
              out: vibes,
              velocity: 0.6 + random() * 0.2
            })
          }
        }
      },
      secondsPerBar,
      sections
    }
  },
  name: 'lounge'
}
