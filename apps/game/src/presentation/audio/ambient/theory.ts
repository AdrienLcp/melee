/** A stream of units in `[0, 1)`, seeded per piece so a piece is one draw. */
export type Random = () => number

export const pickFrom = <TItem>(
  random: Random,
  items: readonly TItem[]
): TItem => {
  const item = items[Math.floor(random() * items.length)] ?? items[0]

  if (item === undefined) {
    throw new RangeError('Nothing to pick from')
  }

  return item
}

export const pickWeighted = <TItem>(
  random: Random,
  entries: readonly (readonly [TItem, number])[]
): TItem => {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  let left = random() * total

  for (const [item, weight] of entries) {
    left -= weight

    if (left < 0) {
      return item
    }
  }

  return pickFrom(
    random,
    entries.map(([item]) => item)
  )
}

export const chance = (random: Random, probability: number): boolean =>
  random() < probability

export const hertzOf = (midi: number): number => 440 * 2 ** ((midi - 69) / 12)

export const SCALES = {
  dorian: [0, 2, 3, 5, 7, 9, 10],
  ionian: [0, 2, 4, 5, 7, 9, 11],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10]
} as const

export type ScaleName = keyof typeof SCALES

export type Key = { root: number; scale: ScaleName }

/** A degree past the seventh climbs an octave, so a ninth is degree 8. */
export const pitchOfDegree = (key: Key, degree: number): number => {
  const steps = SCALES[key.scale]
  const octave = Math.floor(degree / steps.length)
  const step = steps[degree - octave * steps.length] ?? 0

  return key.root + octave * 12 + step
}

/** Thirds stacked on a degree inside the key: three tones a triad, four a seventh. */
export const chordOf = ({
  degree,
  key,
  size
}: {
  degree: number
  key: Key
  size: number
}): number[] =>
  Array.from({ length: size }, (_, index) =>
    pitchOfDegree(key, degree + index * 2)
  )

/**
 * Where a progression goes from each degree, weighted towards the moves pop and
 * jazz lean on — a fourth up, a fifth down, the relative minor — so a drawn
 * progression sounds written rather than shuffled.
 */
const NEXT_DEGREE: Readonly<
  Record<number, readonly (readonly [number, number])[]>
> = {
  0: [
    [3, 3],
    [4, 2],
    [5, 3],
    [1, 2],
    [2, 1]
  ],
  1: [
    [4, 4],
    [3, 1],
    [6, 1]
  ],
  2: [
    [5, 3],
    [3, 2]
  ],
  3: [
    [4, 3],
    [0, 2],
    [1, 2],
    [6, 1]
  ],
  4: [
    [0, 4],
    [5, 2],
    [3, 1]
  ],
  5: [
    [1, 3],
    [3, 3],
    [4, 2]
  ],
  6: [
    [0, 3],
    [2, 1]
  ]
}

/** Opens on the tonic and leans home on its last chord, so a loop of it lands. */
export const progressionOf = (random: Random, length: number): number[] => {
  const degrees = [0]

  while (degrees.length < length) {
    const last = degrees.at(-1) ?? 0
    const isLast = degrees.length === length - 1
    const next = pickWeighted(random, NEXT_DEGREE[last] ?? [[0, 1]])

    degrees.push(isLast && next === 0 ? 4 : next)
  }

  return degrees
}

/**
 * Each tone moved to the octave nearest `centre`, so one chord flows into the
 * next by steps rather than leaping a hand across the keyboard.
 */
export const voicedNear = (
  pitches: readonly number[],
  centre: number
): number[] =>
  pitches
    .map((pitch) => {
      const pitchClass = ((pitch % 12) + 12) % 12

      return centre + ((((pitchClass - centre) % 12) + 18) % 12) - 6
    })
    .toSorted((low, high) => low - high)

export const meanOf = (values: readonly number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)

/** The five tones of a key nobody can play wrong over its own chords. */
export const pentatonicOf = (key: Key): number[] => {
  const isMinor = SCALES[key.scale][2] === 3
  const steps = isMinor ? [0, 3, 5, 7, 10] : [0, 2, 4, 7, 9]

  return steps.map((step) => key.root + step)
}

/** The note of `scale` (any octave) closest to `target`. */
export const nearestIn = (scale: readonly number[], target: number): number => {
  let best = target
  let bestDistance = Number.POSITIVE_INFINITY

  for (const pitch of scale) {
    const pitchClass = ((pitch % 12) + 12) % 12

    for (let octave = -1; octave <= 1; octave++) {
      const candidate =
        target - (((target % 12) + 12) % 12) + pitchClass + octave * 12
      const distance = Math.abs(candidate - target)

      if (distance < bestDistance) {
        best = candidate
        bestDistance = distance
      }
    }
  }

  return best
}

/**
 * The beats of a bar a phrase plays on, `null` a rest — drawn from shapes a
 * hand would play, so a line breathes instead of running sixteenths.
 */
const RHYTHMS: readonly (readonly (number | null)[])[] = [
  [0, 1, 2, null],
  [0, null, 1.5, 2.5],
  [null, 0.5, 1, 2],
  [0, 0.5, 1, null, 2.5],
  [0, null, null, 2, 3],
  [1, 1.5, 2, 3],
  [0, 1.5, 3],
  [0.5, 1, 2.5]
]

export type MotifNote = { beat: number; step: number; length: number }

/**
 * A two-bar figure in steps along the pentatonic, which a section repeats and
 * bends to its chords: repetition is what makes a line a tune, and a new
 * figure each section is what keeps the tune from wearing out.
 */
export const motifOf = (random: Random): MotifNote[] => {
  const notes: MotifNote[] = []
  let step = pickFrom(random, [0, 2, 4])

  for (const bar of [0, 1]) {
    const rhythm = pickFrom(random, RHYTHMS).filter(
      (beat): beat is number => beat !== null
    )

    for (const [index, beat] of rhythm.entries()) {
      step += pickWeighted(random, [
        [-2, 1],
        [-1, 3],
        [0, 1],
        [1, 3],
        [2, 1]
      ])
      step = Math.max(-2, Math.min(7, step))

      const next = rhythm[index + 1] ?? 4

      notes.push({ beat: bar * 4 + beat, length: next - beat, step })
    }
  }

  return notes
}

/** Bar shapes a piece moves through, so it builds, breathes and winds down. */
export type Section = 'intro' | 'body' | 'lift' | 'break' | 'outro'

const SECTION_LEVEL: Readonly<Record<Section, number>> = {
  body: 0.85,
  break: 0.5,
  intro: 0.45,
  lift: 1,
  outro: 0.4
}

/**
 * One section per bar, in phrases of eight: an intro, bodies and lifts drawn
 * with the odd break between them, and a two-bar outro the next piece fades in
 * over.
 */
export const arrangementOf = (random: Random, bars: number): Section[] => {
  const sections: Section[] = []

  while (sections.length < bars) {
    const previous: Section = sections.at(-1) ?? 'intro'
    const phrase: Section =
      sections.length === 0
        ? 'intro'
        : pickWeighted<Section>(random, [
            ['body', 4],
            ['lift', previous === 'lift' ? 1 : 3],
            ['break', previous === 'break' || previous === 'intro' ? 0 : 1.5]
          ])

    for (let bar = 0; bar < 8 && sections.length < bars; bar++) {
      sections.push(phrase)
    }
  }

  sections.splice(-2, 2, 'outro', 'outro')

  return sections
}

export const levelOf = (section: Section): number => SECTION_LEVEL[section]
