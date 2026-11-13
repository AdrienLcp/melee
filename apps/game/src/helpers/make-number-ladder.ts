/** The nearest distance the ladder parks at its far end rather than on a rung of its own: ten away pays nothing. */
export const LADDER_FAR_DISTANCE = 10

/** The rungs under the target, nearest first, then the far end. */
export const LADDER_RUNGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'far'] as const

export type LadderRungDistance = (typeof LADDER_RUNGS)[number]

export type LadderSeat<Seat> = Seat & { value: number | null }

export type LadderRung<Seat> = {
  distance: LadderRungDistance
  over: LadderSeat<Seat>[]
  under: LadderSeat<Seat>[]
}

export type Ladder<Seat> = {
  /** The seats on the target, split in two so they flank it. */
  exact: { over: LadderSeat<Seat>[]; under: LadderSeat<Seat>[] }
  rungs: LadderRung<Seat>[]
  /** The seats that hold no value yet, in seat order. */
  waiting: LadderSeat<Seat>[]
}

const rungOf = (distance: number): LadderRungDistance =>
  distance >= LADDER_FAR_DISTANCE
    ? 'far'
    : (LADDER_RUNGS[distance - 1] ?? 'far')

/**
 * Every seat put on the ruler around the target by its nearest value: on the
 * target itself, on the rung its distance names, under or over, or past nine
 * at the far end; a seat that has sent nothing waits under the ruler.
 */
export const ladderOf = <Seat>({
  seats,
  target
}: {
  seats: readonly LadderSeat<Seat>[]
  target: number
}): Ladder<Seat> => {
  const exact = seats.filter((seat) => seat.value === target)
  const half = Math.ceil(exact.length / 2)

  return {
    exact: { over: exact.slice(half), under: exact.slice(0, half) },
    rungs: LADDER_RUNGS.map((distance) => {
      const onRung = seats.filter(
        (seat) =>
          seat.value !== null &&
          seat.value !== target &&
          rungOf(Math.abs(seat.value - target)) === distance
      )

      return {
        distance,
        over: onRung.filter((seat) => (seat.value ?? 0) > target),
        under: onRung.filter((seat) => (seat.value ?? 0) < target)
      }
    }),
    waiting: seats.filter((seat) => seat.value === null)
  }
}

/**
 * How much of a seat a chip on the ruler shows, from the most to the least:
 * its name — as many whole words as fit — and its value, its name alone, its
 * initials, its pawn alone. The value goes first: the rung and the side
 * already say it to the unit.
 */
export type ChipLook = 'initials' | 'name' | 'named' | 'pawn'

const LOOK_RANK = {
  initials: 1,
  name: 2,
  named: 3,
  pawn: 0
} as const satisfies Record<ChipLook, number>

/** A chip's height with the gap under it, in its own font size: `.chip`'s `block-size` and the row gap. */
const CHIP_BLOCK_EM = 1.8
/** The pawn, the padding and the gaps around a chip's text. */
const CHIP_CHROME_EM = 2.4
/** Two initials. */
const INITIALS_EM = 1.5
/** One character of the condensed display face, read off the wall at 0.57 and taken a little wide. */
const CHARACTER_EM = 0.6
const FIGURE_GAP_EM = 0.35
const WORD_GAP_EM = 0.28
const CHIP_GAP_EM = 0.4
/** What one more whole word of a name is worth against a look kept: less than any look. */
const WORD_KEPT = 0.25

export type ChipFit = {
  fontPx: number
  /** How many lines the chips stand on, stacked when one would shrink them. */
  lines: number
  looks: ChipLook[]
  perLine: number
  /** How many of each name's words its chip shows, from the first. */
  wordCounts: number[]
}

/** A chip to fit: how long its figure is, and each word of its name, in characters. */
export type ChipToFit = { figureLength: number; wordLengths: readonly number[] }

