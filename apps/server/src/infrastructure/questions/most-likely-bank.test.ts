import { describe, expect, it } from 'vitest'

import {
  bankedMostLikelyLines,
  drawMostLikelyLine,
  playedMostLikelyLineId
} from './most-likely-bank'

describe('the most-likely bank', () => {
  it('[mostlikely] parses every line, each id once, in both languages', () => {
    const lines = bankedMostLikelyLines()
    const ids = lines.map(({ id }) => id)

    expect(lines.length).toBeGreaterThanOrEqual(120)
    expect(new Set(ids).size).toBe(ids.length)

    for (const { id, labels } of lines) {
      expect(labels.en, id).toMatch(/^Who .+\?$/)
      expect(labels.fr, id).toMatch(/\bqui\b.+ \?$/i)
    }
  })

  it('[mostlikely] writes no French line with “susceptible”, which agrees with nobody yet', () => {
    expect(
      bankedMostLikelyLines()
        .filter(({ labels }) => /susceptible/i.test(labels.fr))
        .map(({ id }) => id)
    ).toEqual([])
  })

  it('[mostlikely] deals a line the room has not heard, and any line once every one has been', () => {
    const lines = bankedMostLikelyLines()
    const [kept, ...rest] = lines

    if (kept === undefined) {
      throw new Error('the bank is empty')
    }

    const allButOne = new Set(rest.map(({ id }) => playedMostLikelyLineId(id)))

    expect(drawMostLikelyLine({ playedIds: allButOne })?.id).toBe(kept.id)

    const all = new Set(lines.map(({ id }) => playedMostLikelyLineId(id)))

    expect(drawMostLikelyLine({ playedIds: all })).not.toBeNull()
  })
})
