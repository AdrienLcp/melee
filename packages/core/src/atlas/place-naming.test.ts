import { describe, expect, it } from 'vitest'

import { greatCircleKm } from './distance'
import { nearbyDecoys, spellingsOf, spreadDecoys } from './place-naming'

const at = (name: string, latitude: number, longitude: number) => ({
  name,
  point: { latitude, longitude }
})

const RENNES = at('Rennes', 48.117, -1.678)
const BRETON_TOWNS = [
  at('Brest', 48.39, -4.486),
  at('Quimper', 47.996, -4.102),
  at('Vannes', 47.658, -2.76),
  at('Saint-Brieuc', 48.514, -2.765),
  at('Lorient', 47.748, -3.37),
  at('Saint-Malo', 48.649, -2.026),
  at('Laval', 48.073, -0.77),
  at('Nantes', 47.218, -1.554)
]
const FAR_AWAY = [at('Nice', 43.71, 7.262), at('Strasbourg', 48.573, 7.752)]

describe('nearbyDecoys', () => {
  it('[place-naming] draws its decoys among the nearest places, never across the map', () => {
    for (let draw = 0; draw < 20; draw += 1) {
      const decoys = nearbyDecoys({
        candidates: [RENNES, ...FAR_AWAY, ...BRETON_TOWNS],
        count: 3,
        from: RENNES.point,
        isWide: false
      })

      expect(decoys).toHaveLength(3)
      expect(new Set(decoys).size).toBe(3)

      for (const decoy of decoys) {
        expect(BRETON_TOWNS).toContain(decoy)
      }
    }
  })
})

describe('nearbyDecoys, wide', () => {
  it('[place-naming] reaches past the nearest places for a softer pick', () => {
    const drawn = new Set(
      Array.from({ length: 20 }, () =>
        nearbyDecoys({
          candidates: [RENNES, ...FAR_AWAY, ...BRETON_TOWNS],
          count: 3,
          from: RENNES.point,
          isWide: true
        })
      ).flat()
    )

    expect(FAR_AWAY.some((place) => drawn.has(place))).toBe(true)
  })
})

const FRANCE = [
  RENNES,
  ...BRETON_TOWNS,
  ...FAR_AWAY,
  at('Lille', 50.629, 3.057),
  at('Bordeaux', 44.837, -0.579),
  at('Toulouse', 43.604, 1.444),
  at('Lyon', 45.764, 4.836),
  at('Marseille', 43.296, 5.37),
  at('Dijon', 47.322, 5.041),
  at('Clermont-Ferrand', 45.778, 3.087),
  at('Ajaccio', 41.919, 8.739)
]

describe('spreadDecoys', () => {
  it('[place-naming] keeps every decoy a quarter of the map away from the answer and from each other at easy', () => {
    const diagonalKm = greatCircleKm(
      { latitude: 41.919, longitude: -4.486 },
      { latitude: 50.629, longitude: 8.739 }
    )

    for (let draw = 0; draw < 50; draw += 1) {
      const decoys = spreadDecoys({
        candidates: FRANCE,
        count: 3,
        difficulty: 'easy',
        from: RENNES.point
      })
      const points = [RENNES.point, ...decoys.map(({ point }) => point)]

      expect(decoys).toHaveLength(3)

      for (const [index, point] of points.entries()) {
        for (const other of points.slice(index + 1)) {
          expect(greatCircleKm(point, other)).toBeGreaterThanOrEqual(
            diagonalKm * 0.25
          )
        }
      }
    }
  })

  it('[place-naming] never deals a Breton town beside Rennes', () => {
    for (let draw = 0; draw < 50; draw += 1) {
      const decoys = spreadDecoys({
        candidates: FRANCE,
        count: 3,
        difficulty: 'mixed',
        from: RENNES.point
      })

      for (const decoy of decoys) {
        expect(['Laval', 'Saint-Malo', 'Vannes', 'Nantes']).not.toContain(
          decoy.name
        )
      }
    }
  })

  it('[place-naming] draws at random among the far places', () => {
    const drawn = new Set(
      Array.from({ length: 40 }, () =>
        spreadDecoys({
          candidates: FRANCE,
          count: 3,
          difficulty: 'mixed',
          from: RENNES.point
        })
      )
        .flat()
        .map(({ name }) => name)
    )

    expect(drawn.size).toBeGreaterThan(6)
  })

  it('[place-naming] gives way rather than deal fewer than asked on a crowded map', () => {
    const decoys = spreadDecoys({
      candidates: [RENNES, ...BRETON_TOWNS],
      count: 3,
      difficulty: 'easy',
      from: RENNES.point
    })

    expect(decoys).toHaveLength(3)
    expect(new Set(decoys).size).toBe(3)
  })
})

describe('spellingsOf', () => {
  it('[place-naming] accepts the abbreviated saint a table types', () => {
    expect(spellingsOf('Saint-Étienne')).toEqual([
      'Saint-Étienne',
      'St-Étienne'
    ])
    expect(spellingsOf('Sainte-Maxime')).toEqual([
      'Sainte-Maxime',
      'Ste-Maxime'
    ])
    expect(spellingsOf('Rennes')).toEqual(['Rennes'])
  })
})
