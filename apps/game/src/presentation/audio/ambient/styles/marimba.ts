import {
  electricPiano,
  kick,
  marimba,
  mixInto,
  rim,
  shaker,
  softBass,
  warmPad
} from '../instruments'
import { barsFor, beatTime, harmonyOf, melodyOf, type Style } from '../piece'
import { arrangementOf, meanOf, pickFrom, voicedNear } from '../theory'

/** Orders the four chord tones of an eighth-note arpeggio walks through. */
const ARPEGGIOS: readonly (readonly number[])[] = [
  [0, 1, 2, 3, 2, 1, 0, 1],
  [0, 2, 1, 3, 0, 2, 1, 3],
  [3, 2, 1, 0, 1, 2, 3, 2],
  [0, 1, 2, 1, 3, 2, 1, 2]
]

/** A two-bar bossa clave on the rim. */
const CLAVE = [0, 1.5, 3, 5, 6.5] as const

/** A sunny terrace: marimba arpeggios, a shaker and a bossa rim. */
export const marimbaStyle: Style = {
  createPiece: ({ context, destination, random }) => {
    const secondsPerBeat = 60 / (98 + random() * 16)
    const secondsPerBar = secondsPerBeat * 4
    const swing = 0.04
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
        ['lydian', 1]
      ]
    })
    const melody = melodyOf({ harmony, octave: 2, random })
    const mix = mixInto(context, destination)
    const wood = mix.channel({ level: 0.8, pan: -0.2, reverb: 0.25 })
    const pad = mix.channel({ level: 0.5, reverb: 0.4 })
    const bass = mix.channel({ level: 0.85, reverb: 0.05 })
    const percussion = mix.channel({ level: 0.7, pan: 0.25, reverb: 0.12 })
    const lead = mix.channel({ level: 0.45, pan: 0.15, reverb: 0.4 })
    let centre = 66
    let arpeggio = pickFrom(random, ARPEGGIOS)

    return {
      bars,
      playBar: ({ at, bar, energy, section }) => {
        const time = (beat: number) =>
          beatTime({ at, beat, secondsPerBeat, swing })
        const chord = harmony.chordAt(bar)
        const voicing = voicedNear(chord.pitches, centre)
        const root = (chord.pitches[0] ?? harmony.key.root) - 12

        centre = Math.round(meanOf(voicing) * 0.3 + 66 * 0.7)

        if (bar % 8 === 0) {
          arpeggio = pickFrom(random, ARPEGGIOS)
        }

        for (const [eighth, tone] of arpeggio.entries()) {
          marimba({
            at: time(eighth / 2),
            context,
            length: secondsPerBeat / 2,
            midi: voicing[tone] ?? centre,
            out: wood,
            velocity: (eighth % 2 === 0 ? 0.75 : 0.5) + random() * 0.15
          })
        }

        warmPad({
          at,
          brightness: 0.35,
          context,
          length: secondsPerBar,
          midi: voicing[0] ?? centre,
          out: pad,
          velocity: 0.5
        })

        if (energy > 0.3) {
          for (const [beat, midi] of [
            [0, root],
            [1.5, root + 7],
            [2, root + 7],
            [3.5, root]
          ] as const) {
            softBass({
              at: time(beat),
              context,
              length: secondsPerBeat * 0.8,
              midi,
              out: bass,
              velocity: beat === 0 ? 0.9 : 0.65
            })
          }
        }

        if (energy > 0.45) {
          for (let beat = 0; beat < 4; beat += 0.25) {
            shaker({
              at: time(beat),
              context,
              out: percussion,
              velocity: beat % 1 === 0 ? 0.8 : 0.45
            })
          }

          for (const beat of CLAVE) {
            if (Math.floor(beat / 4) === bar % 2) {
              rim({
                at: time(beat % 4),
                context,
                out: percussion,
                velocity: 0.45
              })
            }
          }
        }

        if (energy > 0.7 && section !== 'break') {
          for (const beat of [0, 2]) {
            kick({ at: time(beat), context, out: percussion, velocity: 0.5 })
          }
        }

        if (energy > 0.6 && bar % 8 >= 4) {
          for (const note of melody.notesOf({ bar, chord })) {
            electricPiano({
              at: time(note.beat),
              context,
              length: note.length * secondsPerBeat,
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
  name: 'marimba'
}
