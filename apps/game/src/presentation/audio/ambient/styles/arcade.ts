import {
  hat,
  kick,
  mixInto,
  pluck,
  snare,
  softBass,
  warmPad
} from '../instruments'
import { barsFor, beatTime, harmonyOf, melodyOf, type Style } from '../piece'
import { arrangementOf, meanOf, pickFrom, voicedNear } from '../theory'

/** Orders the sixteenth-note arpeggio walks through the chord's four tones. */
const ARPEGGIOS: readonly (readonly number[])[] = [
  [0, 1, 2, 3],
  [0, 2, 1, 3],
  [3, 2, 1, 0],
  [0, 1, 2, 1]
]

/** A game-show synth: sixteenth plucks, a pumping bass, four on the floor. */
export const arcadeStyle: Style = {
  createPiece: ({ context, destination, random }) => {
    const secondsPerBeat = 60 / (106 + random() * 14)
    const secondsPerBar = secondsPerBeat * 4
    const bars = barsFor({ seconds: 150 + random() * 60, secondsPerBar })
    const sections = arrangementOf(random, bars)
    const harmony = harmonyOf({
      bars,
      barsPerChord: 1,
      lowestRoot: 50,
      random,
      scales: [
        ['ionian', 3],
        ['mixolydian', 2],
        ['dorian', 2],
        ['lydian', 1]
      ]
    })
    const melody = melodyOf({ harmony, octave: 2, random })
    const mix = mixInto(context, destination)
    const arp = mix.channel({ level: 0.7, pan: -0.25, reverb: 0.3 })
    const pad = mix.channel({ level: 0.6, reverb: 0.35 })
    const bass = mix.channel({ level: 0.8, reverb: 0 })
    const drums = mix.channel({ level: 0.7, reverb: 0.1 })
    const lead = mix.channel({ level: 0.5, pan: 0.25, reverb: 0.35 })
    let centre = 64
    let arpeggio = pickFrom(random, ARPEGGIOS)

    return {
      bars,
      playBar: ({ at, bar, energy, section }) => {
        const time = (beat: number) =>
          beatTime({ at, beat, secondsPerBeat, swing: 0 })
        const chord = harmony.chordAt(bar)
        const voicing = voicedNear(chord.pitches, centre)
        const root = (chord.pitches[0] ?? harmony.key.root) - 24

        centre = Math.round(meanOf(voicing) * 0.3 + 64 * 0.7)

        if (bar % 8 === 0) {
          arpeggio = pickFrom(random, ARPEGGIOS)
        }

        const step = energy > 0.6 ? 0.25 : 0.5

        for (let beat = 0, index = 0; beat < 4; beat += step, index++) {
          const tone = arpeggio[index % arpeggio.length] ?? 0
          const octave = Math.floor(index / arpeggio.length) % 2 === 1 ? 12 : 0

          pluck({
            at: time(beat),
            brightness: 0.25 + energy * 0.5,
            context,
            length: step * secondsPerBeat,
            midi: (voicing[tone] ?? centre) + octave,
            out: arp,
            velocity: beat % 1 === 0 ? 0.8 : 0.55
          })
        }

        for (const midi of voicing) {
          warmPad({
            at,
            brightness: 0.4 + energy * 0.3,
            context,
            length: secondsPerBar,
            midi,
            out: pad,
            velocity: 0.45
          })
        }

        if (energy > 0.3) {
          for (let beat = 0.5; beat < 4; beat += 1) {
            softBass({
              at: time(beat - 0.5),
              context,
              length: secondsPerBeat * 0.35,
              midi: root,
              out: bass,
              velocity: 0.6
            })
            softBass({
              at: time(beat),
              context,
              length: secondsPerBeat * 0.35,
              midi: root + 12,
              out: bass,
              velocity: 0.75
            })
          }
        }

        if (energy > 0.5 && section !== 'break') {
          for (let beat = 0; beat < 4; beat++) {
            kick({ at: time(beat), context, out: drums, velocity: 0.6 })
            hat({ at: time(beat + 0.5), context, out: drums, velocity: 0.5 })
          }
        }

        if (energy > 0.7 && section !== 'break') {
          for (const beat of [1, 3]) {
            snare({ at: time(beat), context, out: drums, velocity: 0.45 })
          }
        }

        if (energy > 0.65 && bar % 8 >= 4) {
          for (const note of melody.notesOf({ bar, chord })) {
            pluck({
              at: time(note.beat),
              brightness: 0.6,
              context,
              length: note.length * secondsPerBeat * 0.9,
              midi: note.midi,
              out: lead,
              velocity: 0.75
            })
          }
        }
      },
      secondsPerBar,
      sections
    }
  },
  name: 'arcade'
}
