/**
 * Fisher-Yates, over a copy. Every game that offers four candidates needs the
 * order to carry nothing: the answer sitting third every round is a pattern a
 * room finds within an evening.
 */
export const shuffled = <TItem>(items: readonly TItem[]): TItem[] => {
  const copy = [...items]

  for (let index = copy.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1))
    const held = copy[index]
    const other = copy[swap]

    if (held !== undefined && other !== undefined) {
      copy[index] = other
      copy[swap] = held
    }
  }

  return copy
}

export const pickRandom = <TItem>(items: readonly TItem[]): TItem | null =>
  items[Math.floor(Math.random() * items.length)] ?? null

/** Inclusive at both ends, like the range a rule states. */
export const randomIntBetween = (min: number, max: number): number =>
  min + Math.floor(Math.random() * (max - min + 1))

/** In `[0, 1)`, for a rule that takes its randomness as an argument. */
export const randomUnit = (): number => Math.random()

/**
 * A stream of units in `[0, 1)` drawn from a 32-bit seed (mulberry32), the
 * same on every device for the same seed: what lets a server send a seed and
 * every screen build the same draw from it.
 */
export const seededUnits = (seed: number): (() => number) => {
  let state = seed >>> 0

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let mixed = Math.imul(state ^ (state >>> 15), state | 1)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)

    return ((mixed ^ (mixed >>> 14)) >>> 0) / 2 ** 32
  }
}