const wordsFitting = ({
  roomEm,
  wordLengths
}: {
  roomEm: number
  wordLengths: readonly number[]
}): number => {
  let used = -WORD_GAP_EM
  let count = 0

  for (const length of wordLengths) {
    used += WORD_GAP_EM + length * CHARACTER_EM

    if (used > roomEm) {
      break
    }

    count += 1
  }

  return count
}

const chipLookFor = ({
  chip,
  widthEm
}: {
  chip: ChipToFit
  widthEm: number
}): { look: ChipLook; words: number } => {
  const figure = chip.figureLength * CHARACTER_EM + FIGURE_GAP_EM
  const withFigure = wordsFitting({
    roomEm: widthEm - CHIP_CHROME_EM - figure,
    wordLengths: chip.wordLengths
  })

  if (withFigure > 0) {
    return { look: 'named', words: withFigure }
  }

  const alone = wordsFitting({
    roomEm: widthEm - CHIP_CHROME_EM,
    wordLengths: chip.wordLengths
  })

  if (alone > 0) {
    return { look: 'name', words: alone }
  }

  return {
    look: widthEm >= CHIP_CHROME_EM + INITIALS_EM ? 'initials' : 'pawn',
    words: 0
  }
}

/**
 * How a group of chips gives way in its box: on one line at the largest
 * size the box's height allows, or stacked on as many lines as keep more of
 * each seat, every chip cut to the most it can show — whole words of its
 * name, then initials, then its pawn — never under the floor.
 */
export const chipFit = ({
  capPx,
  chips,
  floorPx,
  height,
  width
}: {
  capPx: number
  chips: readonly ChipToFit[]
  floorPx: number
  height: number
  width: number
}): ChipFit => {
  const count = Math.max(1, chips.length)
  const mostLines = Math.max(
    1,
    Math.min(count, Math.floor(height / (floorPx * CHIP_BLOCK_EM)))
  )
  const fits = Array.from({ length: mostLines }, (_, at) => at + 1).flatMap(
    (lines) => {
      const largest = Math.min(
        capPx,
        Math.max(floorPx, height / (lines * CHIP_BLOCK_EM))
      )
      const perLine = Math.ceil(count / lines)

      return [largest, floorPx].map((fontPx) => {
        const widthEm = (width / fontPx - (perLine - 1) * CHIP_GAP_EM) / perLine
        const laid = chips.map((chip) => chipLookFor({ chip, widthEm }))
        const kept = laid.reduce(
          (sum, { look, words }) => sum + LOOK_RANK[look] + words * WORD_KEPT,
          0
        )

        return {
          fit: {
            fontPx,
            lines,
            looks: laid.map(({ look }) => look),
            perLine,
            wordCounts: laid.map(({ words }) => words)
          },
          kept
        }
      })
    }
  )
  const best = fits.reduce((chosen, fit) =>
    fit.kept > chosen.kept ||
    (fit.kept === chosen.kept && fit.fit.fontPx > chosen.fit.fontPx)
      ? fit
      : chosen
  )

  return best.fit
}

/**
 * As much of a name as `roomEm` holds, in its own font size: its first whole
 * words, or its initials when not even the first fits.
 */
export const nameWithin = ({
  name,
  roomEm
}: {
  name: string
  roomEm: number
}): string => {
  const words = wordsOf(name)
  const kept = wordsFitting({
    roomEm,
    wordLengths: words.map((word) => [...word].length)
  })

  return kept === 0 ? initialsOf(name) : words.slice(0, kept).join(' ')
}

/** A name's initials, two at most, for a chip too narrow for its first word. */
export const initialsOf = (name: string): string =>
  name
    .split(/[\s-]+/u)
    .filter((word) => word.length > 0)
    .slice(0, 2)
    .map((word) => [...word][0]?.toLocaleUpperCase() ?? '')
    .join('')

/** A name's whole words, which a chip drops from the end rather than cut one. */
export const wordsOf = (name: string): string[] =>
  name.split(/\s+/u).filter((word) => word.length > 0)
