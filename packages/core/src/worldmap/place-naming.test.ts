import { describe, expect, it } from 'vitest'

import { nearbyDecoys, spellingsOf } from './place-naming'

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
        from: RENNES.point
      })

      expect(decoys).toHaveLength(3)
      expect(new Set(decoys).size).toBe(3)

      for (const decoy of decoys) {
        expect(BRETON_TOWNS).toContain(decoy)
      }
    }
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
