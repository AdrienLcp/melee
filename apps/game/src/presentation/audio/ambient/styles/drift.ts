import { bell, mixInto, softBass, warmPad } from '../instruments'
import { barsFor, harmonyOf, type Style } from '../piece'
import {
  arrangementOf,
  chance,
  meanOf,
  pentatonicOf,
  pickFrom,
  voicedNear
} from '../theory'

/** Ambient drift: slow pads and bells falling at random, no beat at all. */
export const driftStyle: Style = {
  createPiece: ({ context, destination, random }) => {
    const secondsPerBar = 3.6 + random() * 1.2
    const bars = barsFor({ seconds: 170 + random() * 60, secondsPerBar })
    const sections = arrangementOf(random, bars)
    const harmony = harmonyOf({
      bars,
      barsPerChord: 2,
      lowestRoot: 50,
      random,
      scales: [
        ['lydian', 3],
        ['ionian', 2],
        ['dorian', 2]
      ]
    })
    const scale = pentatonicOf(harmony.key)
    const mix = mixInto(context, destination)
    const pad = mix.channel({ level: 2, reverb: 0.55 })
    const bells = mix.channel({ level: 1.6, reverb: 0.9 })
    const drone = mix.channel({ level: 1.2, reverb: 0.2 })
    let centre = 62

    return {
      bars,
      playBar: ({ at, bar, energy }) => {
        const chord = harmony.chordAt(bar)

        if (bar % 2 === 0) {
          const voicing = voicedNear(chord.pitches, centre)

          centre = Math.round(meanOf(voicing) * 0.4 + 62 * 0.6)

          for (const midi of voicing) {
            warmPad({
              at,
              brightness: 0.25 + energy * 0.4,
              context,
              length: secondsPerBar * 2,
              midi,
              out: pad,
              velocity: 0.55
            })
          }

          softBass({
            at,
            context,
            length: secondsPerBar * 1.8,
            midi: (chord.pitches[0] ?? harmony.key.root) - 24,
            out: drone,
            velocity: 0.35 * energy
          })
        }

        const fallen = Math.round(energy * 3 + random() * 1.5)

        for (let index = 0; index < fallen; index++) {
          const pitch =
            pickFrom(random, scale) + 12 * pickFrom(random, [1, 2, 2])

          bell({
            at: at + random() * secondsPerBar,
            context,
            length: 0,
            midi: pitch,
            out: bells,
            ring: 2 + random() * 2,
            velocity: 0.35 + random() * 0.4
          })

          if (chance(random, 0.25)) {
            bell({
              at: at + random() * secondsPerBar,
              context,
              length: 0,
              midi: pitch + 7,
              out: bells,
              ring: 3,
              velocity: 0.25
            })
          }
        }
      },
      secondsPerBar,
      sections
    }
  },
  name: 'drift'
}
