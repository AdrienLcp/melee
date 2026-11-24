import {
  electricPiano,
  hat,
  kick,
  mixInto,
  pluck,
  snare,
  softBass,
  vinyl,
  warmPad
} from '../instruments'
import { barsFor, beatTime, harmonyOf, melodyOf, type Style } from '../piece'
import { arrangementOf, chance, meanOf, pickFrom, voicedNear } from '../theory'

/** Kick beats of a lazy boom-bap bar, one drawn per phrase. */
const KICKS: readonly (readonly number[])[] = [
  [0, 2.5],
  [0, 1.75, 2.5],
  [0, 0.75, 2.5, 3.25],
  [0, 2, 2.75]
]

/** Lo-fi hip-hop: a dusty piano loop over a lazy beat and a record's crackle. */
export const lofiStyle: Style = {
  createPiece: ({ context, destination, random, startAt }) => {
    const secondsPerBeat = 60 / (72 + random() * 14)
    const secondsPerBar = secondsPerBeat * 4
    const swing = 0.17
    const bars = barsFor({ seconds: 150 + random() * 60, secondsPerBar })
    const sections = arrangementOf(random, bars)
    const harmony = harmonyOf({
      bars,
      barsPerChord: 1,
      lowestRoot: 48,
      random,
      scales: [
        ['dorian', 4],
        ['ionian', 2],
        ['lydian', 1]
      ]
    })
    const melody = melodyOf({ harmony, octave: 1, random })
    const mix = mixInto(context, destination)
    const keys = mix.channel({ level: 0.85, pan: -0.1, reverb: 0.25 })
    const pad = mix.channel({ level: 0.7, reverb: 0.4 })
    const bass = mix.channel({ level: 0.9, reverb: 0 })
    const drums = mix.channel({ level: 0.75, reverb: 0.08 })
    const lead = mix.channel({ level: 0.5, pan: 0.25, reverb: 0.45 })
    let centre = 60
    let kicks = pickFrom(random, KICKS)

    vinyl({
      at: startAt,
      context,
      end: startAt + bars * secondsPerBar,
      out: drums,
      random
    })

    return {
      bars,
      playBar: ({ at, bar, energy, section }) => {
        const time = (beat: number) =>
          beatTime({ at, beat, secondsPerBeat, swing })
        const chord = harmony.chordAt(bar)
        const voicing = voicedNear(chord.pitches, centre)

        centre = Math.round(meanOf(voicing) * 0.3 + 60 * 0.7)

        if (bar % 8 === 0) {
          kicks = pickFrom(random, KICKS)
        }

        const strum = chance(random, 0.5) ? 0.025 : 0

        for (const [index, midi] of voicing.entries()) {
          electricPiano({
            at: time(0) + index * strum,
            context,
            length: secondsPerBar * 0.9,
            midi,
            out: keys,
            velocity: 0.5
          })
        }

        if (chance(random, 0.4)) {
          electricPiano({
            at: time(2.5),
            context,
            length: secondsPerBeat,
            midi: voicing.at(-1) ?? centre,
            out: keys,
            velocity: 0.4
          })
        }

        warmPad({
          at,
          brightness: 0.2,
          context,
          length: secondsPerBar,
          midi: (chord.pitches[0] ?? harmony.key.root) - 12,
          out: pad,
          velocity: 0.7
        })

        if (energy > 0.3) {
          softBass({
            at: time(0),
            context,
            length: secondsPerBeat * 2.5,
            midi: (chord.pitches[0] ?? harmony.key.root) - 24,
            out: bass,
            velocity: 0.85
          })
        }

        if (energy > 0.45 && section !== 'break') {
          for (const beat of kicks) {
            kick({ at: time(beat), context, out: drums, velocity: 0.75 })
          }

          for (const beat of [1, 3]) {
            snare({ at: time(beat), context, out: drums, velocity: 0.5 })
          }

          for (let beat = 0; beat < 4; beat += 0.5) {
            hat({
              at: time(beat),
              context,
              out: drums,
              velocity: (beat % 1 === 0 ? 0.6 : 0.35) + random() * 0.15
            })
          }
        }

        if (energy > 0.55 && bar % 8 >= 4) {
          for (const note of melody.notesOf({ bar, chord })) {
            pluck({
              at: time(note.beat),
              brightness: 0.1,
              context,
              length: note.length * secondsPerBeat * 0.8,
              midi: note.midi,
              out: lead,
              velocity: 0.7
            })
          }
        }
      },
      secondsPerBar,
      sections
    }
  },
  name: 'lofi'
}
